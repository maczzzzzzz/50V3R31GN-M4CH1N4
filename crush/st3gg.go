package main

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"hash/crc32"
	"image"
	"image/draw"
	"image/png"
	"io"
)

// EncryptPayload encrypts data using AES-256-GCM with the provided key.
func EncryptPayload(data []byte, key string) ([]byte, error) {
	// Ensure key is 32 bytes
	keyBytes := make([]byte, 32)
	copy(keyBytes, []byte(key))

	block, err := aes.NewCipher(keyBytes)
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

// DecryptPayload decrypts data using AES-256-GCM.
func DecryptPayload(data []byte, key string) ([]byte, error) {
	keyBytes := make([]byte, 32)
	copy(keyBytes, []byte(key))

	block, err := aes.NewCipher(keyBytes)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

// ErrCRC32Mismatch is returned by St3ggDecode when the embedded CRC32 does not
// match the decoded payload. Indicates corruption or an un-encoded image.
var ErrCRC32Mismatch = errors.New("st3gg: CRC32 mismatch — payload may be corrupted")

// st3ggCapacity returns the maximum payload bytes embeddable in an image of
// the given dimensions. Wire overhead = 4-byte length header + 4-byte CRC32.
func st3ggCapacity(w, h int) int {
	return (w*h*4)/8 - 8
}

// St3ggEncode embeds payload into the LSBs of img and returns lossless PNG bytes.
//
// Wire format (row-major, 1 bit per RGBA channel LSB, MSB first per byte):
//
//	[4B big-endian uint32 payload length][N bytes payload][4B big-endian CRC32]
//
// All alpha channels are forced to 255 before encoding so that the PNG
// round-trip is lossless (fully-opaque pixels are never premultiplied by
// Go's png package, and the raw pix bytes are preserved in the NRGBA decode).
func St3ggEncode(img image.Image, payload []byte) ([]byte, error) {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	if len(payload) > st3ggCapacity(w, h) {
		return nil, fmt.Errorf("st3gg: payload %d bytes exceeds image capacity %d bytes (%dx%d)",
			len(payload), st3ggCapacity(w, h), w, h)
	}

	// Use NRGBA (non-premultiplied) so the PNG round-trip is byte-perfect.
	// Go's png.Encode stores NRGBA bytes as-is; png.Decode creates *image.NRGBA
	// with the same bytes. Encoding as *image.RGBA would cause the decoder to
	// un-premultiply, corrupting channel LSBs for non-opaque pixels.
	nrgba := image.NewNRGBA(image.Rect(0, 0, w, h))
	draw.Draw(nrgba, nrgba.Bounds(), img, bounds.Min, draw.Src)

	// Force all alpha channels to 255 before writing wire bits.
	pix := nrgba.Pix
	for i := 3; i < len(pix); i += 4 {
		pix[i] = 255
	}

	// Build wire bytes: [length u32 BE][payload][CRC32 BE]
	checksum := crc32.ChecksumIEEE(payload)
	wire := make([]byte, 4+len(payload)+4)
	binary.BigEndian.PutUint32(wire[0:4], uint32(len(payload)))
	copy(wire[4:4+len(payload)], payload)
	binary.BigEndian.PutUint32(wire[4+len(payload):], checksum)

	// Write wire bits into ALL channel LSBs including alpha (MSB first per wire byte).
	bitIdx := 0
	for _, wb := range wire {
		for b := 7; b >= 0; b-- {
			pix[bitIdx] = (pix[bitIdx] & 0xFE) | ((wb >> uint(b)) & 1)
			bitIdx++
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, nrgba); err != nil {
		return nil, fmt.Errorf("st3gg: png encode: %w", err)
	}
	return buf.Bytes(), nil
}

// St3ggDecode extracts and CRC32-validates the payload from ST3GG-encoded PNG bytes.
// Returns ErrCRC32Mismatch if the checksum fails.
func St3ggDecode(pngBytes []byte) ([]byte, error) {
	img, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		return nil, fmt.Errorf("st3gg: png decode: %w", err)
	}
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	capBytes := (w * h * 4) / 8

	// Read raw pixel bytes without draw.Draw to avoid premultiplication artifacts.
	// Go's png.Decode returns *image.RGBA for opaque RGB PNGs and *image.NRGBA
	// for RGBA PNGs; both store raw channel bytes in Pix without conversion.
	var pix []byte
	switch v := img.(type) {
	case *image.RGBA:
		pix = v.Pix
	case *image.NRGBA:
		pix = v.Pix
	default:
		rgba := image.NewRGBA(image.Rect(0, 0, w, h))
		draw.Draw(rgba, rgba.Bounds(), img, bounds.Min, draw.Src)
		pix = rgba.Pix
	}

	// readWireBytes reads nBytes from pix LSBs starting at bitOffset.
	// Reconstructs each byte MSB-first to match the encode direction.
	readWireBytes := func(bitOffset, nBytes int) []byte {
		out := make([]byte, nBytes)
		for i := 0; i < nBytes; i++ {
			var b byte
			for j := 0; j < 8; j++ {
				b = (b << 1) | (pix[bitOffset] & 1)
				bitOffset++
			}
			out[i] = b
		}
		return out
	}

	// Read 4-byte length header (bits 0–31).
	lenHeader := readWireBytes(0, 4)
	payloadLen := int(binary.BigEndian.Uint32(lenHeader))

	if 4+payloadLen+4 > capBytes {
		return nil, fmt.Errorf(
			"st3gg: embedded length %d exceeds image capacity %d bytes — not ST3GG or corrupted",
			payloadLen, capBytes,
		)
	}

	// Read payload + CRC32 starting at bit 32.
	block := readWireBytes(32, payloadLen+4)
	payload := block[:payloadLen]
	crcStored := binary.BigEndian.Uint32(block[payloadLen:])
	crcActual := crc32.ChecksumIEEE(payload)

	if crcStored != crcActual {
		return nil, ErrCRC32Mismatch
	}
	return payload, nil
}
