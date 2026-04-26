# The Forge — Smart Asset Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `crush forge run` — a one-shot CLI command that scans `data/ingestion/` for JSON+image pairs, embeds the JSON into PNG pixels via LSB steganography (ST3GG), and writes Smart PNGs to `data/assets/`.

**Architecture:** Two new source files in the `crush` package: `st3gg.go` (pure-Go LSB codec with CRC32 integrity) and `forge.go` (pair scanner, asset processor, CLI runner). Tests are split across three focused test files to keep imports clean. No external dependencies beyond `golang.org/x/image` for WebP.

**Tech Stack:** Go stdlib (`image`, `image/draw`, `image/png`, `encoding/binary`, `hash/crc32`, `os`, `path/filepath`), `golang.org/x/image/webp`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `crush/st3gg.go` | `St3ggEncode`, `St3ggDecode`, `ErrCRC32Mismatch`, `st3ggCapacity` |
| Create | `crush/st3gg_test.go` | Round-trip, CRC32 corruption, capacity boundary, zero-length |
| Create | `crush/forge.go` | `ForgeConfig`, `forgePair`, `imageExts`, `findPairs`, `forgeAsset`, `forgeRun`, `runForge` |
| Create | `crush/forge_test.go` | Pair scanner tests (`TestFindPairs_*`) |
| Create | `crush/forge_integration_test.go` | Asset processor + runner tests (`TestForgeAsset_*`, `TestForgeRun_*`) |
| Create | `crush/forge_cli_test.go` | CLI entry point tests (`TestRunForge_*`) |
| Modify | `crush/go.mod` + `crush/go.sum` | Add `golang.org/x/image` |
| Modify | `crush/main.go` | Add `case "forge":` to top-level switch |

---

## Task 1: ST3GG Go Codec

**Files:**
- Create: `crush/st3gg.go`
- Create: `crush/st3gg_test.go`

### Wire Format

```
[4 bytes: big-endian uint32 payload length]
[N bytes: raw payload]
[4 bytes: big-endian CRC32 of payload]
```

Each wire byte occupies 8 consecutive RGBA channel LSBs in row-major order, MSB first per byte. Only the LSB of each channel is modified. The `payload_len` field counts only the payload bytes — the CRC32 trailer sits beyond `payload_len`, so the existing Rust zeroclaw decoder silently ignores it and remains compatible.

### Capacity formula

`st3ggCapacity(w, h) = (w * h * 4) / 8 - 8`

(Total RGBA channel bits / 8 bytes, minus 8 bytes of wire overhead for the length header and CRC32.)

---

- [ ] **Step 1: Write failing tests**

Create `crush/st3gg_test.go`:

```go
package main

import (
	"bytes"
	"errors"
	"image"
	"image/draw"
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

// corruptOnePayloadBit decodes pngBytes, flips the LSB of channel 32
// (the first bit of the first payload byte after the 4-byte length header),
// and re-encodes to PNG. Used to simulate a single-bit payload corruption.
func corruptOnePayloadBit(t *testing.T, pngBytes []byte) []byte {
	t.Helper()
	img, err := png.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		t.Fatalf("corruptOnePayloadBit decode: %v", err)
	}
	bounds := img.Bounds()
	rgba := image.NewRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(rgba, rgba.Bounds(), img, bounds.Min, draw.Src)
	rgba.Pix[32] ^= 1 // bit 32 = first bit of first payload byte
	var buf bytes.Buffer
	if err := png.Encode(&buf, rgba); err != nil {
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

func TestSt3ggCRC32Corruption(t *testing.T) {
	img := makeTestImage(64, 64)
	payload := []byte(`{"name":"Johnny Silverhand"}`)

	pngBytes, err := St3ggEncode(img, payload)
	if err != nil {
		t.Fatalf("Encode: %v", err)
	}
	corrupted := corruptOnePayloadBit(t, pngBytes)
	_, err = St3ggDecode(corrupted)
	if !errors.Is(err, ErrCRC32Mismatch) {
		t.Errorf("expected ErrCRC32Mismatch, got: %v", err)
	}
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestSt3gg" -v 2>&1 | head -20
```

Expected: compilation error — `St3ggEncode`, `St3ggDecode`, `ErrCRC32Mismatch`, `st3ggCapacity` undefined.

- [ ] **Step 3: Implement st3gg.go**

Create `crush/st3gg.go`:

