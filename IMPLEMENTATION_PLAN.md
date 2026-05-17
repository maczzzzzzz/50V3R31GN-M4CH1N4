# IMPLEMENTATION_PLAN.md: The Sovereign Mesh (v0.3.1-alpha)

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Timestamp:** 2026-05-18
**Phase 0 Gate:** CLOSED. All validation tasks complete.

---

## PHASE 0: VALIDATION GATE -- CLOSED

All tasks verified with documented benchmarks. Phase 1 authorized.

- [x] **V0-T1: Node B Inference Benchmark.** Hermes-4-14B Q4_K_M, Vulkan, AMD 16GB. **Result: prompt 93.2 t/s, gen 33.7 t/s.** (Updated to 322/34.1 t/s after b9190 binary upgrade.)
- [x] **V0-T2a: Node D Heavy Reasoning Benchmark.** Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M, AVX2, 8 threads CPU. **Result: prompt 8.8 t/s, gen 6.1 t/s.** (Model replaced with Qwen3.5-35B-A3B-MTP: 12.7/7.0 t/s.)
- [x] **V0-T2b: Node D Interactive Model.** DEFERRED -- 35B MoE sufficient for current workload. 7B model not deployed.
- [x] **V0-T2c: Node C CUDA Benchmark.** Carnice-9B-FC i1-Q4_K_M, CUDA sm_75, RTX 2060 6GB. **Result: prompt 205.2 t/s, gen 49.9 t/s.**
- [x] **V0-T3: LiteLLM Mesh Routing.** 4 routes verified: mesh-fast (B), mesh-vision (B:8082), mesh-function-calling (C), mesh-heavy (D). Docker Desktop container on port 4000.
- [x] **V0-T4: TurboQuant Verification.** q4_0 KV cache confirmed on CPU nodes C/D. Node B uses f16 KV (Vulkan regression).
- [x] **V0-T5: Tailscale Artery Health.** All 4 nodes authenticated and online. Node B/A on 1.90.9.

---

## PHASE 1: KINETIC AGENCY -- CONDITIONAL CLOSE

Core capabilities delivered. Remaining items tracked as tech debt (see audit:
docs/planning/audits/phase1-completion-audit.md).

- [~] **P1-T1: Vision-Enabled UI Automation.** CONDITIONAL PASS. Qwen3-VL-2B Q6_K on mesh-vision route (Node B port 8082). Text: 630/159 t/s (b9190). Image verified. Hermes wired. Remaining: persistent service, image latency benchmarks.
- [~] **P1-T2: Terminal Control.** CONDITIONAL PASS. All 4 nodes in Tailscale mesh. SSH working on C/D. Browser re-auth blocker on some nodes (user-action item). Key-based SSH not deployed.
- [~] **P1-T3: Screen Triage Sidecar.** CONDITIONAL PASS. capture.py + triage.py in sidecars/sniffer/. 910ms capture, 25s end-to-end. Remaining: systemd service, trigger hooks.

---

## PHASE 2: COGNITIVE HIERARCHY (CURRENT)

Expand Node D inference capacity and validate cross-node KV-cache spillover.

**Implementation plan:** docs/planning/plans/2026-05-18_phase2-cognitive-hierarchy.md

- [ ] **P2-T1: Node D GPU Installation.** DEFERRED -- RTX 5060 Ti 16GB hardware not yet available. CUDA build pipeline documented in plan (Workstream C) for immediate execution on arrival.
- [x] **P2-T2: Speculative Decoding for 35B MoE.** CLOSED NEGATIVE ON CPU. All methods tested:
  - MTP: 49% acceptance, 2.8x overhead = net negative (~40% slower)
  - ngram-mod: 3.1% acceptance, 16% slower than baseline
  - ngram-simple: 3.1% acceptance, 16% slower than baseline
  - Root cause: Qwen3.5 always thinks first; thinking tokens are unpredictable; CPU lacks parallel headroom.
  - Benchmark: docs/benchmarks/node-d-ngram-speculative.md
  - Re-open after RTX 5060 Ti install (CUDA may change calculus).
