# AGENTS.md: The Alpha Mesh Roles (v0.3.1-alpha)

Active agents and hardware topology for the Stable Mesh Alpha build.

---

## GLOBAL MANDATES

- **Branch:** stable/mesh-alpha
- **Hermes-First:** High-level reasoning via stock `hermes chat`
- **Prove First, Build Second:** No new features until existing infrastructure is benchmarked
- **Single Deployment Strategy:** llama.cpp native builds per-node (ik_llama.cpp where GCC < 15). Docker available for future services. Nix for host config.

---

## THE MESH

### Node B -- Director (Primary Workspace)
- **Hardware:** Ryzen 9 5900XT, RX 9060 XT 16GB, 48GB DDR4
- **Role:** Fast responder, code generation, vision perception, workspace authority
- **Models:** Hermes-4-14B Q4_K_M (GPU port 8081, mesh-fast), Qwen3-VL-2B-Instruct Q6_K (GPU port 8082, mesh-vision)
- **Backend:** llama.cpp b9190 Vulkan (upgraded from v8710)
- **Benchmark:** Hermes prompt 322 t/s gen 34.1 t/s | Qwen3-VL prompt 630 t/s gen 159 t/s (text, image verified)
- **Services:** LiteLLM mesh router (Docker Desktop, port 4000), hermes-relay (Docker Desktop, port 8767), Hermes TUI/Dashboard
- **Docker:** Docker Desktop migration COMPLETE. Native NixOS daemon DISABLED. Config `wsl.docker-desktop.enable = true` in `/etc/nixos/configuration.nix`. Use `sg docker -c "docker ..."` for docker commands (shell session lacks group).
- **VRAM:** ~10.4GB used of 16GB (Hermes 8.4GB + Qwen3-VL 1.9GB shared GPU)
- **KV Cache:** f16 (Vulkan -- q4_0 causes 39-88% regression)
- **Startup:** D:\llama.cpp\start-all.bat (both models), start-hermes.bat, start-vision.bat (individual)

### Node D -- Quaternary (Heavy Reasoning)
- **Hardware:** Intel Core Ultra Meteor Lake, 48GB DDR5, NPU (excluded from inference)
- **Role:** Heavy reasoning (35B MoE)
- **GPU Upgrade (pending):** RTX 5060 Ti 16GB OC via OCuLink (sm_120, CUDA 13.0+)
- **Model:** Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22.6 GB)
- **Backend:** llama.cpp b64b38b5 AVX2 CPU (stock build), 8 threads
- **Benchmark:** prompt 12.7 t/s, gen 7.0 t/s (MTP OFF -- net negative on CPU: 49% acceptance, 2.8x slower)
- **Upgrade Plan:** docs/planning/node-d-5060ti-upgrade.md

### Node C -- Oracle (Perception)
- **Hardware:** Ryzen 7 3700X, RTX 2060 6GB, 32GB DDR4
- **Role:** Function-calling specialist, CUDA inference
- **Models:** Carnice-9B-Function-Calling i1-Q4_K_M (GPU, mesh-function-calling)
- **Backend:** ik_llama.cpp CUDA (deployed, RPATH patched)
- **Benchmark:** prompt 205.2 t/s, gen 49.9 t/s
- **OS:** NixOS 25.11 (Xantusia), NVIDIA 580.142, CUDA 13.0
- **Tailscale:** 100.102.109.81
- **External SSD:** SOVEREIGN_SOUL mounted at /mnt/sovereign-soul (469GB ext4)

### Node A -- Synapse (State)
- **Hardware:** GTX 1050 Ti 4GB, 16GB RAM
- **Role:** KV-cache spillover, hermes-lcm state persistence
- **Note:** No model inference. Memory and cache only.
- **Tailscale:** 100.96.253.114

---

## THE ARCHITECT (GLM-5 / Z.ai)
**Interface:** Stock Hermes (hermes chat)
**Role:** Lead Architect. Orchestration authority. Surgical execution. Honest assessment.
**Subordinates:** Gemini CLI (research/audit), Claude Code (coding), Codex (batch coding)
**Details:** See LEAD_ARCHITECT.md

## THE SUBORDINATE (Gemini CLI / Google)
**Interface:** `gemini -p "task" --yolo --skip-trust`
**Role:** Worker agent. Research, audits, doc cross-reference, brainstorming. Reports to the Architect.
**Model routing:** Flash (default) for fast tasks. Pro (`-m gemini-3.1-pro-preview`) for deep reasoning.
**Skills:** `.gemini/skills/` -- systematic-debugging, writing-plans, shard-scanner, brainstorming, etc.
**Details:** See GEMINI.md

---
::/5Y573M-N071C3 : AGENTS_V3.9_ALPHA. B9190_BINARY. MTP_VALIDATED_CPU_NEGATIVE. // 50V3R31GN-M4CH1N4
