# AGENTS.md: The Alpha Mesh Roles (v0.4.0-alpha)

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
- **Models:** Qwopus3.5-9B Q8_0 (GPU port 8081, mesh-fast), Qwen3-VL-2B-Instruct Q6_K (GPU port 8082, mesh-vision)
- **Backend:** llama.cpp b9190 Vulkan (upgraded from v8710)
- **Benchmark:** Hermes prompt 322 t/s gen 34.1 t/s | Qwen3-VL prompt 630 t/s gen 159 t/s (text, image verified)
- **Services:** LiteLLM mesh router (Docker Desktop, port 4000), Hermes TUI/Dashboard
- **Docker:** Docker Desktop migration COMPLETE. Native NixOS daemon DISABLED. Config `wsl.docker-desktop.enable = true` in `/etc/nixos/configuration.nix`. Use `sg docker -c "docker ..."` for docker commands (shell session lacks group).
- **VRAM:** ~10.4GB used of 16GB (Hermes 8.4GB + Qwen3-VL 1.9GB shared GPU)
- **KV Cache:** f16 (Vulkan -- q4_0 causes 39-88% regression)
- **Startup:** D:\llama.cpp\start-all.bat (both models), start-hermes.bat, start-vision.bat (individual)

### Node D -- Quaternary (Heavy Reasoning)
- **Hardware:** Intel Core Ultra 5 125U (Meteor Lake, 14c), 48GB DDR5, RTX 5060 Ti 16GB OC via OCuLink (sm_120, CUDA 13.2)
- **Role:** Heavy reasoning (35B MoE)
- **Model:** Carnice-Qwen3.6-MoE-35B-A3B-APEX-MTP-I-Mini (12.8 GB)
- **Backend:** llama.cpp b39a7bf (9245) CUDA, 12 threads, -ngl 99 (full GPU offload)
- **Benchmark (GPU, APEX I-Mini):** prompt ~580 t/s, gen 118 t/s (full GPU, no CPU split)
- **Benchmark (GPU legacy, UD-Q4_K_M):** prompt ~300 t/s, gen 26.2 t/s (-ncmoe 30)
- **GPU Config:** All layers on GPU (13.75 GB VRAM of 16.3 GB). MTP OFF (44% acceptance, net regression). No -ncmoe needed.
- **OS:** NixOS 26.05 (Yarara), kernel 6.18.31, NVIDIA 595.71.05 open
- **Tailscale:** 100.120.225.12 | LAN: 10.0.0.13 | SSH: mesh-d/maczz
- **Startup:** ~/start-llama.sh (LD_LIBRARY_PATH=/run/opengl-driver/lib required)

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
- **Hardware:** GTX 1050 Ti 4GB, 16GB RAM, i7-7700HQ 4c/8t
- **Role:** mesh-micro inference, KV-cache spillover
- **Model:** Qwen3-0.6B Q8_0 (610MB)
- **Backend:** llama.cpp b9219 CPU
- **Benchmark:** prompt 169 t/s, gen 46.8 t/s
- **OS:** NixOS 24.11, kernel 6.6.94 (rolled back from crashing 6.12.87)
- **Tailscale:** 100.96.253.114
- **SSH alias:** mesh-a, user: maczz
- **Service:** llama-micro.service (user systemd, linger enabled)

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
::/5Y573M-N071C3 : AGENTS_V3.13_ALPHA. PHASE_3_CLOSED. HERMES_LCM_FUNCTIONAL. // 50V3R31GN-M4CH1N4
