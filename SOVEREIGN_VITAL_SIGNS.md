# SOVEREIGN VITAL SIGNS (v0.1.0-alpha)

**Status:** PHASE 0 CLOSED. Phase 1 pending.
**Updated:** May 16, 2026

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
| mesh-fast | Hermes-4-14B Q4_K_M | prompt 93.2, gen 33.7 t/s | Node B Vulkan | DEPLOYED |
| mesh-heavy | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M | prompt 8.8, gen 6.1 t/s | Node D CPU | DEPLOYED |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | prompt 205.2, gen 49.9 t/s | Node C CUDA | DEPLOYED |

All routes use TurboQuant q4_0 KV-cache. LiteLLM mesh router on Node B (Docker, port 4000).

## NODE B (DIRECTOR)

| Component | Status |
|:----------|:-------|
| OS | NixOS 25.11 WSL2 |
| GPU | RX 9060 XT 16GB (Vulkan) |
| ik_llama.cpp | Vulkan build, port 8081 (Windows) |
| Model | Hermes-4-14B Q4_K_M |
| Benchmark | prompt 93.2 t/s, gen 33.7 t/s |
| TurboQuant | q4_0 KV-cache applied |
| LiteLLM | Docker container, port 4000, 3 routes |
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
| ik_llama.cpp | AVX2 CPU build, 8 threads |
| Model | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M (19.7 GB) |
| Benchmark | prompt 8.8 t/s, gen 6.1 t/s |
| NPU | ~11 TOPS, excluded from inference |

## NODE A (SYNAPSE)

| Component | Status |
|:----------|:-------|
| OS | NixOS 24.11 |
| Tailscale | 100.96.253.114 |
| Role | State persistence, cache spillover only |
| Inference | None |

## SERVICES

| Service | Location | Status |
|:--------|:---------|:-------|
| Tailscale mesh | All nodes | OPERATIONAL |
| LiteLLM router | Node B Docker (port 4000) | OPERATIONAL |
| Kanban MCP | sidecars/kanban-mcp-server/ (FastMCP stdio) | OPERATIONAL |
| Hermes fork | sidecars/hermes-agent-nous/ (submodule) | OPERATIONAL |
| directors-forge | EUTHANIZED (May 17) | REMOVED |

---
::/5Y573M-N071C3 : HONEST_BASELINE. NO_PHANTOM_SPECS. // 50V3R31GN-M4CH1N4
