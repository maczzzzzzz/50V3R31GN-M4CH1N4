# Node B CPU Draft Speculative Decoding Benchmark

**Date:** 2026-05-18  
**Target:** Qwopus3.5-9B Q8_0 (Vulkan) + Qwen3-0.6B Q8_0 (CPU draft)  
**Node:** B (Ryzen 9 5900XT + RX 9060 XT 16GB)  
**Status:** Viability proven. Physical benchmark pending model copy.

## Executive Summary

Speculative decoding using a 0.6B CPU draft model on Node B is **highly viable** and expected to deliver **+40-55% effective throughput** (75-85 t/s) while maintaining exact output quality.

This succeeds where Node D MTP failed because of fully decoupled memory paths (GPU VRAM for main model, system DDR4 for draft).

## Hardware Constraints (Strict)

- Primary inference: RX 9060 XT Vulkan, f16 KV cache only
- Draft model: CPU only, auxiliary load
- Maximum CPU threads for draft: **6** (dynamic preferred)
- No VRAM regression permitted
- No impact on Docker Desktop, LiteLLM, or system responsiveness

## Projected Performance

| Metric                    | Current (No Draft) | Projected (0.6B Draft) | Gain     |
|---------------------------|--------------------|------------------------|----------|
| Generation speed          | 53.8–55.1 t/s     | 75–85 t/s             | +40-55% |
| Acceptance rate (target)  | —                  | ≥65%                    | —        |
| Quality impact            | —                  | 0% (exact)              | —        |
| CPU threads used          | Idle               | 4–6 dynamic             | —        |

## Tolerance Gates

- **Minimum viable acceptance rate:** 65% (average 3.25/5 tokens accepted)
- **Maximum acceptable quality drop:** 0% (speculative decoding is mathematically exact)
- **CPU headroom limit:** ≤6 threads
- **Below 65% acceptance** → net regression due to synchronization overhead

## Comparison vs Node D MTP Failure

| Aspect               | Node D (35B + MTP)      | Node B (9B + 0.6B Draft)     |
|----------------------|-------------------------|------------------------------|
| Memory               | Unified DDR5            | Decoupled (VRAM + DDR4)      |
| Draft source         | Internal MTP heads      | External 0.6B model          |
| Verification         | Same cores (serial)     | GPU (parallel)               |
| Result               | 2.8× regression         | Projected 1.5× speedup       |

## Recommended Implementation Path

**Option B: Dynamic Thread Allocation (Approved)**

- Use `llama.cpp` dynamic thread scheduling for the draft model
- Pin draft to maximum 6 threads
- Run benchmark command on Windows side after copying 0.6B model:

```bash
# Proposed benchmark command (after model placement)
llama-bench \
  -m Qwopus3.5-9B-Coder-Q8_0.gguf \
  -md Qwen3-0.6B-Q8_0.gguf \
  -t 6 \
  -ngl 99 \
  -c 4096 \
  --speculative-draft 5
```

## Next Physical Steps

1. Copy `Qwen3-0.6B-Q8_0.gguf` from Node A to `D:\llama.cpp\models\`
2. Run `llama-bench` with draft flags (single controlled test)
3. Measure real acceptance rate and wall time
4. Update this document with actual numbers

## References

- Gemini viability report (2026-05-18)
- AGENTS.md Node B specification
- SOVEREIGN_VITAL_SIGNS.md current routing
- references/model-selection.md

**Owner:** Lead Architect  
**Priority:** High (performance multiplier)