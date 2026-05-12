# Hybrid Sovereign Mesh Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a stable, heterogeneous AI research cluster that combines NixOS host-level stability with the agility of Docker Compose for varied AI runtimes.

**Architecture:** 
- **Host Layer (NixOS):** Immutable base configuration covering drivers, networking (Tailscale), and core telemetry.
- **Runtime Layer (Docker Compose):** Containerized AI backends (NVIDIA CUDA, AMD ROCm, Intel OpenVINO) managed by declarative service definitions.
- **Coordination Layer:** LiteLLM remains as the primary entry point on Node B, proxying requests to local or remote Docker-managed AI runtimes via Tailscale.

**Tech Stack:** NixOS 24.11 (Stable), Docker Engine, Docker Compose, LiteLLM (Router), Tailscale.

---

## Component Mapping

| Node | Primary Hardware | Runtime Container | Primary Mesh Role |
| :--- | :--- | :--- | :--- |
| **Node A** | NVIDIA GPU | `redis` / `kv-store` | **KV-Cache & Memory Buffer** |
| **Node B** | AMD Radeon | `vllm-rocm` | **Director & Reflexive Brain (Qwen3-14B-9B)** |
| **Node C** | NVIDIA GPU | `vllm-openai` | **Voice & Perception Layer** |
| **Node D** | Intel NPU | `openvino-model-server` | **Deep Reasoner (Qwen32B-MoE)** |

---

## Design Specifications

### 1. Host Stability (NixOS)
- All nodes pinned to `nixos-24.11`.
- `virtualisation.docker.enable = true`.
- Firewall explicitly allows Tailscale and container traffic.

### 2. Runtime Agility (Docker Compose)
- Compose files stored in `sidecars/mesh/<node-id>.yml`.
- `docker-compose` projects managed via `systemd` services for auto-restart/boot-start.

### 3. Mesh Integrity (LiteLLM)
- Node B acts as the Central Routing Hub.
- `liteLLM` config maps model requests to specific mesh endpoints (e.g., `model-x` -> `http://100.120.225.12:8000`).

---

**Spec Reviewed and Committed to `docs/planning/specs/2026-05-11-hybrid-mesh-design.md`.**

Please review this design and let me know if you want to make any changes before we start writing out the implementation plan.
