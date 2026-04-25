# Design: The Forge — Smart Asset Ingestion Engine (v3.6.4)

**Date:** 2026-04-05
**Status:** Approved
**Phase:** 29 — The Akashik Library
**Vision:** A one-shot Go CLI command that consumes raw image+JSON pairs and produces self-contained "Smart PNGs" with all world-state baked into their pixels via LSB steganography.

---

## 1. Architecture

### 1.1 New Files

Two new files added to the `crush/` package, wired into `main.go`:

```
crush/
  forge.go        — CLI pipeline: scan pairs, convert, embed, write, delete
  forge_test.go   — integration tests against real temp files
  st3gg.go        — encode/decode pure-Go LSB steganography codec
  st3gg_test.go   — unit tests: round-trip, CRC32 corruption, capacity boundaries
```

### 1.2 Command Interface

```
crush forge run [--ingestion-dir <path>] [--assets-dir <path>]
```

Defaults:
- `--ingestion-dir`: `data/ingestion/`
- `--assets-dir`: `data/assets/`

### 1.3 Pipeline (forge.go)

For each `.json` file found in `ingestion-dir`:

1. Check for same-stem image file (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`)
2. Decode image → force-convert to lossless RGBA PNG in memory (Go `image` stdlib)
3. Read JSON bytes, compute CRC32, build wire payload
4. ST3GG-encode payload into PNG buffer
5. Write Smart PNG to `<assets-dir>/<stem>.png`
6. Delete both source files from `ingestion-dir`
7. Print per-asset result line

Per-asset output format:
```
[OK]      adam_smasher.png  (4.2 KB → 4.2 KB, 312 payload bytes)
[SKIP]    orphan.json       (no matching image found)
[FAIL]    bad_map.jpg       (payload 18432 bytes exceeds image capacity 1024 bytes)
```

Final summary:
```
Forge complete: 5 OK, 1 skipped (unpaired), 1 failed
```

---

## 2. ST3GG Go Codec (st3gg.go)

### 2.1 Wire Format

Identical row-major LSB layout as the existing Rust implementation in `zeroclaw/src/steganography/mod.rs`, extended with a CRC32 integrity trailer:

```
[4 bytes: big-endian u32 payload length]
[N bytes: raw payload]
[4 bytes: big-endian CRC32 of payload]
```

Each byte of the wire format occupies 8 consecutive RGBA channel LSBs, reading channels in row-major order (R, G, B, A of pixel 0, then pixel 1, …). Only the LSB of each channel is modified.

### 2.2 Public API

```go
// Encode embeds payload into the LSBs of a PNG image.
// Returns the modified PNG as []byte.
// Returns an error if img is not a valid PNG or payload exceeds capacity.
func Encode(imgBytes []byte, payload []byte) ([]byte, error)

// Decode extracts and CRC32-validates a payload from a ST3GG PNG.
// Returns an error if the image is not ST3GG-encoded or CRC32 fails.
func Decode(imgBytes []byte) ([]byte, error)
```

### 2.3 Capacity

`capacity_bytes = (width * height * 4) / 8 - 8`

(Total RGBA channel bits divided by 8, minus 8 bytes reserved for the length header and CRC32 trailer.)

---

## 3. Error Handling

- **Per-asset errors are non-fatal.** A failed asset is skipped; remaining pairs continue.
- **Unpaired files are never deleted.** JSON without a matching image, or image without JSON, is skipped with a `[SKIP]` warning.
- **Capacity errors** print the image dimensions, capacity, and payload size.
- **CRC32 mismatch on decode** returns a typed `ErrCRC32Mismatch` error (usable by future `crush recover` command).
- **Source files are only deleted after confirmed successful write** to `assets-dir`.

---

## 4. Testing

### 4.1 st3gg_test.go (unit)

| Test | Description |
|------|-------------|
| `TestRoundTrip` | Encode then decode returns identical bytes |
| `TestCRC32Corruption` | Flip a pixel bit post-encode → decode returns `ErrCRC32Mismatch` |
| `TestCapacityExact` | Payload at exact capacity → success |
| `TestCapacityExceeded` | Payload + 1 byte → error returned |
| `TestZeroLengthPayload` | Empty payload encodes and decodes cleanly |

### 4.2 forge_test.go (integration)

| Test | Description |
|------|-------------|
| `TestForgeHappyPath` | Valid JPG+JSON pair → Smart PNG written, source files deleted |
| `TestForgeFormats` | JPEG, WebP, existing PNG all produce valid PNG output |
| `TestForgeUnpaired` | JSON with no image → source untouched, no output |
| `TestForgeOversizedPayload` | 8×8 image + large JSON → error, source files untouched |

---

## 5. Constraints

- **No Node A dependency.** PNG conversion and ST3GG embedding are handled entirely in Go.
- **No new external dependencies.** Uses Go stdlib `image`, `image/png`, `hash/crc32`, and `encoding/binary` only.
- **Backwards-compatible wire format.** The Go codec's output is decodable by the existing Rust `zeroclaw` ST3GG decoder. The Rust decoder reads exactly `payload_len` bytes then stops — the CRC32 trailer bytes sit beyond that range and are silently ignored. The Rust decoder will not validate CRC32 until zeroclaw is updated to expect the trailer; this is a known gap flagged for a future zeroclaw patch.

---

*Designed by Claude Sonnet + Gemini CLI. Phase 29 — The Akashik Library.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
