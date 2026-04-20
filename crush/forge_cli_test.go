package main

import (
	"os"
	"path/filepath"
	"testing"
)

func TestRunForge_NoSubcommand(t *testing.T) {
	code := runForge([]string{})
	if code != 1 {
		t.Errorf("expected exit 1 for missing subcommand, got %d", code)
	}
}

func TestRunForge_UnknownSubcommand(t *testing.T) {
	code := runForge([]string{"bake"})
	if code != 1 {
		t.Errorf("expected exit 1 for unknown subcommand, got %d", code)
	}
}

func TestRunForge_RunEmptyDir(t *testing.T) {
	ingestionDir := t.TempDir() // no files — zero pairs, zero failures
	assetsDir := t.TempDir()

	code := runForge([]string{
		"run",
		"--ingestion-dir", ingestionDir,
		"--assets-dir", assetsDir,
	})
	if code != 0 {
		t.Errorf("expected exit 0 for empty dir, got %d", code)
	}
}

func TestRunForge_RunWithFailure(t *testing.T) {
	ingestionDir := t.TempDir()
	assetsDir := t.TempDir()

	// An 8x8 image (64 pixels -> 256 bits/32 bytes raw) has st3ggCapacity = 32 - 12 = 20 bytes.
	// Empty payload (0 bytes) fits.
	// The JSON below (27 bytes) will exceed 20 bytes capacity, causing forgeAsset to fail.
	tinyImg := makeTestImage(8, 8)
	tinyPNG, err := St3ggEncode(tinyImg, []byte{}) // encode empty payload → valid 8x8 PNG
	if err != nil {
		t.Fatal(err)
	}

	os.WriteFile(filepath.Join(ingestionDir, "tiny.png"), tinyPNG, 0o644)
	os.WriteFile(filepath.Join(ingestionDir, "tiny.json"),
		[]byte(`{"note":"exceeds 4x4 capacity"}`), 0o644)

	code := runForge([]string{
		"run",
		"--ingestion-dir", ingestionDir,
		"--assets-dir", assetsDir,
	})
	// failed > 0 → exit 1
	if code != 1 {
		t.Errorf("expected exit 1 when a pair fails, got %d", code)
	}
}
