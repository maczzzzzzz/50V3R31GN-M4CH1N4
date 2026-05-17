# Node D Hardware Upgrade Research: RTX 5060 Ti 16GB via OCuLink

**Date:** 2025-05-17 (Session research)
**Researcher:** Gemini 3.1 Pro (dispatched by Lead Architect GLM-5)
**Status:** Research complete, awaiting Architect review

---

## OVERALL RECOMMENDATION: NO-GO for 35B MoE / CONDITIONAL GO for 14B-27B Models

The RTX 5060 Ti 16GB is a capable Blackwell GPU, but the combination of 16GB VRAM limit and OCuLink bandwidth constraint makes it unsuitable for the current 35B MoE model. Pivot to smaller models (14B-27B) or aggressive Unsloth Dynamic quants for massive performance gains over CPU-only.

---

## 1. RTX 5060 Ti 16GB Hardware Specs

| Spec | RTX 5060 Ti 16GB | RTX 2060 6GB (Node C) | RX 9060 XT 16GB (Node B) |
|:-----|:-----------------|:----------------------|:-------------------------|
| Architecture | Blackwell (GB206) | Turing (TU106) | RDNA 3.5 |
| VRAM | 16GB GDDR7 @ 28 Gbps | 6GB GDDR6 | 16GB GDDR6 |
| Memory Bus | 128-bit | 192-bit | 128-bit |
| Bandwidth | **448 GB/s** | 336 GB/s | ~288 GB/s |
| Tensor Cores | 5th-gen (Blackwell) | 3rd-gen (Turing) | N/A (Vulkan coopmat) |
| CUDA CC | sm_100/sm_120 family | sm_75 | N/A |
| TGP | 180W | 160W | ~150W |

33% bandwidth advantage over Node C's RTX 2060. GDDR7 is significantly faster than GDDR6 on both existing nodes.

## 2. OCuLink Bandwidth Analysis

| Connection | Bandwidth | Notes |
|:-----------|:----------|:------|
| OCuLink (PCIe 4.0 x4) | ~8 GB/s | Standard for eGPU docks |
| Native PCIe 4.0 x16 | ~32 GB/s | Desktop motherboard |
| PCIe 5.0 x4 (if supported) | ~16 GB/s | Requires PCIe 5.0 host |

### Critical: When OCuLink Does NOT Matter
If the model fits **entirely in 16GB VRAM**, OCuLink is virtually transparent. Token generation is bound by GPU's internal 448 GB/s VRAM bandwidth. Performance degradation vs native PCIe x16: **<3%**.

### Critical: When OCuLink DESTROYS Performance
Hybrid GPU+CPU split inference requires shuffling tensor data across OCuLink for every token. At 8 GB/s, this creates catastrophic bottleneck. Generation can drop **below** current 6.1 t/s CPU-only speeds.

**Rule: Model must fit entirely in VRAM, or do not bother.**

## 3. ik_llama.cpp CUDA Compatibility

- Blackwell consumer GPUs use sm_100/sm_120 compute capability
- Requires CUDA Toolkit 12.8+ for native Blackwell support
- llama.cpp/ik_llama.cpp can fall back to PTX JIT compilation if exact sm_XX not pre-compiled
- Compile with explicit Blackwell target flag for optimal performance
- NixOS: need bleeding-edge nixpkgs for CUDA 12.8+ and matching NVIDIA driver

## 4. Model Fit Analysis (16GB VRAM Constraint)

### Current Model: 35B MoE (19.7 GB at Q4_K_M) -- DOES NOT FIT

| Quant | Size | Fits 16GB? | Quality vs Q4_K_M |
|:------|:-----|:-----------|:-------------------|
| Q4_K_M | 19.7 GB | NO | baseline |
| UD-Q3_K_XS (3-bit) | ~17 GB | NO (barely) | moderate degradation |
| UD-Q2_K_XL (2-bit) | ~14 GB | YES (tight) | noticeable degradation on complex reasoning |

**Verdict on 35B MoE:** Hybrid split inference over OCuLink is fatal. 2-bit quant fits but sacrifices quality. Neither option is good.

### Recommended Models That Fit Entirely in 16GB

