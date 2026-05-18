# P5-T2: VibeVoice ASR Integration Plan

**Status:** TODO | **Priority:** 10 | **Updated:** 2026-05-21

---

## Overview

Integrate Microsoft's VibeVoice-ASR (47k stars) for long-form speech recognition with speaker diarization.

---

## Upstream Capabilities

| Metric | Value |
|--------|-------|
| Model | VibeVoice-ASR-7B |
| Max audio | 60 minutes single pass |
| Output | Who (speaker) + When (timestamp) + What (content) |
| Languages | 50+ |
| Custom hotwords | Yes |
| Inference | vLLM / HuggingFace Transformers |

**Key innovations:**
- Continuous speech tokenizers at 7.5 Hz frame rate
- Next-token diffusion framework
- Joint ASR + diarization + timestamping

---

## Hardware Requirements

**VibeVoice-ASR-7B:**
- ~14-16GB VRAM (7B params, FP16)
- CUDA-capable GPU required

**Deployment candidates:**
| Node | GPU | VRAM | Fit |
|------|-----|------|-----|
| Node B | RX 9060 XT | 16GB | YES (shared with inference) |
| Node C | RTX 2060 | 6GB | NO (too small) |
| Node D | None | 0GB | NO (CPU-only, MTP was 2.8x slower) |

**Recommendation:** Node B with model swapping (ASR when needed, inference otherwise) or wait for Node D RTX 5060 Ti upgrade.

---

## Integration Strategy

### Option A: Python Service (Recommended)
1. Deploy VibeVoice-ASR as Docker container on Node B
2. Expose REST API on port 8769
3. Keep existing Rust prototype as orchestration layer
4. Replace Whisper CLI calls with VibeVoice API calls

### Option B: vLLM Inference
1. Load VibeVoice-ASR-7B via vLLM
2. Higher throughput for batch processing
3. Requires dedicated GPU allocation

---

## Architecture Update

```
Current (our prototype):
  Audio → Rust wrapper → Whisper CLI → text + simple vibe_score

Proposed:
  Audio → Rust wrapper → VibeVoice-ASR-7B → structured transcription
                                ↓
                    { speaker_id, timestamp, text, confidence }
```

**What we keep:**
- Audio source priority (BLE > MobileMic > File)
- BLE hardware integration
- Request/response structures

**What changes:**
- Replace Whisper with VibeVoice-ASR
- Add speaker diarization output
- Add timestamp support
- Remove naive "vibe_score" sentiment (model provides richer output)

---

## Local Prototype Status

`crates/modules/vibevoice-asr/` is a Rust wrapper around Whisper CLI. **Keep as orchestration layer** — replace backend with VibeVoice-ASR-7B.

The prototype's value:
- Audio source abstraction (BLE priority)
- Request/response serialization
- BLE hardware integration stub

---

## Implementation Steps

### Phase 1: Standalone Service
1. Deploy VibeVoice-ASR Docker on Node B
2. Verify with test audio files
3. Benchmark latency and VRAM usage

### Phase 2: Integration
1. Update Rust prototype to call VibeVoice API
2. Add speaker/timestamp fields to ASRResponse
3. Update BLE stream handling for real-time

### Phase 3: Mesh Integration
1. Add `mesh-asr` route if needed
2. Wire into Hermes voice pipeline (P4-T1)

---

## References

- [Microsoft VibeVoice](https://github.com/microsoft/VibeVoice)
- [VibeVoice-ASR Docs](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-asr.md)
- [HuggingFace Model](https://huggingface.co/microsoft/VibeVoice-ASR)
- [vLLM Inference Guide](https://github.com/microsoft/VibeVoice/blob/main/docs/vibevoice-vllm-asr.md)

---

Sovereign Machina v0.3.13-alpha // 50V3R31GN-M4CH1N4
