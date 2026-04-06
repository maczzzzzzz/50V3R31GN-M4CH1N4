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
		if info.IsDir() || !strings.HasSuffix(path, ".md") {
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
		cover := createNoiseImage(512, 512) // Larger cover for MD files
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
		if info.IsDir() || !strings.HasSuffix(path, ".md.png") {
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

		// 3. Restore .md
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
