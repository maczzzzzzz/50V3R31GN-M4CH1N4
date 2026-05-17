# SESSION HANDOFF (v0.3.5-alpha)

**Last Active Session:** 2026-05-19
**Branch:** stable/mesh-alpha
**Version:** 0.3.5-alpha

---

## MESH STATUS

All 5 routes operational. LiteLLM pinned to 1.84.0. Phase 1 CLOSED.

| Route | Target | Benchmark | Status |
|:------|:-------|:----------|:-------|
| mesh-fast | Node B Hermes-4-14B Q4_K_M (Vulkan b9190 :8081) | 322/34.1 t/s | LIVE |
| mesh-vision | Node B Qwen3-VL-2B Q6_K (Vulkan b9190 :8082) | 630/159 t/s (text) | LIVE |
| mesh-function-calling | Node C Carnice-9B-FC (CUDA :8081) | 205/49.9 t/s | LIVE |
| mesh-heavy | Node D Qwen3.5-35B-MTP UD-Q4_K_M (CPU :8080) | 12.7/7.0 t/s | LIVE |
| mesh-micro | Node A Qwen3-0.6B Q8_0 (CPU :8080) | 49/29 t/s | LIVE |

| Service | Port | Status |
|:--------|:-----|:-------|
| LiteLLM mesh router | 4000 | LIVE (pinned 1.84.0, 16 routes, socat bridge) |
| hermes-relay v0.6.1 | 8767 | LIVE (Docker Desktop) |
| socat mesh bridge | 17080/18081/18080 | LIVE (WSL host -> Tailscale) |

---

## COMPLETED THIS SESSION (0.3.3 through 0.3.5-alpha)

### v0.3.5-alpha (Provider + Agent Workflow)
- xAI Grok OAuth wired to provider pool (xai-oauth, grok-4.3, auto-refresh token).
- NixOS Playwright Chromium deps patched in configuration.nix.
- CloakBrowser/browser-use evaluated, not deployed (native browser adequate).
- Autonomous AI agents skill hierarchy reviewed for orchestration patterns.

### v0.3.4-alpha (Phase 1 Closure)
- P1-T2 Terminal Control: CLOSED. SSH keys deduplicated on A/C/D.
- P1-T3 Screen Triage: CLOSED. Documented as on-demand (sidecars/sniffer/README.md).
- TD-001: LiteLLM pinned to 1.84.0 (was floating main-latest with unpatched CVE).
- TD-004: Hardcoded secrets extracted to sidecars/mesh/.env. All configs use env var refs.
- TD-007: Directors-forge -> CANCELLED in KANBAN_MAP.
- IMPLEMENTATION_PLAN.md: P1-T2, P1-T3 marked [x] COMPLETE.
- KANBAN_MAP.md: Phase 1 upgraded from CONDITIONAL CLOSE to CLOSED.

---

## NEXT SESSION PRIORITIES

### 1. P1-T1 Vision Latency Benchmark (quick win)

Run image inference latency test through LiteLLM mesh-vision route. Needs Windows inference running (start-all.bat). ~2 min task once servers are up.

### 2. Node D GPU Physical Install (BLOCKING -- requires user)

RTX 5060 Ti 16GB OC via OCuLink. Full procedure at docs/planning/node-d-5060ti-upgrade.md:
1. Physical OCuLink dock install
2. Boot, verify lspci sees GPU
3. Install NVIDIA 580+ drivers on NixOS
4. Verify CUDA 13.0 with nvidia-smi + deviceQuery
5. Compile llama.cpp with CUDA support (sm_120)
6. Migrate Qwen3.5-35B-MTP to GPU
7. Benchmark with MTP ON (expected net positive on CUDA)
8. Update AGENTS.md + docs
9. Set up systemd service

Post-upgrade target: 3-5x speedup over CPU. MTP should become net positive.

### 3. Phase 3 Prep (if GPU blocked)

Design work that does not require hardware:
- Hermes-LCM state persistence architecture
- Mirage VFS design document
- P4-T3 Mesh-wide Verification (periodic health check system)

---

## OPEN TASKS / BLOCKERS

### Requires User Action
- **Node D GPU physical install:** RTX 5060 Ti 16GB OC + OCuLink dock. Hardware procedure.
- **Node A systemd service:** Run `sudo bash /tmp/install-service.sh` on mesh-a.
- **hermes-relay client pairing:** Phones/tablets need to connect and pair.
- **Node D /tmp/test.gguf:** 768 MB root-owned file, needs `sudo rm /tmp/test.gguf`.

### Deferred (Not Blocking)
- **Vision latency benchmark:** Needs Windows start-all.bat running.
- **socat bridge persistence:** start-mesh-bridge.sh runs manually. Needs startup sequence.
- **Node A GPU inference:** 1050 Ti 4GB marginal benefit. Revisit after Node D GPU.

---

## PHASE STATUS

- **Phase 0:** CLOSED
- **Phase 1:** CLOSED (v0.3.4-alpha)
- **Phase 2:** IN PROGRESS. GPU install is the only remaining unblocker. T2/T3 closed negative/not-feasible.
- **Phase 3:** PLANNED. Blocked on Phase 2 hardware.
- **Phase 4:** PLANNED. Blocked on Phase 3.

---

## KEY PATHS

| Item | Path |
|:-----|:-----|
| Project root | /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha |
| NixOS config | /etc/nixos/configuration.nix |
| Hermes config | ~/.hermes/config.yaml |
| LiteLLM config | sidecars/mesh/litellm-mesh.yaml |
| LiteLLM secrets | sidecars/mesh/.env (gitignored) |
| LiteLLM compose | sidecars/mesh/proxy.yml |
| socat bridge script | sidecars/mesh/start-mesh-bridge.sh |
| hermes-relay plugin | ~/.hermes/plugins/hermes-relay/ |
| Node B llama.cpp | D:\llama.cpp\ (Windows, b9190 Vulkan) |
| Node B startup scripts | D:\llama.cpp\start-all.bat, start-hermes.bat, start-vision.bat |
| Node D llama.cpp | /home/maczz/llama.cpp-latest/build/bin/llama-server (b64b38b5) |
| Node D model | Qwen3.5-35B-A3B-MTP/Qwen3.5-35B-A3B-UD-Q4_K_M.gguf |
| Node C model | ~/50V3R31GN-M4CH1N4/models/Carnice-9B-Function-Calling-i1-Q4_K_M.gguf |
| Node A model | ~/models/Qwen3-0.6B-Q8_0.gguf |
| Node A service file | /tmp/llama-micro.service (awaiting sudo install) |
| Sniffer README | sidecars/sniffer/README.md |
| GitHub Pages | https://maczzgit.github.io/50V3R31GN-M4CH1N4/ |
| 5060 Ti upgrade plan | docs/planning/node-d-5060ti-upgrade.md |

---

::/5Y573M-N071C3 : HANDOFF_V0.3.5_ALPHA. XAI_GROK_OAUTH_POOLED. PHASE_1_CLOSED. // 50V3R31GN-M4CH1N4