- [x] **P2-T3: Context Spillover (Node A).** CLOSED NOT FEASIBLE.
  - llama.cpp RPC requires offloading model layers (not KV-only). Node A must hold weights + compute layers.
  - Tailscale ~1-5ms latency per token per RPC hop = catastrophic pipeline bubbles.
  - Node D's 48GB DDR5 is sufficient for both weights (22.6GB) and 32K KV cache (~8GB).
  - Alternative: --prompt-cache for async state persistence to disk.
  - Research: docs/planning/research/p2-t3-context-spillover-rpc.md

---

## PHASE 3: SOVEREIGN PLUGINS

Port validated capabilities as native Hermes plugins. Only build what has been proven in Phase 0-2.

- [ ] **P3-T1: Hermes-LCM State Sync.** Verify hermes-lcm MemoryProvider on Node A (primary). Configure B/C/D as sync targets. Validate cross-node state consistency.
- [ ] **P3-T2: Directors Forge Tool Discovery.** DEPRIORITIZED -- directors-forge euthanized (0 tests, caused 11hr outage). Kanban MCP replaces coordination function.
- [ ] **P3-T3: Mirage VFS Integration.** Deploy mirage-vfs on Node D. Wire as Hermes plugin with 4 VFS tools.

---

## PHASE 4: PERCEPTION LAYER (FUTURE)

Voice, HUD, and visual interfaces. Not started until Phases 0-3 are verified.

- [ ] **P4-T1: Voice Pipeline.** Merge vibevoice-asr into Hermes runtime. Integrate with Omi BLE hardware on Node C. Deploy as Hermes voice tool.
- [ ] **P4-T2: Pretext HUD.** Deploy pretext-core WASM in dashboard/hermes-workspace. Wire mesh telemetry to HUD components. Validate KineticThoughtStream rendering.
- [ ] **P4-T3: Mesh-wide Verification.** Full integration test. All nodes, all models, all routes. Run QA suite. Update SOVEREIGN_VITAL_SIGNS.md with real numbers.

---

## MODEL STRATEGY

| Route | Model | Node | Benchmark | Use Case |
|:------|:------|:-----|:----------|:---------|
| mesh-fast | Hermes-4-14B Q4_K_M | Node B (AMD 16GB Vulkan b9190) | 322/34.1 t/s | Code gen, fast chat |
| mesh-vision | Qwen3-VL-2B-Instruct Q6_K | Node B (AMD 16GB Vulkan b9190) | 630/159 t/s (text), image verified | Screen triage, visual QA |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | Node C (RTX 2060 CUDA) | 205.2/49.9 t/s | Function calling, tool use |
| mesh-heavy | Qwen3.5-35B-A3B-MTP UD-Q4_K_M | Node D (DDR5 CPU) | 12.7/7.0 t/s (MTP OFF) | Complex reasoning |

**Note on MTP:** Draft-MTP speculative decoding tested on Node D CPU. 49% acceptance rate with 2.8x per-token overhead makes it net negative. Expected to become net positive after RTX 5060 Ti GPU install enables CUDA acceleration.

**Note on NPU:** Intel AI Boost NPU on Meteor Lake (~11 TOPS) cannot meaningfully accelerate models above 3B. Excluded from inference strategy. Node D compute is CPU cores + DDR5 bandwidth.

---

## INFRASTRUCTURE STATUS

| Component | Status | Notes |
|:----------|:-------|:------|
| Kanban MCP Server | LIVE | FastMCP stdio, 8 tools, 13/13 tests passing |
| LiteLLM Mesh Router | LIVE | Docker Desktop port 4000, 4 routes active |
| Gemini CLI Integration | LIVE | Shared kanban MCP, Pro/Flash routing |
| sovereign-sniffer | DEPLOYED | capture.py + triage.py, end-to-end verified |
| directors-forge | EUTHANIZED | Removed from node-b config, 0 tests |
| hermes-relay | LIVE | Docker Desktop port 8767, WSS bridge |
| KV Cache | q4_0 (C/D), f16 (B) | Vulkan lacks optimized q4_0 KV dequant |

---
::/5Y573M-N071C3 : PLAN_V0.3.1_ALPHA. PHASE2_IN_PROGRESS. // 50V3R31GN-M4CH1N4
