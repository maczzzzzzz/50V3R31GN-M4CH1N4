# IMPLEMENTATION_PLAN.md: The Sovereign Mesh (v0.3.13-alpha)

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha  
**Timestamp:** 2026-05-21  
**Phase 0-3:** CLOSED. Phase 4-5: PLANNED.

---

## PHASE 0: VALIDATION GATE -- CLOSED

All tasks verified with documented benchmarks.

- [x] **V0-T1: Node B Inference Benchmark.** Qwopus3.5-9B Q8_0, Vulkan, RX 9060 XT 16GB. **Result: prompt 322 t/s, gen 34.1 t/s.**
- [x] **V0-T2: Node D Heavy Reasoning Benchmark.** Qwen3.5-35B-A3B-MTP UD-Q4_K_M, AVX2, 8 threads CPU. **Result: prompt 12.7 t/s, gen 7.0 t/s (MTP off).**
- [x] **V0-T3: LiteLLM Mesh Routing.** 5 routes verified: mesh-fast (B), mesh-vision (B:8082), mesh-function-calling (C), mesh-heavy (D), mesh-micro (A).
- [x] **V0-T4: KV Cache Strategy.** f16 on Node B (Vulkan regression with q4_0). q4_0 on CPU nodes.
- [x] **V0-T5: Tailscale Artery Health.** All 4 nodes authenticated and online.

---

## PHASE 1: KINETIC AGENCY -- CLOSED

- [x] **P1-T1: Vision-Enabled UI Automation.** Qwen3-VL-2B on mesh-vision route. Image input verified.
- [x] **P1-T2: Terminal Control.** SSH key auth deduplicated across all nodes.
- [x] **P1-T3: Screen Triage Sidecar.** On-demand via sovereign-sniffer.

---

## PHASE 2: COGNITIVE HIERARCHY -- IN PROGRESS

GPU upgrade pending. Speculative decoding and context spillover evaluated and closed negative.

- [ ] **P2-T1: Node D RTX 5060 Ti Installation.** DEFERRED -- hardware pending. Plan documented in `docs/planning/node-d-5060ti-upgrade.md`.
- [x] **P2-T2: Speculative Decoding.** CLOSED NEGATIVE ON CPU. MTP 49% acceptance, 2.8x overhead.
- [x] **P2-T3: Context Spillover.** CLOSED NOT FEASIBLE. RPC latency on Tailscale impractical.

---

## PHASE 3: SOVEREIGN PLUGINS -- CLOSED

- [x] **P3-T1: Hermes-LCM State Sync.** DONE. Plugin functional (SQLite DAG, mesh sync stub). Core provider integration deferred.
- [x] **P3-T2: Directors Forge Tool Discovery.** CANCELLED (replaced by Kanban MCP).
- [x] **P3-T3: Mirage VFS Integration.** CANCELLED. Prototype never deployed, no backend running.

---

## PHASE 4: PERCEPTION LAYER -- PLANNED

- [ ] **P4-T1: Voice Pipeline.** TODO.
- [ ] **P4-T2: Open Design Integration.** TODO. Plan: `docs/planning/plans/2026-05-19-open-design-mesh-integration.html`.
- [ ] **P4-T3: Mesh-wide Verification.** TODO.

---

## PHASE 5: SOVEREIGN ISOLATION -- PLANNED

Hardware artery extension: secure agent sandboxes and wearable perception.

- [ ] **P5-T1: Zeroboot Isolation Layer.** TODO. Upstream: zerobootdev/zeroboot (CoW forking, 0.79ms spawn). Plan: `docs/planning/plans/2026-05-21-zeroboot-integration.md`.
- [x] **P5-T2: VibeVoice ASR Pipeline.** CANCELLED. Hermes has native Whisper/TTS.

---

## MODEL STRATEGY

| Route | Model | Node | Benchmark | Use Case |
|:------|:------|:-----|:----------|:---------|
| mesh-fast | Qwopus3.5-9B Q8_0 | B | 322 / 34.1 t/s | Code gen, fast chat |
| mesh-vision | Qwen3-VL-2B-Instruct Q6_K | B | 630 / 159 t/s (text) | Screen triage, visual QA |
| mesh-function-calling | Carnice-9B-FC i1-Q4_K_M | C | 205.2 / 49.9 t/s | Function calling, tools |
| mesh-heavy | Qwen3.5-35B-A3B-MTP UD-Q4_K_M | D | 12.7 / 7.0 t/s (MTP off) | Complex reasoning |
| mesh-micro | Qwen3-0.6B Q8_0 | A | 169 / 46.8 t/s | Lightweight / spillover |

**Notes:**
- MTP is net negative on CPU. Revisit after RTX 5060 Ti + CUDA.
- Intel NPU (~11 TOPS) excluded from inference strategy.
- Vulkan nodes use f16 KV cache (q4_0 causes 39-88% regression on AMD).

---

## INFRASTRUCTURE STATUS

| Component | Status | Notes |
|:----------|:-------|:------|
| Kanban MCP Server | LIVE | FastMCP stdio, 8 tools |
| LiteLLM Mesh Router | LIVE | Docker Desktop port 4000, 5 routes, v1.85.0 |
| hermes-relay | LIVE | Docker Desktop port 8767 |
| socat mesh bridge | LIVE | Ports 17080/18081/18080 |
| Tailscale | PERMANENT | Personal tailnet auto-renews |
| Gemini CLI | LIVE | Connected to kanban MCP |
| sovereign-sniffer | ON-DEMAND | Screen triage |

---

Sovereign Machina v0.3.13-alpha // 50V3R31GN-M4CH1N4
