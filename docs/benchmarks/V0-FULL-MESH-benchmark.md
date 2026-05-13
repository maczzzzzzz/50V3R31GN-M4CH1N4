# V0 Full Mesh Benchmark Report

**Date:** 2026-05-12
**Branch:** stable/mesh-alpha v3.7.0-ALPHA
**Status:** Phase 0 -- Baseline Hardware Characterization

---

## Mesh Topology

| Node | Role | CPU | RAM | GPU | Tailscale IP | SSH |
|------|------|-----|-----|-----|-------------|-----|
| B | Director | Ryzen 9 5900XT 16C/32T | 48GB DDR4 | RX 9060 XT 16GB (Vulkan) | localhost (WSL2) | local |
| C | Oracle | Ryzen 7 3700X 8C/16T | 32GB DDR4 | RTX 2060 6GB (NO DRIVER) | 100.102.109.81 | YES |
| D | Quaternary | Ultra 5 125U 12C/14T | 48GB DDR5 | Intel iGPU (not used) | 100.120.225.12 | YES |
| A | Synapse | i7 (8th gen) 4C/8T | 16GB DDR4 | GTX 1050 Ti 4GB | 100.90.196.70 | YES |

---

## Inference Infrastructure Status

| Node | Backend | Build | Status |
|------|---------|-------|--------|
| B | llama.cpp 8710 Vulkan | Windows D:\llama.cpp\ | OPERATIONAL |
| C | NONE | No NVIDIA driver configured | BLOCKED -- needs NixOS rebuild |
| D | llama.cpp git (1ec7ba0) CPU+OpenBLAS | NixOS /home/nixos/llama.cpp/ | OPERATIONAL (models downloading) |
| A | NONE | No inference planned | Cache spillover only |

---

## Benchmark Results

### Node B (Director) -- AMD RX 9060 XT 16GB, Vulkan

| Model | Size | PP 512 (t/s) | PP 2048 (t/s) | TG 128 (t/s) | TG 512 (t/s) | KV Cache |
|-------|------|-------------|--------------|-------------|-------------|----------|
| Qwen3-14B Q6_K | 11.28 GiB | 693 | 671 | 26.1 | 26.2 | f16 |
| Qwen3-14B Q6_K | 11.28 GiB | 226 | 80 | 15.9 | 15.7 | q4_0 (BAD) |
| Carnice-9B Q8_0 | 8.86 GiB | 1,175 | 1,467 | 33.5 | -- | f16 |
| Qwen3.5-0.8B Q8_K_XL | 1.09 GiB | 12,035 | 12,320 | 170 | 179 | f16 |
| Qwen3-VL-2B Q6_K | 1.31 GiB | 6,375 | 6,071 | 176 | 174 | f16 |
| Qwen3.6-35B MoE Q4_K_M | 20.60 GiB | 100 | -- | 16.0 | -- | f16 (GPU+CPU hybrid) |

### Node D (Quaternary) -- CPU-only Simulation (14 threads, 5900XT)

| Model | Size | PP 512 (t/s) | PP 1024 (t/s) | TG 128 (t/s) | TG 256 (t/s) |
|-------|------|-------------|--------------|-------------|-------------|
| Qwen3.6-35B MoE Q4_K_M | 20.60 GiB | 158 | 169 | 9.1 | 9.1 |

Note: Simulated on Node B's 5900XT CPU. Node D's Ultra 5 125U is slower (mobile chip, lower sustained clocks). Expect 6-8 tok/s on actual Node D hardware.

### Node C (Oracle) -- NOT BENCHMARKED

RTX 2060 physically present but NixOS has no NVIDIA driver. Requires configuration.nix update and rebuild. Potential performance: RTX 2060 6GB should achieve ~20-30 tok/s with small models (4B-6B range).

---

## Critical Findings

### 1. TurboQuant (q4_0 KV) is DEAD on Vulkan
On the RX 9060 XT, q4_0 KV cache drops generation from 26 tok/s to 16 tok/s (-39%) and prompt processing from 693 to 226 tok/s (-67%). The Vulkan backend lacks optimized dequant kernels for q4_0 KV. Use f16 KV cache on all GPU nodes. Save TurboQuant for CPU-only inference (Node D) where AVX2 handles it natively.

### 2. MoE Architecture is the Multiplier
Qwen3.6-35B-A3B is 34.66B total params but only 3.6B active per token. At Q4_K_M it runs at 9 tok/s on CPU. A dense 35B model would get 2-3 tok/s. MoE is the only way to run large models on CPU at usable speeds.

### 3. Carnice-9B Outperforms Qwen3-14B for Agentic Tasks
Carnice-9B Q8_0 at 33.5 tok/s is 29% faster than Qwen3-14B at 26 tok/s. It is specifically fine-tuned on Hermes agent traces (SFT on Qwen3.5-9B with Carnice+DJLougen+Lambda datasets). For agent tool-calling workflows, Carnice may produce better results despite being a smaller model.

### 4. Carnice-V2-27B: The Dark Horse
Carnice-V2-27B is a Qwen3.6-27B fine-tune for Hermes agentic traces. IFEval improved from 85% to 90% over base. At Q4_K_M it is 15.41 GiB -- too large for Node B GPU but perfect for Node D CPU (48GB RAM). Expected ~4-6 tok/s on CPU (dense model, no MoE). Worth testing as a high-quality reasoning endpoint.

### 5. Node C is a Paperweight Without a Driver
RTX 2060 with no NVIDIA driver = wasted silicon. This is the highest-priority infrastructure fix. An RTX 2060 with 6GB VRAM can run Qwen3-4B or Gemma 4 E4B at 20+ tok/s with CUDA, which is significantly better than anything Node D can do on CPU.

---

## Model Assignment Plan (Proposed)

| Node | Primary Model | Role | Expected Speed |
|------|--------------|------|---------------|
| B | Carnice-9B Q6_K (or Q8_0) | Fast agentic responder | 33-35 tok/s |
| B | Qwen3-14B Q6_K | General reasoning | 26 tok/s |
| B | Qwen3-VL-2B Q6_K | Vision triage | 175 tok/s |
| B | Qwen3.5-0.8B Q8_K | Ultra-fast responder | 175 tok/s |
| C | Qwen3-4B Q4_K_M or Gemma 4 E4B | Secondary inference (NEEDS DRIVER) | ~25 tok/s est. |
| D | Qwen3.6-35B-A3B MoE Q4_K_M | Heavy reasoning | 6-8 tok/s est. |
| D | Carnice-V2-27B Q4_K_M | Hermes-specific reasoning | 4-6 tok/s est. |
| A | (none) | KV-cache spillover only | N/A |

---

## Action Items

1. **CRITICAL:** Install NVIDIA driver on Node C (NixOS rebuild)
2. **IN PROGRESS:** Download Qwen3.6-35B-A3B and Carnice-V2-27B to Node D (~20 min remaining)
3. **NEXT:** Benchmark both models on Node D actual hardware
4. **NEXT:** Download Carnice-9B Q6_K to Node B (upgrade from Q8_0 for more KV headroom)
5. **DEFERRED:** Set up LiteLLM mesh router once all nodes have endpoints
