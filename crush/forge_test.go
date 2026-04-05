package main

import (
	"os"
	"path/filepath"
	"testing"
)

// setupIngestionDir creates a temp dir with the given files.
// Keys are filenames, values are file contents.
func setupIngestionDir(t *testing.T, files map[string]string) string {
	t.Helper()
	dir := t.TempDir()
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatalf("setup: write %s: %v", name, err)
		}
	}
	return dir
}

func TestFindPairs_HappyPath(t *testing.T) {
	dir := setupIngestionDir(t, map[string]string{
		"adam_smasher.json": `{"hp":40}`,
		"adam_smasher.jpg":  "FAKEJPEG",
	})

	pairs, unpaired, err := findPairs(dir)
	if err != nil {
		t.Fatalf("findPairs: %v", err)
	}
	if len(pairs) != 1 {
		t.Fatalf("expected 1 pair, got %d", len(pairs))
	}
	if pairs[0].Stem != "adam_smasher" {
		t.Errorf("stem = %q, want adam_smasher", pairs[0].Stem)
	}
	if len(unpaired) != 0 {
		t.Errorf("expected 0 unpaired, got %d: %v", len(unpaired), unpaired)
	}
}

func TestFindPairs_UnpairedJSON(t *testing.T) {
	dir := setupIngestionDir(t, map[string]string{
		"orphan.json": `{"note":"no image"}`,
	})

	pairs, unpaired, err := findPairs(dir)
	if err != nil {
		t.Fatalf("findPairs: %v", err)
	}
	if len(pairs) != 0 {
		t.Errorf("expected 0 pairs, got %d", len(pairs))
	}
	if len(unpaired) != 1 {
		t.Errorf("expected 1 unpaired, got %d", len(unpaired))
	}
}

func TestFindPairs_UnpairedImage(t *testing.T) {
	dir := setupIngestionDir(t, map[string]string{
		"orphan.png": "FAKEPNG",
	})

	pairs, unpaired, err := findPairs(dir)
	if err != nil {
		t.Fatalf("findPairs: %v", err)
	}
	if len(pairs) != 0 {
		t.Errorf("expected 0 pairs, got %d", len(pairs))
	}
	if len(unpaired) != 1 {
		t.Errorf("expected 1 unpaired, got %d", len(unpaired))
	}
}

func TestFindPairs_MultiplePairs(t *testing.T) {
	dir := setupIngestionDir(t, map[string]string{
		"npc_a.json": `{"name":"A"}`,
		"npc_a.jpg":  "FAKEJPEG",
		"npc_b.json": `{"name":"B"}`,
		"npc_b.png":  "FAKEPNG",
		"solo.json":  `{"name":"solo"}`, // no matching image
	})

	pairs, unpaired, err := findPairs(dir)
	if err != nil {
		t.Fatalf("findPairs: %v", err)
	}
	if len(pairs) != 2 {
		t.Errorf("expected 2 pairs, got %d", len(pairs))
	}
	if len(unpaired) != 1 {
		t.Errorf("expected 1 unpaired, got %d", len(unpaired))
	}
}

func TestFindPairs_AllImageExtensions(t *testing.T) {
	for _, ext := range []string{".jpg", ".jpeg", ".png", ".gif", ".webp"} {
		t.Run(ext, func(t *testing.T) {
			dir := setupIngestionDir(t, map[string]string{
				"asset.json":   `{"ext":"` + ext + `"}`,
				"asset" + ext: "FAKEIMAGE",
			})
			pairs, _, err := findPairs(dir)
			if err != nil {
				t.Fatalf("findPairs: %v", err)
			}
			if len(pairs) != 1 {
				t.Errorf("ext %s: expected 1 pair, got %d", ext, len(pairs))
			}
		})
	}
}