| Model | Quant | Size | Projected Gen t/s | Notes |
|:------|:------|:-----|:-------------------|:------|
| Qwen3.6-27B (Dense) | UD-Q3_K (3-bit) | ~15 GB | ~35-45 t/s | Max size that fits. MTP speculative decoding adds 1.4-2x speedup |
| Qwopus3.5-9B | Q6_K / Q8_0 | ~12-14 GB | ~50-65 t/s | Same model family as Node B, higher quant |
| Qwen3.6-14B | Q4_K_M / Q6_K | ~10-12 GB | ~55-70 t/s | Strong reasoning, MTP support |
| Qwen3.6-14B | Q6_K | ~12 GB | ~50-65 t/s | Best quality/size balance |
| Mistral-Small-24B | Q4_K_M | ~15 GB | ~40-50 t/s | Dense model, fills VRAM |

### Projected Throughput Comparison

| Config | Current (CPU) | Projected (OCuLink GPU) | Speedup |
|:-------|:--------------|:-------------------------|:--------|
| 35B MoE Q4_K_M (CPU) | 6.1 t/s | N/A (doesn't fit) | -- |
| 14B Q4_K_M (GPU) | N/A | 50-65 t/s | ~10x |
| 27B 3-bit (GPU + MTP) | N/A | 35-45 t/s * 1.4-2x = up to 90 t/s | ~15x |

### Hybrid GPU+CPU Split Inference
ik_llama.cpp supports `-ngl` (num GPU layers) for partial offloading. However, over OCuLink at 8 GB/s, any layer split between GPU and CPU will bottleneck generation to potentially worse than CPU-only. **Not recommended with OCuLink.**

## 5. NixOS Compatibility

- **OCuLink:** Raw PCIe extension. Completely transparent to OS. No special drivers. Appears as a standard PCIe GPU.
- **NVIDIA Driver:** Blackwell requires driver 570.xx series or newer. NixOS stable nixpkgs may lag. May need `nixos-unstable` channel or explicit `hardware.nvidia.package` override.
- **CUDA 12.8+:** Required for Blackwell native compilation. Check nixpkgs for `cudaPackages_12_8` or newer.

## 6. Power and Thermal

- RTX 5060 Ti 16GB TGP: 180W
- OCuLink enclosure: needs separate power supply (standard SFX/ATX, even 400W sufficient)
- Meteor Lake host platform: no power drain from eGPU enclosure
- Thermal: SFF-Ready Prime design is compact. Ensure enclosure has adequate airflow.

---

## GO / NO-GO DECISION MATRIX

| Scenario | Verdict | Reason |
|:---------|:--------|:-------|
| Keep 35B MoE Q4_K_M on GPU | **NO-GO** | 19.7 GB doesn't fit 16GB VRAM. Hybrid over OCuLink is fatal. |
| 35B MoE at UD-Q2_K (2-bit) | **MARGINAL** | Fits but quality loss on reasoning. Defeats purpose of heavy reasoning node. |
| Qwen3.6-27B UD-Q3_K + MTP | **GO** | Best fit for VRAM. MTP adds speculative speedup. Heavy reasoning capability preserved. |
| Qwen3.6-14B Q6_K | **STRONG GO** | Fits comfortably. ~50-65 t/s gen. 10x speedup over CPU. Room for KV cache. |
| Qwopus3.5-9B Q6_K | **GO** | Model parity with Node B at higher quality. Simple deployment. |

## OPEN QUESTIONS FOR ARCHITECT REVIEW

1. Does the Meteor Lake platform have OCuLink ports natively, or does it need a PCIe-to-OCuLink adapter card? This affects total cost and PCIe lane allocation.
2. What is Node D's current PSU wattage? 180W GPU + enclosure PSU adds to power budget.
3. Is losing the 35B MoE model acceptable for the heavy reasoning role, or is the model itself a hard requirement?
4. Qwen3.6-27B at 3-bit vs Qwen3.6-14B at Q6_K -- quality vs quantity tradeoff needs benchmarking.

---

*Research by Gemini 3.1 Pro. Reviewed and filed by Lead Architect GLM-5.*
*Amazon product: https://www.amazon.ca/gp/product/B0F4RVCY79/*
*Unsloth Dynamic 2.0: https://unsloth.ai/docs/basics/unsloth-dynamic-2.0-ggufs*
*Qwen3.6 MTP: https://unsloth.ai/docs/models/qwen3.6#mtp-guide*
