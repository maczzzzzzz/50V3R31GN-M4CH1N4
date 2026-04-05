package main

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

// makeSmallPNG creates a valid 32x32 white PNG for forge integration tests.
// 32x32 capacity: st3ggCapacity(32,32) = (32*32*4)/8 - 8 = 512 - 8 = 504 bytes.
func makeSmallPNG(t *testing.T) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 32, 32))
	draw.Draw(img, img.Bounds(), &image.Uniform{C: color.White}, image.Point{}, draw.Src)
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("makeSmallPNG: %v", err)
	}
	return buf.Bytes()
}

func TestForgeAsset_HappyPath(t *testing.T) {
	ingestionDir := t.TempDir()
	assetsDir := t.TempDir()
	pngData := makeSmallPNG(t)
	payload := `{"faction":"Nomad","hp":35}`

	imgPath := filepath.Join(ingestionDir, "v.png")
	jsonPath := filepath.Join(ingestionDir, "v.json")
	if err := os.WriteFile(imgPath, pngData, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(jsonPath, []byte(payload), 0o644); err != nil {
		t.Fatal(err)
	}

	pair := forgePair{Stem: "v", ImagePath: imgPath, JsonPath: jsonPath}
	if err := forgeAsset(pair, assetsDir); err != nil {
		t.Fatalf("forgeAsset: %v", err)
	}

	// Output Smart PNG must exist.
	outPath := filepath.Join(assetsDir, "v.png")
	if _, err := os.Stat(outPath); err != nil {
		t.Fatalf("output not found: %v", err)
	}

	// Source files must be deleted.
	if _, err := os.Stat(imgPath); !os.IsNotExist(err) {
		t.Error("source image was not deleted")
	}
	if _, err := os.Stat(jsonPath); !os.IsNotExist(err) {
		t.Error("source json was not deleted")
	}

	// Embedded payload must decode correctly.
	outBytes, err := os.ReadFile(outPath)
	if err != nil {
		t.Fatal(err)
	}
	decoded, err := St3ggDecode(outBytes)
	if err != nil {
		t.Fatalf("St3ggDecode on output: %v", err)
	}
	if string(decoded) != payload {
		t.Errorf("payload mismatch: got %q, want %q", decoded, payload)
	}
}

func TestForgeAsset_OversizedPayload(t *testing.T) {
	ingestionDir := t.TempDir()
	assetsDir := t.TempDir()

	// 4x4 PNG: st3ggCapacity(4,4) = (4*4*4)/8 - 8 = 0 bytes — any non-empty payload overflows.
	tiny := image.NewRGBA(image.Rect(0, 0, 4, 4))
	var tinyBuf bytes.Buffer
	png.Encode(&tinyBuf, tiny)

	imgPath := filepath.Join(ingestionDir, "tiny.png")
	jsonPath := filepath.Join(ingestionDir, "tiny.json")
	os.WriteFile(imgPath, tinyBuf.Bytes(), 0o644)
	os.WriteFile(jsonPath, []byte(`{"note":"too big"}`), 0o644)

	pair := forgePair{Stem: "tiny", ImagePath: imgPath, JsonPath: jsonPath}
	if err := forgeAsset(pair, assetsDir); err == nil {
		t.Fatal("expected error for oversized payload, got nil")
	}

	// Source files must NOT be deleted on failure.
	if _, err := os.Stat(imgPath); os.IsNotExist(err) {
		t.Error("source image was incorrectly deleted on failure")
	}
	if _, err := os.Stat(jsonPath); os.IsNotExist(err) {
		t.Error("source json was incorrectly deleted on failure")
	}
}

func TestForgeRun_Summary(t *testing.T) {
	ingestionDir := t.TempDir()
	assetsDir := t.TempDir()
	pngData := makeSmallPNG(t)

	// Two valid pairs.
	for _, stem := range []string{"npc_a", "npc_b"} {
		os.WriteFile(filepath.Join(ingestionDir, stem+".png"), pngData, 0o644)
		os.WriteFile(filepath.Join(ingestionDir, stem+".json"),
			[]byte(`{"name":"`+stem+`"}`), 0o644)
	}
	// One unpaired JSON.
	os.WriteFile(filepath.Join(ingestionDir, "orphan.json"), []byte(`{}`), 0o644)

	cfg := ForgeConfig{IngestionDir: ingestionDir, AssetsDir: assetsDir}
	ok, skipped, failed := forgeRun(cfg)

	if ok != 2 {
		t.Errorf("ok = %d, want 2", ok)
	}
	if skipped != 1 {
		t.Errorf("skipped = %d, want 1", skipped)
	}
	if failed != 0 {
		t.Errorf("failed = %d, want 0", failed)
	}
}
