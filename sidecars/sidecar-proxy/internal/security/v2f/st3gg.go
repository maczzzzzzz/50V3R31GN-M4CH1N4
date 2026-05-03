package v2f

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"image"
	"image/draw"
	"image/png"
	"io"
)

/**
 * ◈ ST3GG_V2F : PHASE 106, TASK 2
 *
 * Sovereign Steganography Engine for Visual Second Factor (V2F).
 * Ported from crush/st3gg.go for sidecar-proxy integration.
 */

func St3ggEncode(img image.Image, payload []byte) ([]byte, error) {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// 1. Encrypt Payload
	encrypted, err := encryptPayload(payload)
	if err != nil {
		return nil, err
	}

	// 2. Wrap with Header (Magic 4b + Len 4b)
	header := make([]byte, 8)
	copy(header[0:4], "V2F!")
	binary.BigEndian.PutUint32(header[4:8], uint32(len(encrypted)))
	finalPayload := append(header, encrypted...)

	if len(finalPayload)*8 > width*height*3 {
		return nil, errors.New("payload too large for cover image")
	}

	// 3. Bit-Flipping (LSB)
	out := image.NewRGBA(bounds)
	draw.Draw(out, bounds, img, bounds.Min, draw.Src)

	bitIdx := 0
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			c := out.RGBAAt(x, y)
			channels := []*uint8{&c.R, &c.G, &c.B}

			for _, ch := range channels {
				if bitIdx < len(finalPayload)*8 {
					byteIdx := bitIdx / 8
					bitPos := uint(bitIdx % 8)
					bit := (finalPayload[byteIdx] >> (7 - bitPos)) & 1

					if bit == 1 {
						*ch |= 1
					} else {
						*ch &= ^uint8(1)
					}
					bitIdx++
				}
			}
			out.SetRGBA(x, y, c)
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, out); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func encryptPayload(data []byte) ([]byte, error) {
	// Fixed key for Sovereignty (shored in hardware usually, here mocked)
	key := sha256.Sum256([]byte("SOVEREIGN_M4CH1N4_V2F_KEY"))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	return gcm.Seal(nonce, nonce, data, nil), nil
}

func GenerateSvidToken(svid string, secretKey string) string {
	h := sha256.New()
	h.Write([]byte(svid))
	h.Write([]byte(secretKey))
	return hex.EncodeToString(h.Sum(nil))
}

func SignFrame(img image.Image, svid string, secretKey string) ([]byte, error) {
	token := GenerateSvidToken(svid, secretKey)
	return St3ggEncode(img, []byte(token))
}
