# IMPLEMENTATION_PLAN.md: The Sovereign Mesh (v0.1.0-alpha)

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Timestamp:** 2026-05-17
**Phase 0 Gate:** CLOSED. All validation tasks complete.

---

## PHASE 0: VALIDATION GATE -- CLOSED

All tasks verified with documented benchmarks. Phase 1 authorized.

- [x] **V0-T1: Node B Inference Benchmark.** Hermes-4-14B Q4_K_M, Vulkan, AMD 16GB. **Result: prompt 93.2 t/s, gen 33.7 t/s.**
- [x] **V0-T2a: Node D Heavy Reasoning Benchmark.** Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M, AVX2, 8 threads CPU. **Result: prompt 8.8 t/s, gen 6.1 t/s.**
- [x] **V0-T2b: Node D Interactive Model.** DEFERRED -- 35B MoE sufficient for current workload. 7B model not deployed.
- [x] **V0-T2c: Node C CUDA Benchmark.** Carnice-9B-FC i1-Q4_K_M, CUDA sm_75, RTX 2060 6GB. **Result: prompt 205.2 t/s, gen 49.9 t/s.**
- [x] **V0-T3: LiteLLM Mesh Routing.** 3 routes verified: mesh-fast (B), mesh-function-calling (C), mesh-heavy (D). Docker container on port 4000.
- [x] **V0-T4: TurboQuant Verification.** Node C/D confirmed live with `-ctk q4_0 -ctv q4_0`. Node B pending Windows restart.
- [x] **V0-T5: Tailscale Artery Health.** All 4 nodes authenticated and online. Node B/A on 1.90.9.

---

## PHASE 1: KINETIC AGENCY (CURRENT)

Give the mesh eyes and hands. Vision triage, terminal control, screen awareness.

- [~] **P1-T1: Vision-Enabled UI Automation.** DEPLOYED. Qwen3-VL-2B Q6_K on mesh-vision route (Node B port 8082). Text benchmark: 550 t/s prompt, 50.7 t/s gen. IMAGE INPUT: mmproj downloaded and bat updated, requires Windows server restart to activate. Hermes vision config pending.
- [~] **P1-T2: Terminal Control.** PARTIAL. All 4 nodes visible in Tailscale mesh. SSH requires browser re-auth (Tailscale SSH checkin). Key-based SSH not yet deployed. Docker environments: Node B Docker Desktop verified.
- [~] **P1-T3: Screen Triage Sidecar.** IN PROGRESS. sovereign-sniffer capture.py and triage.py written (sidecars/sniffer/). Screen capture verified (PowerShell -> WSL2, 592KB PNG). End-to-end triage blocked on vision server mmproj activation. Persistent service deferred.

---

## PHASE 2: COGNITIVE HIERARCHY

Establish the dual-model strategy on Node D and validate the full inference pipeline.

- [ ] **P2-T1: Node D Dual-Model Stack.** Run an interactive model (7B class) and Carnice MoE 35B concurrently on Node D. Use two separate ik_llama.cpp processes on different ports. Register both with LiteLLM.
- [ ] **P2-T2: Hermes Model Routing Rules.** Configure LiteLLM to route: simple queries -> `mesh-fc` (Node C, 9B FC), complex reasoning -> `mesh-reason` (Node D, 35B MoE), code generation -> `mesh-fast` (Node B, Hermes-4-14B), vision -> `mesh-vision`. Document the routing matrix.
- [ ] **P2-T3: Context Spillover (Node A).** Configure Node A as KV-cache offload target via TurboQuant. If ik_llama.cpp supports RPC offload, wire Node D's 35B MoE to spill KV to Node A over Tailscale. Measure context extension.

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
| mesh-fast | Hermes-4-14B Q4_K_M | Node B (AMD 16GB Vulkan) | 93.2/33.7 t/s | Code gen, fast chat |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | Node C (RTX 2060 CUDA) | 205.2/49.9 t/s | Function calling, tool use |
| mesh-heavy | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M | Node D (DDR5 CPU) | 8.8/6.1 t/s | Complex reasoning |
| mesh-interactive | TBD (7B class) | Node D (DDR5 CPU) | target 30+ t/s | Quick queries, triage |
| mesh-vision | Qwen3-VL-2B | Node B/C | sub-second target | Screen triage, visual QA |

**Note on NPU:** Intel AI Boost NPU on Meteor Lake (~11 TOPS) cannot meaningfully accelerate models above 3B. Excluded from inference strategy. Node D compute is CPU cores + DDR5 bandwidth.

---

## INFRASTRUCTURE STATUS

| Component | Status | Notes |
|:----------|:-------|:------|
| Kanban MCP Server | LIVE | FastMCP stdio, 8 tools, 13/13 tests passing |
| LiteLLM Mesh Router | LIVE | Docker port 4000, 3 routes active |
| Gemini CLI Integration | LIVE | Shared kanban MCP, Pro/Flash routing |
| directors-forge | EUTHANIZED | Removed from node-b config, 0 tests |
| TurboQuant | LIVE (all nodes) | Node B restarted with q4_0 applied |

---
::/5Y573M-N071C3 : PLAN_V38. PHASE0_CLOSED. // 50V3R31GN-M4CH1N4
