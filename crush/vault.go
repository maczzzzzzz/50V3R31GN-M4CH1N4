package main

import (
	"fmt"
	"image"
	"image/color"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

// runVault handles the seal/open logic for the documentation vault.
func runVault(args []string, key string) int {
	if len(args) < 2 {
		fmt.Println("Usage: crush vault [seal|open] <target_path>")
		return 1
	}
	action := args[0]
	target := args[1]

	switch action {
	case "seal":
		return sealDirectory(target, key)
	case "open":
		return openDirectory(target, key)
	default:
		fmt.Printf("Unknown vault action: %s\n", action)
		return 1
	}
}

func sealDirectory(dir string, key string) int {
	fmt.Printf("🔒 50V3R31GN-M4CH1N4: Sealing directory [%s] into 7H3-V4UL7...\n", dir)
	
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		// Supported extensions for sealing
		validExts := []string{".md", ".json", ".png", ".txt", ".db", ".ldb", ".log"}
		isSupported := false
		base := filepath.Base(path)

		// Generic support for LevelDB control files
		if base == "CURRENT" || strings.HasPrefix(base, "MANIFEST") || base == "LOCK" || base == "LOG" || base == "LOG.old" {
			isSupported = true
		} else {
			for _, ext := range validExts {
				if strings.HasSuffix(path, ext) {
					// Avoid sealing already sealed files (e.g., .md.png, .json.png, etc.)
					if !strings.HasSuffix(path, ".md.png") &&
						!strings.HasSuffix(path, ".json.png") &&
						!strings.HasSuffix(path, ".txt.png") &&
						!strings.HasSuffix(path, ".db.png") &&
						!strings.HasSuffix(path, ".ldb.png") &&
						!strings.HasSuffix(path, ".log.png") &&
						!strings.HasSuffix(path, ".png.png") {
						isSupported = true
						break
					}
				}
			}
		}

		if !isSupported {
			return nil
		}

		fmt.Printf("  >> Sealing: %s\n", path)
		
		// 1. Read plaintext
		data, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}

		// 2. Encrypt
		encrypted, err := EncryptPayload(data, key)
		if err != nil {
			return err
		}

		// 3. Embed into a "Noise Map" PNG
		side := 512
		for (side * side * 3) / 8 < len(encrypted) + 1024 {
			side += 512
		}
		cover := createNoiseImage(side, side) // Dynamically sized cover
		outPath := path + ".png"
		
		err = St3ggEncodeToPath(cover, encrypted, outPath)
		if err != nil {
			return err
		}

		// 4. Delete original
		os.Remove(path)
		return nil
	})

	if err != nil {
		fmt.Printf("❌ Vault error: %v\n", err)
		return 1
	}

	fmt.Println("✅ 7H3-V4UL7 is now L0CK3D.")
	return 0
}

func openDirectory(dir string, key string) int {
	fmt.Printf("🔓 50V3R31GN-M4CH1N4: Opening 7H3-V4UL7 in [%s]...\n", dir)

	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		// Check if it's a sealed file we want to open
		isSealed := false
		if strings.HasSuffix(path, ".md.png") ||
			strings.HasSuffix(path, ".json.png") ||
			strings.HasSuffix(path, ".txt.png") ||
			strings.HasSuffix(path, ".db.png") ||
			strings.HasSuffix(path, ".ldb.png") ||
			strings.HasSuffix(path, ".log.png") ||
			strings.HasSuffix(path, "CURRENT.png") ||
			strings.HasSuffix(path, "LOCK.png") ||
			strings.Contains(path, "MANIFEST") && strings.HasSuffix(path, ".png") ||
			strings.HasSuffix(path, ".png.png") {
			isSealed = true
		}

		if !isSealed {
			return nil
		}

		fmt.Printf("  >> Decrypting: %s\n", path)

		// 1. Extract from PNG
		encrypted, err := St3ggDecodePath(path)
		if err != nil {
			return err
		}

		// 2. Decrypt
		plaintext, err := DecryptPayload(encrypted, key)
		if err != nil {
			return fmt.Errorf("decryption failed for %s (wrong key?): %w", path, err)
		}

		// 3. Restore original file
		outPath := strings.TrimSuffix(path, ".png")
		err = ioutil.WriteFile(outPath, plaintext, 0600)
		if err != nil {
			return err
		}

		// 4. Delete the PNG container
		os.Remove(path)
		return nil
	})

	if err != nil {
		fmt.Printf("❌ Vault error: %v\n", err)
		return 1
	}

	fmt.Println("✅ 7H3-V4UL7 is now 0P3N.")
	return 0
}

// createNoiseImage generates a simple noise image to act as a steganographic cover.
func createNoiseImage(w, h int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			// Random-ish noise pattern
			r := uint8((x ^ y) & 0xFF)
			g := uint8((x * y) & 0xFF)
			b := uint8((x + y) & 0xFF)
			img.Set(x, y, color.RGBA{r, g, b, 255})
		}
	}
	return img
}