```go
package main

import (
	"bytes"
	"encoding/binary"
	"errors"
	"fmt"
	"hash/crc32"
	"image"
	"image/draw"
	"image/png"
)

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
//   [4B big-endian uint32 payload length][N bytes payload][4B big-endian CRC32]
func St3ggEncode(img image.Image, payload []byte) ([]byte, error) {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	if len(payload) > st3ggCapacity(w, h) {
		return nil, fmt.Errorf("st3gg: payload %d bytes exceeds image capacity %d bytes (%dx%d)",
			len(payload), st3ggCapacity(w, h), w, h)
	}

	// Normalise to a flat RGBA buffer (stride = w*4, no padding).
	rgba := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Draw(rgba, rgba.Bounds(), img, bounds.Min, draw.Src)

	// Build wire bytes: [length u32 BE][payload][CRC32 BE]
	checksum := crc32.ChecksumIEEE(payload)
	wire := make([]byte, 4+len(payload)+4)
	binary.BigEndian.PutUint32(wire[0:4], uint32(len(payload)))
	copy(wire[4:4+len(payload)], payload)
	binary.BigEndian.PutUint32(wire[4+len(payload):], checksum)

	// Write wire bits into channel LSBs (MSB first per wire byte).
	pix := rgba.Pix
	bitIdx := 0
	for _, wb := range wire {
		for b := 7; b >= 0; b-- {
			pix[bitIdx] = (pix[bitIdx] & 0xFE) | ((wb >> uint(b)) & 1)
			bitIdx++
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, rgba); err != nil {
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

	rgba := image.NewRGBA(image.Rect(0, 0, w, h))
	draw.Draw(rgba, rgba.Bounds(), img, bounds.Min, draw.Src)
	pix := rgba.Pix

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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestSt3gg" -v
```

Expected:
```
--- PASS: TestSt3ggRoundTrip (0.00s)
--- PASS: TestSt3ggZeroLengthPayload (0.00s)
--- PASS: TestSt3ggCapacityExact (0.00s)
--- PASS: TestSt3ggCapacityExceeded (0.00s)
--- PASS: TestSt3ggCRC32Corruption (0.00s)
PASS
```

- [ ] **Step 5: Confirm full suite still passes**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./...
```

Expected: `ok github.com/50v3r31gn-m4ch1n4/crush`

- [ ] **Step 6: Commit**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4 && git add crush/st3gg.go crush/st3gg_test.go && git commit -m "$(cat <<'EOF'
feat(forge): add pure-Go ST3GG codec with CRC32 integrity

Implements St3ggEncode/St3ggDecode in the crush package. Wire format
extends the Rust zeroclaw format with a 4-byte CRC32 trailer appended
after payload_len bytes; the Rust decoder reads exactly payload_len bytes
and silently ignores the trailer, preserving backwards compatibility.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
EOF
)"
```

---

## Task 2: Image Pair Scanner

**Files:**
- Create: `crush/forge.go` (partial — `ForgeConfig`, `forgePair`, `imageExts`, `findPairs`)
- Create: `crush/forge_test.go` (pair scanner tests only)
- Modify: `crush/go.mod` + `crush/go.sum`

- [ ] **Step 1: Add WebP dependency**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go get golang.org/x/image
```

Expected: `go.mod` updated with `golang.org/x/image vX.X.X`, `go.sum` updated.

- [ ] **Step 2: Write failing pair-scanner tests**

Create `crush/forge_test.go`:

```go
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
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestFindPairs" -v 2>&1 | head -20
```

Expected: compilation error — `findPairs` undefined.

- [ ] **Step 4: Implement findPairs in forge.go**

Create `crush/forge.go`:

```go
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

// Placeholder references to keep image and bytes imports live until Task 3 adds forgeAsset.
// These lines are deleted in Task 3.
var (
	_ = bytes.NewReader
	_ = image.Decode
)
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestFindPairs" -v
```

Expected: all `TestFindPairs_*` pass.

- [ ] **Step 6: Confirm full suite still passes**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./...
```

Expected: `ok github.com/50v3r31gn-m4ch1n4/crush`

- [ ] **Step 7: Commit**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4 && git add crush/forge.go crush/forge_test.go crush/go.mod crush/go.sum && git commit -m "$(cat <<'EOF'
feat(forge): add image pair scanner and WebP dependency

findPairs scans the hot folder for same-stem JSON+image pairs across
.jpg/.jpeg/.png/.gif/.webp. Unpaired files are always preserved.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
EOF
)"
```

---

## Task 3: Asset Processor & Runner

**Files:**
- Modify: `crush/forge.go` (add `forgeAsset`, `forgeRun`, `mustFileSize`; remove placeholder vars)
- Create: `crush/forge_integration_test.go` (new file — asset + runner tests)

- [ ] **Step 1: Write failing integration tests**

Create `crush/forge_integration_test.go`:

```go
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestForgeAsset|TestForgeRun" -v 2>&1 | head -20
```

Expected: compilation error — `forgeAsset`, `forgeRun` undefined.

- [ ] **Step 3: Implement forgeAsset, forgeRun, mustFileSize in forge.go**

In `crush/forge.go`, delete the two placeholder lines:
```go
// DELETE these lines:
var (
	_ = bytes.NewReader
	_ = image.Decode
)
```

Then append the following to `crush/forge.go`:

```go
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestForgeAsset|TestForgeRun|TestFindPairs" -v
```

Expected: all `TestForgeAsset_*`, `TestForgeRun_*`, and `TestFindPairs_*` pass.

- [ ] **Step 5: Confirm full suite still passes**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./...
```

Expected: `ok github.com/50v3r31gn-m4ch1n4/crush`

- [ ] **Step 6: Commit**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4 && git add crush/forge.go crush/forge_integration_test.go && git commit -m "$(cat <<'EOF'
feat(forge): add forgeAsset pipeline and forgeRun batch runner

