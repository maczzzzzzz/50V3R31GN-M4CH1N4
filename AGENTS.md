# AGENTS.md: The Alpha Mesh Roles (v3.7.0-ALPHA)

Active agents and hardware topology for the Stable Mesh Alpha build.

---

## GLOBAL MANDATES

- **Branch:** stable/mesh-alpha
- **Hermes-First:** High-level reasoning via stock `hermes chat`
- **TurboQuant:** Mandatory 4-bit KV-cache (q4_0) across all inference endpoints
- **Prove First, Build Second:** No new features until existing infrastructure is benchmarked
- **Single Deployment Strategy:** ik_llama.cpp native builds per-node. Docker available for future services. Nix for host config.

---

## THE MESH

### Node B -- Director (Primary Workspace)
- **Hardware:** Ryzen 9 5900XT, 16GB AMD VRAM, 48GB DDR4
- **Role:** Fast responder, code generation, workspace authority
- **Models:** Hermes-4-14B Q4_K_M (GPU, staging), Carnice-9b Q8_0 (current benchmark)
- **Backend:** ik_llama.cpp Vulkan (NOT ROCm -- consumer AMD unreliable)
- **Services:** LiteLLM mesh router (planned), Hermes TUI/Dashboard

### Node D -- Quaternary (Heavy Reasoning)
- **Hardware:** Intel Core Ultra Meteor Lake, 48GB DDR5, NPU (excluded from inference)
- **Role:** Heavy reasoning (35B MoE)
- **Models:** Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M (reasoning, 6.1 t/s gen)
- **Backend:** ik_llama.cpp AVX2
- **Note:** NPU is ~11 TOPS. Cannot run models above 3B. CPU-only inference.
- **Benchmarked:** prompt 8.8 t/s, gen 6.1 t/s (8 threads CPU-only)

### Node C -- Oracle (Perception)
- **Hardware:** Ryzen 7 3700X, RTX 2060 6GB, 32GB DDR4
- **Role:** Function-calling specialist, CUDA inference
- **Models:** Carnice-9B-Function-Calling i1-Q4_K_M (GPU, staging)
- **Backend:** ik_llama.cpp CUDA (building)
- **OS:** NixOS 25.11 (Xantusia), NVIDIA 580.142, CUDA 13.0
- **Tailscale:** 100.102.109.81

### Node A -- Synapse (State)
- **Hardware:** GTX 1050 Ti 4GB, 16GB RAM
- **Role:** KV-cache spillover, hermes-lcm state persistence
- **Note:** No model inference. Memory and cache only.

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
::/5Y573M-N071C3 : AGENTS_V3_7_ALPHA. HONEST_SPECS_ONLY. // 50V3R31GN-M4CH1N4
