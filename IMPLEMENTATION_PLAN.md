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
- [x] **V0-T3: LiteLLM Mesh Routing.** 4 routes verified: mesh-fast (B), mesh-vision (B:8082), mesh-function-calling (C), mesh-heavy (D). Docker Desktop container on port 4000.
- [x] **V0-T4: TurboQuant Verification.** All nodes confirmed live with `--cache-type-k q4_0`. Active on all inference endpoints.
- [x] **V0-T5: Tailscale Artery Health.** All 4 nodes authenticated and online. Node B/A on 1.90.9.

---

## PHASE 1: KINETIC AGENCY (CURRENT)

Give the mesh eyes and hands. Vision triage, terminal control, screen awareness.

- [~] **P1-T1: Vision-Enabled UI Automation.** DEPLOYED. Qwen3-VL-2B Q6_K on mesh-vision route (Node B port 8082). Text benchmark: 550 t/s prompt, 50.7 t/s gen. IMAGE INPUT: VERIFIED with mmproj. Hermes auxiliary vision wired to mesh-vision route. Remaining: persistent service, image latency optimization.
- [~] **P1-T2: Terminal Control.** PARTIAL. All 4 nodes visible in Tailscale mesh. SSH requires browser re-auth (Tailscale SSH checkin). Key-based SSH not yet deployed. Docker Desktop verified on Node B.
- [~] **P1-T3: Screen Triage Sidecar.** DEPLOYED. sovereign-sniffer capture.py and triage.py (sidecars/sniffer/). Screen capture: PowerShell -> WSL2, 910ms. End-to-end triage verified: 25s total (910ms capture + 24.3s inference). Remaining: persistent systemd service, triage trigger hooks.

---

## PHASE 2: COGNITIVE HIERARCHY

Establish GPU inference on Node D (RTX 5060 Ti 16GB via OCuLink) and validate the full inference pipeline.

- [ ] **P2-T1: Node D GPU Installation.** Install RTX 5060 Ti 16GB via OCuLink dock. Deploy ik_llama.cpp CUDA build. Migrate Carnice MoE 35B from CPU to GPU. Re-benchmark.
- [ ] **P2-T2: Node D Multi-Model Stack.** With GPU handling 35B MoE, run a second interactive model (7B class) on CPU. Register both with LiteLLM.
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
| mesh-vision | Qwen3-VL-2B-Instruct Q6_K | Node B (AMD 16GB Vulkan) | 550/50.7 t/s (text), image verified | Screen triage, visual QA |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | Node C (RTX 2060 CUDA) | 205.2/49.9 t/s | Function calling, tool use |
| mesh-heavy | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M | Node D (DDR5 CPU) | 8.8/6.1 t/s | Complex reasoning |

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
| TurboQuant | LIVE (all nodes) | q4_0 KV cache active on all inference endpoints |

---
::/5Y573M-N071C3 : PLAN_V0.1.0_ALPHA. PHASE1_IN_PROGRESS. // 50V3R31GN-M4CH1N4