forgeAsset decodes any registered image format, force-converts to PNG,
embeds JSON via ST3GG, writes to data/assets/, and deletes sources only
on success. forgeRun orchestrates all pairs and returns ok/skipped/failed.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
EOF
)"
```

---

## Task 4: CLI Wiring

**Files:**
- Modify: `crush/forge.go` (append `forgeUsage`, `runForge`)
- Modify: `crush/main.go` (add `case "forge":`)
- Create: `crush/forge_cli_test.go` (CLI entry point tests)

- [ ] **Step 1: Write failing CLI tests**

Create `crush/forge_cli_test.go`:

```go
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

	// 4x4 PNG — payload overflows (st3ggCapacity = 0)
	tiny := makeTestImage(4, 4)
	var tinyBytes []byte
	{
		import_png_encode_buf := make([]byte, 0, 512)
		_ = import_png_encode_buf
		// Use st3gg encode trick: encode with empty payload to get a valid PNG
		out, err := St3ggEncode(tiny, []byte{})
		if err != nil {
			t.Fatal(err)
		}
		tinyBytes = out
	}

	os.WriteFile(filepath.Join(ingestionDir, "tiny.png"), tinyBytes, 0o644)
	os.WriteFile(filepath.Join(ingestionDir, "tiny.json"),
		[]byte(`{"note":"this payload exceeds 4x4 capacity"}`), 0o644)

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestRunForge" -v 2>&1 | head -20
```

Expected: compilation error — `runForge` undefined.

- [ ] **Step 3: Add runForge and forgeUsage to forge.go**

Append to `crush/forge.go`:

```go
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
```

- [ ] **Step 4: Wire forge into main.go**

In `crush/main.go`, locate the `case "scan":` line inside the `switch os.Args[1]` block and add `case "forge":` immediately after it:

```go
		case "scan":
			os.Exit(runScan(os.Args[2:]))

		case "forge":
			os.Exit(runForge(os.Args[2:]))
```

- [ ] **Step 5: Fix the forge_cli_test.go helper**

The `TestRunForge_RunWithFailure` test has a clunky inner block. Replace that test with a cleaner version. Open `crush/forge_cli_test.go` and replace `TestRunForge_RunWithFailure` with:

```go
func TestRunForge_RunWithFailure(t *testing.T) {
	ingestionDir := t.TempDir()
	assetsDir := t.TempDir()

	// A 4x4 image encodes to a valid PNG with st3ggCapacity = 0.
	// Any non-empty JSON will overflow it, causing forgeAsset to fail.
	tinyImg := makeTestImage(4, 4)
	tinyPNG, err := St3ggEncode(tinyImg, []byte{}) // encode empty payload → valid 4x4 PNG
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
	if code != 1 {
		t.Errorf("expected exit 1 when a pair fails, got %d", code)
	}
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./... -run "TestRunForge" -v
```

Expected:
```
--- PASS: TestRunForge_NoSubcommand (0.00s)
--- PASS: TestRunForge_UnknownSubcommand (0.00s)
--- PASS: TestRunForge_RunEmptyDir (0.00s)
--- PASS: TestRunForge_RunWithFailure (0.00s)
PASS
```

- [ ] **Step 7: Confirm full suite passes**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go test ./...
```

Expected: `ok github.com/50v3r31gn-m4ch1n4/crush`

- [ ] **Step 8: Build and smoke-test the binary**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4/crush && go build ./... && ./crush forge 2>&1 | head -8
```

Expected: prints the forge usage text starting with `Usage: crush forge run`.

- [ ] **Step 9: Commit**

```bash
cd /home/nixos/50v3r31gn-m4ch1n4 && git add crush/forge.go crush/forge_cli_test.go crush/main.go && git commit -m "$(cat <<'EOF'
feat(forge): wire crush forge run CLI command

Adds runForge entry point with --ingestion-dir and --assets-dir flags
wired into main.go dispatch. Exits 0 if all pairs succeed, 1 if any fail.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
EOF
)"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| One-shot CLI command `crush forge run` | Task 4 |
| `--ingestion-dir` / `--assets-dir` flags with defaults | Task 4 |
| Same-stem JSON+image pair matching | Task 2 |
| Supported formats: .jpg .jpeg .png .gif .webp | Task 2 |
| Force-convert any format to lossless PNG | Task 3 (`image.Decode` + `png.Encode`) |
| ST3GG LSB embedding, pure Go, no Node A | Task 1 |
| CRC32 integrity trailer | Task 1 |
| Output Smart PNG to `data/assets/<stem>.png` | Task 3 |
| Delete source files after success | Task 3 |
| Unpaired files skipped, never deleted | Task 2 + 3 |
| Per-asset `[OK]` / `[SKIP]` / `[FAIL]` output | Task 3 |
| Final summary line | Task 4 |
| Exit 1 if any failures | Task 4 |
| `ErrCRC32Mismatch` typed error for future `crush recover` | Task 1 |
| Backwards-compatible with Rust zeroclaw decoder | Task 1 (wire format choice) |


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
