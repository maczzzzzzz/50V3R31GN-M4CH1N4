# IMPLEMENTATION_PLAN.md: The Sovereign Mesh (v3.7.0-ALPHA)

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Timestamp:** 2026-05-13
**Purge:** 6 dead crates removed (goose-execution, graphify-ast, matlab-mcp-bridge, visuals-gl, voxcpm-tts, consensus-alignment). 5 validated crates remain (directors-forge, mirage-vfs, pretext-core, vibevoice-asr, zeroboot-isolation).

---

## PHASE 0: VALIDATION GATE (ACTIVE)

Prove the mesh works before building anything on top of it. No new features until every existing endpoint is benchmarked and verified.

- [ ] **V0-T1: Node B Inference Benchmark.** Boot ik_llama.cpp with Vulkan backend. Load Hermes-4-14B Q4_K_M (8.4 GB). Measure tok/s, time-to-first-token, and VRAM utilization. Target: 20+ tok/s.
- [x] **V0-T2a: Node D Heavy Reasoning Benchmark.** Boot ik_llama.cpp with AVX2 on Meteor Lake. Load Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M (19.7 GB). **Result: prompt 8.8 t/s, gen 6.1 t/s (CPU-only, 8 threads).** DONE.
- [ ] **V0-T2b: Node D Interactive Model.** Load a lightweight interactive model (7B class) on Node D alongside the 35B. Target: 30+ tok/s. Model TBD.
- [ ] **V0-T2c: Node C CUDA Benchmark.** Boot ik_llama.cpp with CUDA on RTX 2060. Load Carnice-9B-Function-Calling i1-Q4_K_M (5.3 GB). Measure tok/s. Target: 15+ tok/s on GPU. **(ik_llama.cpp CUDA build in progress)**
- [ ] **V0-T3: LiteLLM Mesh Routing Verification.** Start LiteLLM on Node B (port 4000). Configure model groups: `mesh-fast` -> Node B, `mesh-reason` -> Node D, `mesh-fc` -> Node C. Verify routing, failover, and latency through the Tailscale Artery.
- [ ] **V0-T4: TurboQuant Verification.** Enable `--cache-type-k q4_0` on all inference endpoints. Measure context capacity improvement. Document actual numbers.
- [ ] **V0-T5: Tailscale Artery Health Check.** Run `tailscale status` on all nodes. Verify all 4 nodes connected, ICMP latency, TCP port reachability for inference endpoints.

**Gate condition:** All tasks pass with documented benchmarks. No Phase 1 work begins until this is done.

---

## PHASE 1: KINETIC AGENCY

Give the mesh eyes and hands. Vision triage, terminal control, screen awareness.

- [ ] **P1-T1: Vision-Enabled UI Automation.** Deploy Qwen3-VL-2B on Node B via LiteLLM `mesh-vision` route. Calibrate for sub-second screen triage. Wire into Hermes auxiliary vision config. Benchmark actual latency.
- [ ] **P1-T2: Terminal Control.** Verify Hermes terminal toolset across Tailscale. Test SSH B->C/D. Validate Docker Compose environments. Prove multi-node execution works.
- [ ] **P1-T3: Screen Triage Sidecar.** Deploy sovereign-sniffer on Node B as persistent systemd service. Wire to vision model. Measure end-to-end latency from screen capture to agent response. (Depends on P1-T1.)

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
- [ ] **P3-T2: Directors Forge Tool Discovery.** Deploy directors-forge as a Hermes tool. Verify API discovery and wrapper script generation.
- [ ] **P3-T3: Mirage VFS Integration.** Deploy mirage-vfs on Node D. Wire as Hermes plugin with 4 VFS tools.

---

## PHASE 4: PERCEPTION LAYER (FUTURE)

Voice, HUD, and visual interfaces. Not started until Phases 0-3 are verified.

- [ ] **P4-T1: Voice Pipeline.** Merge vibevoice-asr into Hermes runtime. Integrate with Omi BLE hardware on Node C. Deploy as Hermes voice tool.
- [ ] **P4-T2: Pretext HUD.** Deploy pretext-core WASM in dashboard/hermes-workspace. Wire mesh telemetry to HUD components. Validate KineticThoughtStream rendering.
- [ ] **P4-T3: Mesh-wide Verification.** Full integration test. All nodes, all models, all routes. Run QA suite. Update SOVEREIGN_VITAL_SIGNS.md with real numbers.

---

## MODEL STRATEGY

| Route | Model | Node | Target Speed | Use Case |
|:------|:------|:-----|:-------------|:---------|
| mesh-fast | Hermes-4-14B Q4_K_M | Node B (16GB AMD VRAM) | 20+ tok/s | Code gen, fast chat, tool calling |
| mesh-fc | Carnice-9B-FC i1-Q4_K_M | Node C (RTX 2060 6GB) | 15+ tok/s | Function calling, tool use |
| mesh-reason | Carnice-Qwen3.6-MoE-35B-A3B Q4_K_M | Node D (DDR5 CPU) | 6 tok/s (validated) | Complex reasoning, analysis |
| mesh-interactive | TBD (7B class) | Node D (DDR5 CPU) | 30+ tok/s | Quick queries, triage |
| mesh-vision | Qwen3-VL-2B | Node B/C | sub-second | Screen triage, visual QA |
| kv-spillover | TurboQuant q4_0 | Node A (4GB) | N/A | Context extension |

**Note on NPU:** Intel AI Boost NPU on Meteor Lake (~11 TOPS) cannot meaningfully accelerate models above 3B. It is excluded from the inference strategy. Node D's compute is CPU cores + DDR5 bandwidth.

---
::/5Y573M-N071C3 : PLAN_RESTRUCTURED. PROVE_FIRST_BUILD_SECOND. // 50V3R31GN-M4CH1N4
