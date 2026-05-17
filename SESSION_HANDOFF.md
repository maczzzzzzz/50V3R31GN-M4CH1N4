# SESSION HANDOFF (v0.3.1-alpha)

**Last Active Session:** 2026-05-18
**Branch:** stable/mesh-alpha
**Version:** 0.3.1-alpha

---

## MESH STATUS

All 4 routes operational. Node B binary upgraded to b9190. Node D model swapped.

| Route | Target | Status |
|:------|:-------|:-------|
| mesh-fast | Node B Hermes-4-14B Q4_K_M (Vulkan b9190 :8081) | LIVE |
| mesh-vision | Node B Qwen3-VL-2B Q6_K (Vulkan b9190 :8082) | LIVE |
| mesh-function-calling | Node C Carnice-9B-FC (CUDA :8081) | LIVE |
| mesh-heavy | Node D Qwen3.5-35B-MTP UD-Q4_K_M (CPU :8080) | LIVE |

| Service | Port | Status |
|:--------|:-----|:-------|
| LiteLLM mesh router | 4000 | LIVE |
| hermes-relay v0.6.1 | 8767 | LIVE |

---

## COMPLETED THIS SESSION (0.3.1-alpha)

- Node B binary upgrade: llama.cpp v8710 -> b9190. Hermes prompt 93.2->322 t/s. VL-2B gen 50.7->159 t/s.
- Node D model swap: Carnice MoE 35B -> Qwen3.5-35B-A3B-MTP UD-Q4_K_M (22.6 GB). Benchmark: 12.7/7.0 t/s.
- MTP speculative decoding validated on CPU: NET NEGATIVE (49% acceptance, 2.8x overhead). Deferred to post-GPU.
- Model selection research: Hermes-4-14B confirmed as optimal for Node B. No viable swap candidate.
- Full manifest scribe pass: CHANGELOG, IMPLEMENTATION_PLAN, VITAL_SIGNS, AGENTS, SOUL, README, LEAD_ARCHITECT all synced.

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

### 2. Ngram Speculative Decoding (P2-T2 -- free, no GPU needed)

Test ngram speculative decoding on Node D CPU. This is the "free option" from the Phase 2 plan -- no draft model needed, just `--spec-type ngram`. May provide modest speedup even on CPU. Worth testing before GPU arrives.

### 3. Context Spillover Research (P2-T3)

Research ik_llama.cpp RPC support for KV-cache offloading to Node A over Tailscale. If RPC works, configure Node A as offload target. If not, document why and defer to Phase 3.

---

## OPEN TASKS / BLOCKERS

### Requires User Action
- **Node D GPU physical install:** RTX 5060 Ti 16GB OC + OCuLink dock. Hardware procedure.
- **hermes-relay client pairing:** Phones/tablets need to connect and pair (6-char code).

### Deferred (Not Blocking)
- **Persistent sniffer service:** sovereign-sniffer runs on-demand. systemd service deferred.
- **Vision benchmark:** Image inference latency untested on b9190 (text benchmarks massive improvement).
- **Node A PQ warning:** tailscaled version mismatch (cosmetic, low risk).

---

## PHASE STATUS

- **Phase 0:** CLOSED
- **Phase 1:** CONDITIONAL CLOSE
- **Phase 2:** IN PROGRESS. Model swapped, binary upgraded, MTP validated. GPU install and ngram test remaining.
- **Phase 3:** PLANNED. Memory architecture (Hermes-LCM, CodeGraph). Blocked on Phase 2.

---

## KEY PATHS

| Item | Path |
|:-----|:-----|
| Project root | /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha |
| NixOS config | /etc/nixos/configuration.nix |
| Hermes config | ~/.hermes/config.yaml |
| LiteLLM config | sidecars/mesh/litellm-mesh.yaml |
| hermes-relay plugin | ~/.hermes/plugins/hermes-relay/ |
| Node B llama.cpp | D:\llama.cpp\ (Windows, b9190 Vulkan) |
| Node B startup scripts | D:\llama.cpp\start-all.bat, start-hermes.bat, start-vision.bat |
| Node B old binary backup | D:\llama.cpp\llama-server-v8710.exe.bak |
| Node D llama.cpp | /home/maczz/llama.cpp-latest/build/bin/llama-server (b64b38b5) |
| Node D model | Qwen3.5-35B-A3B-MTP/Qwen3.5-35B-A3B-UD-Q4_K_M.gguf |
| MTP staging | /mnt/d/llama.cpp/models/mtp-staging/ |
| 5060 Ti upgrade plan | docs/planning/node-d-5060ti-upgrade.md |
| Relay doc | docs/operations/hermes-relay.md |
| Phase 2 plan | docs/planning/plans/2026-05-18_phase2-cognitive-hierarchy.md |

---
::/5Y573M-N071C3 : HANDOFF_V0.3.1_ALPHA. B9190_LIVE. MTP_CPU_NEGATIVE. GPU_PENDING. // 50V3R31GN-M4CH1N4
