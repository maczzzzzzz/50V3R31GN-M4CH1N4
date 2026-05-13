# V0 Node B Benchmark Report

**Date:** 2026-05-12
**Node:** B (Director) -- WSL2 on Windows Host
**Hardware:** AMD Ryzen 9 5900XT (16C/32T), 48GB DDR4, AMD Radeon RX 9060 XT 16GB VRAM
**GPU:** RDNA 3.5, Vulkan, fp16/bf16, KHR_coopmat matrix cores
**Backend:** llama.cpp build 8710, Vulkan backend, Flash Attention ON

---

## GPU Detection

```
ggml_vulkan: 0 = AMD Radeon RX 9060 XT (AMD proprietary driver)
  uma: 0 | fp16: 1 | bf16: 1 | warp size: 64
  shared memory: 32768 | int dot: 1 | matrix cores: KHR_coopmat
  VRAM: 16304 MiB total, 15416 MiB free
```

---

## Benchmark Results

### Qwen3-14B Q6_K (11.28 GiB) -- PRIMARY MODEL

| Test | tok/s (f16 KV) | tok/s (q4_0 KV) |
|------|---------------|-----------------|
| PP 512 | 692.70 | 225.92 |
| PP 1024 | -- | 143.50 |
| PP 2048 | 671.36 | 80.35 |
| TG 128 | 26.07 | 15.94 |
| TG 256 | 26.22 | 15.70 |

**VERDICT: 26 tok/s generation with f16 KV cache. PASSES 20 tok/s target.**
TurboQuant (q4_0 KV) HURTS performance on Vulkan -- use f16 KV only on Node B.

### Qwen3.5-0.8B Q8_K_XL (1.09 GiB) -- FAST RESPONDER

| Test | tok/s |
|------|-------|
| PP 512 | 12,035 |
| PP 2048 | 12,320 |
| PP 4096 | 12,020 |
| TG 128 | 169.77 |
| TG 512 | 178.98 |

**VERDICT: Blazing fast. 170+ tok/s generation. Sub-second response.**

### Qwen3-VL-2B Q6_K (1.31 GiB) -- VISION

| Test | tok/s |
|------|-------|
| PP 512 | 6,375 |
| PP 2048 | 6,070 |
| TG 128 | 175.72 |
| TG 512 | 174.31 |

**VERDICT: 175 tok/s generation. Fast vision triage.**

### Carnice-9B Q8_0 (8.86 GiB) -- HERMES AGENTIC

| Test | tok/s |
|------|-------|
| PP 512 | 1,175 |
| PP 2048 | 1,467 |
| TG 128 | 33.51 |
| TG 256 | 33.52 |

**VERDICT: 33.5 tok/s generation. Faster than Qwen3-14B (smaller model). Hermes-specific training.**

### Qwen3.6-35B-A3B MoE Q4_K_M (20.60 GiB) -- HYBRID OFFLOAD

| Test | tok/s |
|------|-------|
| PP 512 | 99.79 |
| TG 1 | 16.01 |

**VERDICT: Model spills to system RAM (20.6 GiB > 16 GiB VRAM). 16 tok/s is usable but degraded. This model belongs on Node D (48GB RAM, CPU-only).**

---

## Key Findings

1. **TurboQuant (q4_0 KV) is COUNTERPRODUCTIVE on Vulkan.** The dequant kernels are not optimized for RDNA 3.5. Use f16 KV cache on Node B. Save TurboQuant for Node D (CPU/AVX2).

2. **The 9060 XT is solid.** 26 tok/s for 14B Q6_K is competitive with an RTX 3060 12GB on CUDA.

3. **VRAM budget is the constraint.** 11.28 GiB model + f16 KV = ~13 GiB total. Leaves ~3 GiB headroom. Can support 2048-4096 context.

4. **Carnice-9B is surprisingly good.** 33.5 tok/s, Hermes-trained, fits with more KV headroom. Worth considering as an alternative to Qwen3-14B for agentic tasks.

---

## Carnice Model Family Assessment

| Model | Size | Fits B? | Notes |
|-------|------|---------|-------|
| Carnice-9B Q4_K_M | 5.24 GiB | YES | Also fits Node C |
| Carnice-9B Q6_K | 6.85 GiB | YES | Best quality/speed for B |
| Carnice-9B Q8_0 | 8.86 GiB | YES | Currently on disk, 33.5 tok/s |
| Carnice-V2-27B Q4_K_M | 15.41 GiB | NO | Fits Node D only |
| Carnice-V2-27B Q8_0 | 26.63 GiB | NO | Node D only |

Carnice-V2-27B is a Qwen3.6-27B fine-tune specifically for Hermes agentic traces. IFEval scores improved from 85% to 90%. Worth deploying on Node D as the reasoning model alongside Qwen3.6-35B MoE.

---

## Model Selection for Other Families

**Gemma 4 26B-A4B:** 15.64 GiB Q4_K_M. Too large for Node B (no KV room). MoE with only 4B active params but 26B total weights to load. Bad GPU utilization.

**Phi-4 14B:** 11.20 GiB Q6_K. Same weight class as Qwen3-14B. Worth testing but no clear advantage.

**Mistral Small 24B:** ~14 GiB Q4_K_M. TIGHT fit. Denser model = slower generation than 14B.

**CONCLUSION:** Stay with Qwen3 family. Carnice variants are Qwen3 fine-tunes, so they keep the same architecture/tokenizer. Do not mix model families across the mesh.
