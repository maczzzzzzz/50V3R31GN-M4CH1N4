# SOVEREIGN VITAL SIGNS (v3.8.0-ALPHA)

**Status:** PHASE 0 -- VALIDATION GATE (closing)
**Timestamp:** Saturday, May 17, 2026
**Purge:** 6 dead crates removed. 5 validated crates remain.

---

## MESH STATUS (ZERO-TRUST ARTERY)

| Node | Identity | IP (Tailscale) | Hardware | Role | Status |
|:-----|:---------|:---------------|:---------|:-----|:-------|
| **Node A** | Synapse | `100.90.196.70` | GTX 1050 Ti / 4GB VRAM / 16GB RAM | KV-cache spillover / State persistence | UNVERIFIED |
| **Node B** | Director | `100.66.173.31` | Ryzen 9 5900XT / 16GB AMD VRAM / 48GB DDR4 | Fast responder / Workspace | ONLINE |
| **Node C** | Oracle | `100.102.109.81` | Ryzen 7 3700X / RTX 2060 6GB / 32GB DDR4 | Function-calling / CUDA inference | ONLINE |
| **Node D** | Quaternary | `100.120.225.12` | Meteor Lake / 48GB DDR5 / NPU (11 TOPS) | Heavy reasoning | ONLINE |

## COGNITIVE LAYER

| Route | Model | Target | Backend | Status |
|:------|:------|:-------|:--------|:-------|
| mesh-fast | Hermes-4-14B Q4_K_M | prompt 93.2, gen 33.7 t/s | Node B Vulkan | BENCHMARKED |
| mesh-heavy | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M | prompt 8.8, gen 6.1 t/s | Node D CPU | BENCHMARKED |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | prompt 205.2, gen 49.9 t/s | Node C CUDA | BENCHMARKED |
| mesh-vision | (undeployed) | -- | -- | NOT DEPLOYED |
| mesh-interactive | (undeployed -- was Qwen 2.5 7B Q6_K) | -- | -- | NOT DEPLOYED |
| kv-spillover | TurboQuant q4_0 | context extension | Node A | UNBENCHMARKED |

## NODE D BENCHMARKS (VALIDATED)

| Metric | Value |
|:-------|:------|
| Model | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M (19.7 GB) |
| Prompt processing | 8.8 tok/s |
| Token generation | 6.1 tok/s |
| Backend | ik_llama.cpp AVX2, CPU-only, 8 threads |
| Hardware | Intel Core Ultra Meteor Lake, 48GB DDR5 |

## NODE C STATUS (UPDATED MAY 17)

| Component | Status |
|:----------|:-------|
| OS | NixOS 25.11 (Xantusia) |
| NVIDIA Driver | 580.142, CUDA 13.0 |
| Tailscale | 100.102.109.81, all 4 nodes visible |
| ik_llama.cpp | CUDA sm_75 build DEPLOYED (RPATH patched) |
| Model | Carnice-9B-FC i1-Q4_K_M, port 8081 |
| Benchmark | prompt 205.2 t/s, gen 49.9 t/s |
| Docker | 27.5.1, NVIDIA container toolkit enabled |
| External SSD | SOVEREIGN_SOUL 476.9GB (unmounted, fstab pending) |

## VALIDATED CRATES (5)

| Crate | Lines | Tests | Status |
|:------|:------|:------|:-------|
| mirage-vfs | 609 | 16 | Ready |
| pretext-core | 666 | 20 | Ready |
| vibevoice-asr | 570 | 9 | Needs merge |
| directors-forge | 298 | 0 | EUTHANIZED (May 17) |
| zeroboot-isolation | 130 | 0 | Needs rework |

## NPU ASSESSMENT

Intel AI Boost NPU on Node D: ~11 TOPS INT8. Insufficient for models above 3B parameters. Excluded from inference strategy. Node D compute relies on P+E cores + DDR5 bandwidth.

---
::/5Y573M-N071C3 : HONEST_BASELINE. NO_PHANTOM_SPECS. // 50V3R31GN-M4CH1N4
