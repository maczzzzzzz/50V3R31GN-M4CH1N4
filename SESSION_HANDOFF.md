# SESSION HANDOFF (v0.3.2-alpha)

**Last Active Session:** 2026-05-18
**Branch:** stable/mesh-alpha
**Version:** 0.3.2-alpha

---

## MESH STATUS

All 5 routes operational. Node A promoted to inference. Socat bridge active.

| Route | Target | Benchmark | Status |
|:------|:-------|:----------|:-------|
| mesh-fast | Node B Hermes-4-14B Q4_K_M (Vulkan b9190 :8081) | 16.6/3.0 t/s | LIVE |
| mesh-vision | Node B Qwen3-VL-2B Q6_K (Vulkan b9190 :8082) | -- | LIVE |
| mesh-function-calling | Node C Carnice-9B-FC (CUDA :8081) | 180.8/51.3 t/s | LIVE |
| mesh-heavy | Node D Qwen3.5-35B-MTP UD-Q4_K_M (CPU :8080) | 13.7/7.3 t/s | LIVE |
| mesh-micro | Node A Qwen3-0.6B Q8_0 (CPU :8080) | 45.8/35.5 t/s | LIVE |

| Service | Port | Status |
|:--------|:-----|:-------|
| LiteLLM mesh router | 4000 | LIVE (5 routes, socat bridge) |
| hermes-relay v0.6.1 | 8767 | LIVE (stays on Node B) |
| socat mesh bridge | 17080/18081/18080 | LIVE (WSL host -> Tailscale) |

---

## COMPLETED THIS SESSION (0.3.2-alpha)

- Node A promoted to inference: llama.cpp built (CPU+OpenBLAS), Qwen3-0.6B Q8_0 deployed, benchmarked 49/29 t/s over Tailscale.
- mesh-micro route added to LiteLLM with aliases (micro, classify, route).
- Docker/Tailscale networking bug discovered and fixed: Docker Desktop containers cannot reach 100.x.x.x. All remote mesh routes were silently broken. Fixed with socat TCP bridge.
- LiteLLM config updated: all remote routes use host.docker.internal:<port>.
- socat bridge script created: sidecars/mesh/start-mesh-bridge.sh.
- XC-5 cross-agent verification passed: all 5 routes verified through LiteLLM.
- GitHub Pages deployed: https://maczzgit.github.io/50V3R31GN-M4CH1N4/ live.
- hermes-relay migration deferred: gateway bound to 127.0.0.1, minimal benefit.
- KANBAN_MAP updated to v0.3.2-alpha. XC-5 DONE, XC-6 (Pages) added and DONE. 28 cards.

---

## NEXT SESSION PRIORITIES

### 1. Node D GPU Physical Install (BLOCKING -- requires user)

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

Post-upgrade target: Qwen3.5-35B-A3B-MTP on CUDA, expecting 3-5x speedup over CPU. MTP should become net positive with CUDA acceleration.

### 2. Node A systemd Service (requires sudo on Node A)

llama-micro.service written to /tmp/llama-micro.service on Node A. Run `sudo bash /tmp/install-service.sh` to install. Until then, llama-server is running manually.

### 3. Docs Consolidation and GitHub Wiki

- Convert remaining .md docs in docs/ to HTML where no HTML counterpart exists.
- Create GitHub wiki pages from existing docs content.
- Update KANBAN_MAP.html to match KANBAN_MAP.md.

---

## OPEN TASKS / BLOCKERS

### Requires User Action
- **Node D GPU physical install:** RTX 5060 Ti 16GB OC + OCuLink dock. Hardware procedure.
- **Node A systemd service:** Run `sudo bash /tmp/install-service.sh` on mesh-a.
- **hermes-relay client pairing:** Phones/tablets need to connect and pair (6-char code).

### Deferred (Not Blocking)
- **Persistent sniffer service:** sovereign-sniffer runs on-demand. systemd service deferred.
- **Vision benchmark:** Image inference latency untested on b9190 (text benchmarks massive improvement).
- **socat bridge persistence:** start-mesh-bridge.sh runs manually. Needs adding to startup sequence.
- **Node A GPU inference:** 1050 Ti 4GB could run Qwen3-0.6B, but marginal benefit over CPU. Revisit after Node D GPU reshuffles workloads.

---

## PHASE STATUS

- **Phase 0:** CLOSED
- **Phase 1:** CONDITIONAL CLOSE
- **Phase 2:** IN PROGRESS. Model swapped, binary upgraded, MTP validated (negative on CPU), ngram validated (negative on CPU), context spillover closed (RPC not feasible). GPU install is the only remaining unblocker.
- **Phase 3:** PLANNED. Memory architecture (Hermes-LCM, CodeGraph). Blocked on Phase 2.

---

## KEY PATHS

| Item | Path |
|:-----|:-----|
| Project root | /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha |
| NixOS config | /etc/nixos/configuration.nix |
| Hermes config | ~/.hermes/config.yaml |
| LiteLLM config | sidecars/mesh/litellm-mesh.yaml |
| socat bridge script | sidecars/mesh/start-mesh-bridge.sh |
| hermes-relay plugin | ~/.hermes/plugins/hermes-relay/ |
| Node B llama.cpp | D:\llama.cpp\ (Windows, b9190 Vulkan) |
| Node B startup scripts | D:\llama.cpp\start-all.bat, start-hermes.bat, start-vision.bat |
| Node D llama.cpp | /home/maczz/llama.cpp-latest/build/bin/llama-server (b64b38b5) |
| Node D model | Qwen3.5-35B-A3B-MTP/Qwen3.5-35B-A3B-UD-Q4_K_M.gguf |
| Node A llama.cpp | ~/llama.cpp/build/bin/llama-server (CPU+OpenBLAS) |
| Node A model | ~/models/Qwen3-0.6B-Q8_0.gguf |
| Node A service file | /tmp/llama-micro.service (awaiting sudo install) |
| GitHub Pages | https://maczzgit.github.io/50V3R31GN-M4CH1N4/ |
| 5060 Ti upgrade plan | docs/planning/node-d-5060ti-upgrade.md |
| MTP staging | /mnt/d/llama.cpp/models/mtp-staging/ |

---
::/5Y573M-N071C3 : HANDOFF_V0.3.2_ALPHA. NODE_A_INFERENCE. SOCAT_BRIDGE. XC5_VERIFIED. // 50V3R31GN-M4CH1N4
