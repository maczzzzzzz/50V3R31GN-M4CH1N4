# SOVEREIGN VITAL SIGNS (v0.3.13-alpha)

**Status:** PHASE 3 CLOSED. Phase 4 PLANNED. Phase 5 PLANNED.
**Updated:** May 21, 2026

---

## MESH STATUS (ZERO-TRUST ARTERY)

| Node | Identity | IP (Tailscale) | Hardware | Role | Status |
|:-----|:---------|:---------------|:---------|:-----|:-------|
| **Node A** | Synapse | `100.96.253.114` | GTX 1050 Ti / 4GB VRAM / 16GB RAM | KV-cache spillover / State persistence | ONLINE |
| **Node B** | Director | `100.66.173.31` | Ryzen 9 5900XT / RX 9060 XT 16GB / 48GB DDR4 | Fast responder / Workspace | ONLINE |
| **Node C** | Oracle | `100.102.109.81` | Ryzen 7 3700X / RTX 2060 6GB / 32GB DDR4 | Function-calling / CUDA inference | ONLINE |
| **Node D** | Quaternary | `100.120.225.12` | Meteor Lake / 48GB DDR5 / NPU (11 TOPS) | Heavy reasoning | ONLINE |

## COGNITIVE LAYER

| Route | Model | Target | Backend | Status |
|:------|:------|:-------|:--------|:-------|
| mesh-fast | Qwopus3.5-9B Q8_0 | prompt 322, gen 34.1 t/s | Node B Vulkan (b9190) | DEPLOYED |
| mesh-vision | Qwen3-VL-2B-Instruct Q6_K | prompt 630, gen 159 t/s (text) | Node B Vulkan (b9190, port 8082) | DEPLOYED |
| mesh-heavy | Qwen3.5-35B-A3B-MTP UD-Q4_K_M | prompt 12.7, gen 7.0 t/s | Node D Stock llama.cpp (b64b38b5) | DEPLOYED |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | prompt 205.2, gen 49.9 t/s | Node C CUDA | DEPLOYED |
|| mesh-micro | Qwen3-0.6B Q8_0 | prompt 169, gen 46.8 t/s | Node A CPU (b9219) | DEPLOYED |

LiteLLM mesh router on Node B (Docker Desktop, port 4000). 5 routes. Vulkan nodes use f16 KV cache (q4_0 causes 39-88% regression on AMD).

## NODE B (DIRECTOR)

| Component | Status |
|:----------|:-------|
| OS | NixOS 25.11 WSL2 |
| GPU | RX 9060 XT 16GB (Vulkan) |
| llama.cpp | b9190 Vulkan build (upgraded from v8710) |
| Models | Qwopus3.5-9B Q8_0 + Qwen3-VL-2B Q6_K (shared GPU ~10.4GB of 16GB) |
| Benchmark | Hermes: 428-441 t/s prompt, 53.8-55.1 t/s gen | Qwen3-VL text: 630/159 t/s |
| KV Cache | f16 (Vulkan -- q4_0 causes regression) |
| LiteLLM | Docker Desktop container, port 4000, 4 routes |
| Docker | Native NixOS daemon DISABLED. Using Docker Desktop |
| Tailscale | 100.66.173.31 |

## NODE C (ORACLE)

| Component | Status |
|:----------|:-------|
| OS | NixOS 25.11 (Xantusia) |
| NVIDIA Driver | 580.142, CUDA 13.0 |
| Tailscale | 100.102.109.81 |
| ik_llama.cpp | CUDA sm_75 build (RPATH patched) |
| Model | Carnice-9B-FC i1-Q4_K_M, port 8081 |
| Benchmark | prompt 205.2 t/s, gen 49.9 t/s |
| External SSD | SOVEREIGN_SOUL 469GB mounted at /mnt/sovereign-soul |

## NODE D (QUATERNARY)

| Component | Status |
|:----------|:-------|
| OS | NixOS bare metal |
| GPU | RESEARCH COMPLETE: RTX 5060 Ti 16GB via OCuLink (plan saved, NOT YET PURCHASED) |
| llama.cpp | Stock b64b38b5 AVX2 CPU build, 8 threads |
| Model | Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22.6 GB) |
| Benchmark | prompt 12.7 t/s, gen 7.0 t/s (MTP OFF -- net negative on CPU) |
| NPU | ~11 TOPS, excluded from inference |

## NODE A (SYNAPSE)

| Component | Status |
|:----------|:-------|
| OS | NixOS 24.11 |
| Tailscale | 100.96.253.114 |
|| Role | State persistence, cache spillover, mesh-micro inference ||
|| Inference | Qwen3-0.6B Q8_0 CPU (b9219, port 8080) ||

## SERVICES

| Service | Location | Status |
|:--------|:---------|:-------|
| Tailscale mesh | All nodes | OPERATIONAL |
| LiteLLM router | Node B Docker Desktop (port 4000) | OPERATIONAL |
| hermes-relay | Node B Docker Desktop (port 8767) | OPERATIONAL |
| Kanban MCP | sidecars/kanban-mcp-server/ (FastMCP stdio) | LIVE |
| Hermes fork | sidecars/hermes-agent-nous/ (submodule) | OPERATIONAL |
| directors-forge | EUTHANIZED (May 17) | REMOVED |
| Gemini CLI | Connected to kanban MCP | LIVE |
| sovereign-sniffer | sidecars/sniffer/ (capture + triage) | DEPLOYED |

---
::/5Y3R31GN-M4CH1N4 : HONEST_BASELINE. NO_PHANTOM_SPECS. // 50V3R31GN-M4CH1N4
