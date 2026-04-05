package main

import (
	"bytes"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"strings"

	_ "golang.org/x/image/webp"
)

// imageExts is the set of supported input image extensions (lower-case).
var imageExts = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
}

// ForgeConfig holds the runtime paths for a forge run.
type ForgeConfig struct {
	IngestionDir string
	AssetsDir    string
}

// forgePair represents a matched JSON + image file pair in the hot folder.
type forgePair struct {
	Stem      string
	ImagePath string
	JsonPath  string
}

// findPairs scans dir for same-stem JSON+image pairs.
// Returns matched pairs, unpaired file paths (either type without a partner), and any I/O error.
func findPairs(dir string) (pairs []forgePair, unpaired []string, err error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, nil, fmt.Errorf("forge: read dir %s: %w", dir, err)
	}

	jsonByStem := make(map[string]string)
	imageByStem := make(map[string]string)

	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		ext := strings.ToLower(filepath.Ext(name))
		stem := strings.TrimSuffix(name, filepath.Ext(name))
		full := filepath.Join(dir, name)

		switch {
		case ext == ".json":
			jsonByStem[stem] = full
		case imageExts[ext]:
			imageByStem[stem] = full
		}
	}

	for stem, jsonPath := range jsonByStem {
		if imgPath, ok := imageByStem[stem]; ok {
			pairs = append(pairs, forgePair{Stem: stem, ImagePath: imgPath, JsonPath: jsonPath})
		} else {
			unpaired = append(unpaired, jsonPath)
		}
	}
	for stem, imgPath := range imageByStem {
		if _, ok := jsonByStem[stem]; !ok {
			unpaired = append(unpaired, imgPath)
		}
	}

	return pairs, unpaired, nil
}

// forgeAsset converts one JSON+image pair into a Smart PNG in assetsDir.
// Source files are deleted only after a confirmed successful write.
// On any error, sources are preserved and the error is returned.
func forgeAsset(pair forgePair, assetsDir string) error {
	imgBytes, err := os.ReadFile(pair.ImagePath)
	if err != nil {
		return fmt.Errorf("read image: %w", err)
	}

	img, _, err := image.Decode(bytes.NewReader(imgBytes))
	if err != nil {
		return fmt.Errorf("decode image: %w", err)
	}

	jsonBytes, err := os.ReadFile(pair.JsonPath)
	if err != nil {
		return fmt.Errorf("read json: %w", err)
	}

	pngOut, err := St3ggEncode(img, jsonBytes)
	if err != nil {
		return fmt.Errorf("st3gg encode: %w", err)
	}

	if err := os.MkdirAll(assetsDir, 0o755); err != nil {
		return fmt.Errorf("mkdir assets: %w", err)
	}

	outPath := filepath.Join(assetsDir, pair.Stem+".png")
	if err := os.WriteFile(outPath, pngOut, 0o644); err != nil {
		return fmt.Errorf("write smart png: %w", err)
	}

	// Delete sources only after confirmed write.
	if err := os.Remove(pair.ImagePath); err != nil {
		return fmt.Errorf("delete source image: %w", err)
	}
	if err := os.Remove(pair.JsonPath); err != nil {
		return fmt.Errorf("delete source json: %w", err)
	}
	return nil
}

// forgeRun processes all pairs in cfg.IngestionDir and returns ok/skipped/failed counts.
func forgeRun(cfg ForgeConfig) (ok, skipped, failed int) {
	pairs, unpaired, err := findPairs(cfg.IngestionDir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[FORGE] %v\n", err)
		failed++
		return
	}

	skipped = len(unpaired)
	for _, u := range unpaired {
		fmt.Printf("[SKIP]    %s (no matching pair)\n", filepath.Base(u))
	}

	for _, pair := range pairs {
		startSize := mustFileSize(pair.ImagePath)
		if err := forgeAsset(pair, cfg.AssetsDir); err != nil {
			fmt.Printf("[FAIL]    %s (%v)\n", pair.Stem+".png", err)
			failed++
			continue
		}
		outPath := filepath.Join(cfg.AssetsDir, pair.Stem+".png")
		endSize := mustFileSize(outPath)
		fmt.Printf("[OK]      %s  (%.1f KB → %.1f KB)\n",
			pair.Stem+".png",
			float64(startSize)/1024,
			float64(endSize)/1024,
		)
		ok++
	}
	return
}

// mustFileSize returns the byte size of a file, or 0 on error.
func mustFileSize(path string) int64 {
	info, err := os.Stat(path)
	if err != nil {
		return 0
	}
	return info.Size()
}

const forgeUsage = `Usage: crush forge run [--ingestion-dir <path>] [--assets-dir <path>]

Scans the hot folder for JSON+image pairs, embeds JSON into PNG LSBs via
ST3GG steganography, and writes Smart PNGs to the assets directory.
Source files are deleted after successful embedding.

Flags:
  --ingestion-dir   Hot folder to scan (default: data/ingestion)
  --assets-dir      Smart PNG output directory (default: data/assets)

Example:
  crush forge run
  crush forge run --ingestion-dir /tmp/hot --assets-dir /tmp/smart
`

// runForge is the CLI entry point for "crush forge <subcommand>".
// Returns an exit code: 0=success, 1=error or any failed pairs.
func runForge(args []string) int {
	if len(args) == 0 || args[0] != "run" {
		fmt.Fprint(os.Stderr, forgeUsage)
		return 1
	}

	cfg := ForgeConfig{
		IngestionDir: "data/ingestion",
		AssetsDir:    "data/assets",
	}

	flags := args[1:]
	for i := 0; i < len(flags); i++ {
		switch flags[i] {
		case "--ingestion-dir":
			if i+1 < len(flags) {
				cfg.IngestionDir = flags[i+1]
				i++
			}
		case "--assets-dir":
			if i+1 < len(flags) {
				cfg.AssetsDir = flags[i+1]
				i++
			}
		}
	}

	ok, skipped, failed := forgeRun(cfg)
	fmt.Printf("\nForge complete: %d OK, %d skipped (unpaired), %d failed\n", ok, skipped, failed)
	if failed > 0 {
		return 1
	}
	return 0
}
