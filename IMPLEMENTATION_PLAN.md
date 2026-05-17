# IMPLEMENTATION_PLAN.md: The Sovereign Mesh (v0.3.5-alpha)

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Timestamp:** 2026-05-19
**Phase 0 Gate:** CLOSED. All validation tasks complete.

---

## PHASE 0: VALIDATION GATE -- CLOSED

All tasks verified with documented benchmarks. Phase 1 authorized.

- [x] **V0-T1: Node B Inference Benchmark.** Qwopus3.5-9B Q8_0, Vulkan, AMD 16GB. **Result: prompt 428-441 t/s, gen 53.8-55.1 t/s.**
- [x] **V0-T2a: Node D Heavy Reasoning Benchmark.** Qwen3.5-35B-A3B-MTP UD-Q4_K_M, AVX2, 8 threads CPU. **Result: prompt 12.7 t/s, gen 7.0 t/s.**
- [x] **V0-T2b: Node D Interactive Model.** DEFERRED -- 35B MoE sufficient for current workload.
- [x] **V0-T2c: Node C CUDA Benchmark.** Carnice-9B-FC i1-Q4_K_M, CUDA sm_75, RTX 2060 6GB. **Result: prompt 205.2 t/s, gen 49.9 t/s.**
- [x] **V0-T3: LiteLLM Mesh Routing.** 5 routes verified: mesh-fast (B), mesh-vision (B:8082), mesh-function-calling (C), mesh-heavy (D), mesh-micro (A).
- [x] **V0-T4: KV Cache Strategy.** f16 on Node B (Vulkan regression with q4_0). q4_0 on CPU nodes.
- [x] **V0-T5: Tailscale Artery Health.** All 4 nodes authenticated and online.

---

## PHASE 1: KINETIC AGENCY -- CLOSED

- [~] **P1-T1: Vision-Enabled UI Automation.** CONDITIONAL PASS. Qwen3-VL-2B on mesh-vision route. Image input verified.
- [x] **P1-T2: Terminal Control.** COMPLETE. SSH key auth deduplicated across all nodes.
- [x] **P1-T3: Screen Triage Sidecar.** COMPLETE. On-demand via sovereign-sniffer.

---

## PHASE 2: COGNITIVE HIERARCHY (CURRENT)

**Note (0.3.5-alpha):** Documentation parity sweep completed. All core docs now match physical mesh state.

Expand Node D inference capacity. Speculative decoding and cross-node KV spillover evaluated and closed negative on current hardware.

- [ ] **P2-T1: Node D GPU Installation.** DEFERRED -- RTX 5060 Ti 16GB via OCuLink pending. Full CUDA build plan documented.
- [x] **P2-T2: Speculative Decoding for 35B MoE.** CLOSED NEGATIVE ON CPU.
  - MTP: 49% acceptance, 2.8x overhead → net negative.
  - ngram variants also slower.
  - Revisit after GPU upgrade.
- [x] **P2-T3: Context Spillover (Node A).** CLOSED NOT FEASIBLE.
  - RPC latency on Tailscale makes it impractical.
  - Node D 48GB DDR5 sufficient for current workloads.

---

## PHASE 3: SOVEREIGN PLUGINS

Port validated capabilities as native Hermes plugins.

- [ ] **P3-T1: Hermes-LCM State Sync.** Primary task. Verify hermes-lcm on Node A. Configure sync targets on B/C/D. Consider hermes-relay relocation as companion task.
- [ ] **P3-T2: Directors Forge Tool Discovery.** CANCELLED (replaced by Kanban MCP).
- [ ] **P3-T3: Mirage VFS Integration.** Deploy mirage-vfs on Node D as Hermes plugin.

---

## PHASE 4: PERCEPTION LAYER (FUTURE)

- [ ] **P4-T1: Voice Pipeline**
- [ ] **P4-T2: Pretext HUD**
- [ ] **P4-T3: Mesh-wide Verification**

---

## MODEL STRATEGY

| Route                  | Model                              | Node | Benchmark                  | Use Case                  |
|------------------------|------------------------------------|------|----------------------------|---------------------------|
| mesh-fast              | Qwopus3.5-9B Q8_0                  | B    | 428-441 / 53.8-55.1 t/s    | Code gen, fast chat       |
| mesh-vision            | Qwen3-VL-2B-Instruct Q6_K          | B    | 630 / 159 t/s (text)       | Screen triage, visual QA  |
| mesh-function-calling  | Carnice-9B-FC i1-Q4_K_M            | C    | 205.2 / 49.9 t/s           | Function calling, tools   |
| mesh-heavy             | Qwen3.5-35B-A3B-MTP UD-Q4_K_M      | D    | 12.7 / 7.0 t/s (MTP off)   | Complex reasoning         |
| mesh-micro             | Qwen3-0.6B Q8_0                    | A    | 49 / 29 t/s                | Lightweight / spillover   |

**Note on MTP:** Net negative on current CPU. Expected improvement after RTX 5060 Ti + CUDA.

**Note on NPU:** Intel NPU (~11 TOPS) excluded from inference strategy.

---

## INFRASTRUCTURE STATUS

| Component            | Status     | Notes                                      |
|----------------------|------------|--------------------------------------------|
| Kanban MCP Server    | LIVE       | FastMCP stdio, 8 tools                     |
| LiteLLM Mesh Router  | LIVE       | Docker Desktop port 4000, 5 routes         |
| Gemini CLI           | LIVE       | Shared kanban MCP                          |
| sovereign-sniffer    | ON-DEMAND  | Screen triage                              |
| hermes-relay         | LIVE       | Docker Desktop port 8767                   |
| KV Cache             | f16 (B)    | q4_0 on C/D                                |

---

::/5Y573M-N071C3 : PLAN_V0.3.5_ALPHA. PHASE3_READY. // 50V3R31GN-M4CH1N4
