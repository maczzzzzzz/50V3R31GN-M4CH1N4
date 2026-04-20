package main

import (
	"bytes"
	"errors"
	"image"
	"image/png"
	"testing"
)

// makeTestImage creates a white RGBA image for ST3GG tests.
func makeTestImage(w, h int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for i := range img.Pix {
		img.Pix[i] = 255
	}
	return img
}

// corruptOnePayloadBit decodes pngBytes, flips the LSB of channel index 32
// (the first bit of the first payload byte after the 4-byte length header),
// and re-encodes to PNG. Used to simulate a single-bit payload corruption.
//
// We read raw Pix bytes directly — no draw.Draw — to avoid premultiplication
// changing channel values when some alpha bytes are 254 (non-opaque).
func corruptOnePayloadBit(t *testing.T, pngBytes []byte) []byte {
	t.Helper()
	img, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		t.Fatalf("corruptOnePayloadBit decode: %v", err)
	}
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	// Grab the raw pixel bytes without any color-model conversion.
	var pix []byte
	switch v := img.(type) {
	case *image.RGBA:
		pix = make([]byte, len(v.Pix))
		copy(pix, v.Pix)
	case *image.NRGBA:
		pix = make([]byte, len(v.Pix))
		copy(pix, v.Pix)
	default:
		t.Fatalf("corruptOnePayloadBit: unexpected image type %T", img)
	}

	pix[32] ^= 1 // bit 32 = first bit of first payload byte

	// Re-encode via NRGBA to preserve raw bytes faithfully.
	out := image.NewNRGBA(image.Rect(0, 0, w, h))
	copy(out.Pix, pix)
	var buf bytes.Buffer
	if err := png.Encode(&buf, out); err != nil {
		t.Fatalf("corruptOnePayloadBit encode: %v", err)
	}
	return buf.Bytes()
}

func TestSt3ggRoundTrip(t *testing.T) {
	img := makeTestImage(64, 64)
	payload := []byte(`{"faction":"Maelstrom","hp":30,"sp":7}`)

	pngBytes, err := St3ggEncode(img, payload)
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	got, err := St3ggDecode(pngBytes)
	if err != nil {
		t.Fatalf("Decode: %v", err)
	}
	if !bytes.Equal(got, payload) {
		t.Errorf("round-trip mismatch: got %q, want %q", got, payload)
	}
}

func TestSt3ggZeroLengthPayload(t *testing.T) {
	img := makeTestImage(32, 32)

	pngBytes, err := St3ggEncode(img, []byte{})
	if err != nil {
		t.Fatalf("Encode empty: %v", err)
	}
	got, err := St3ggDecode(pngBytes)
	if err != nil {
		t.Fatalf("Decode empty: %v", err)
	}
	if len(got) != 0 {
		t.Errorf("expected empty payload, got %d bytes", len(got))
	}
}

func TestSt3ggCapacityExact(t *testing.T) {
	// 64x64: st3ggCapacity(64,64) = (64*64*4)/8 - 8 = 2048 - 8 = 2040
	img := makeTestImage(64, 64)
	cap := st3ggCapacity(64, 64) // 2040
	payload := bytes.Repeat([]byte("X"), cap)

	if _, err := St3ggEncode(img, payload); err != nil {
		t.Errorf("exact capacity should succeed, got: %v", err)
	}
}

func TestSt3ggCapacityExceeded(t *testing.T) {
	// 64x64: capacity = 2040, send 2041
	img := makeTestImage(64, 64)
	cap := st3ggCapacity(64, 64) // 2040
	payload := bytes.Repeat([]byte("X"), cap+1)

	if _, err := St3ggEncode(img, payload); err == nil {
		t.Error("expected error for oversized payload, got nil")
	}
}

func TestSt3ggIntegrityCorruption(t *testing.T) {
	img := makeTestImage(64, 64)
	payload := []byte(`{"name":"Johnny Silverhand"}`)

	pngBytes, err := St3ggEncode(img, payload)
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	corrupted := corruptOnePayloadBit(t, pngBytes)
	_, err = St3ggDecode(corrupted)
	if !errors.Is(err, ErrIntegrityMismatch) {
		t.Errorf("expected ErrIntegrityMismatch, got: %v", err)
	}
}
