package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"image/png"
	"os"
)

/**
 * ◈ IDENTITY_ST3GG : PHASE 106, TASK 2
 *
 * Integrates ST3GG steganography with SPIFFE SVIDs.
 * Embeds signed validation tokens into visual telemetry frames.
 */

// EmbedSvidToken embeds an SVID-signed token into a PNG cover image.
func EmbedSvidToken(coverPath string, svid string, secretKey string, outPath string) error {
	// 1. Load Cover Image
	f, err := os.Open(coverPath)
	if err != nil {
		return fmt.Errorf("open cover: %w", err)
	}
	defer f.Close()

	img, err := png.Decode(f)
	if err != nil {
		return fmt.Errorf("decode png: %w", err)
	}

	// 2. Generate Validation Token (SHA-256 of SVID + Secret)
	h := sha256.New()
	h.Write([]byte(svid))
	h.Write([]byte(secretKey))
	token := hex.EncodeToString(h.Sum(nil))

	// 3. Encode via ST3GG
	encoded, err := St3ggEncode(img, []byte(token))
	if err != nil {
		return fmt.Errorf("st3gg encode: %w", err)
	}

	// 4. Save to Output
	if err := os.WriteFile(outPath, encoded, 0644); err != nil {
		return fmt.Errorf("write output: %w", err)
	}

	return nil
}

// VerifySvidToken extracts and verifies a steganographic token against an SVID.
func VerifySvidToken(encodedPath string, svid string, secretKey string) (bool, error) {
	// 1. Decode via ST3GG
	payload, err := St3ggDecodePath(encodedPath)
	if err != nil {
		return false, fmt.Errorf("st3gg decode: %w", err)
	}

	// 2. Re-calculate Expected Token
	h := sha256.New()
	h.Write([]byte(svid))
	h.Write([]byte(secretKey))
	expected := hex.EncodeToString(h.Sum(nil))

	// 3. Compare
	return string(payload) == expected, nil
}
