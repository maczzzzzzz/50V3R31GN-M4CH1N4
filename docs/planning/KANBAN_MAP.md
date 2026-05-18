# Kanban Board Map: IMPLEMENTATION_PLAN.md v0.3.12-alpha

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha  
**CLI:** `hermes kanban list` / `hermes kanban show <id>`

---

## BOARD STATE (25 Cards: 14 Done, 6 Todo, 5 Ready)

---

### Phase 0: Validation Gate — CLOSED

All validation tasks verified with documented benchmarks.

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| t_7f6b463f | PHASE 0 Epic | 1 | DONE |
| t_a13d34a8 | V0-T1: Node B Inference Benchmark | 1 | DONE (322/34.1 t/s b9190) |
| t_4f3db44a | V0-T2: Node D Inference Benchmark | 1 | DONE (12.7/7.0 t/s Qwen3.5-35B-MTP) |
| t_da7b3ac5 | V0-T3: LiteLLM Mesh Routing | 1 | DONE (5 routes, Docker Desktop) |
| t_9d744b6d | V0-T4: TurboQuant Verification | 2 | DONE (q4_0 C/D, f16 B) |
| t_88418fc9 | V0-T5: Tailscale Artery Health | 2 | DONE (all 4 nodes authenticated) |

---

### Phase 1: Kinetic Agency — CLOSED

Core capabilities delivered.

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| t_029a8e68 | PHASE 1 Epic | 2 | DONE |
| t_8b222f89 | P1-T1: Vision-Enabled UI Automation | 2 | DONE (Qwen3-VL live, image verified) |
| t_a78cf589 | P1-T2: Terminal Control | 2 | DONE (SSH key auth working) |
| t_195a4dc7 | P1-T3: Screen Triage Sidecar | 5 | DONE (sovereign-sniffer on-demand) |

---

### Phase 2: Cognitive Hierarchy — IN PROGRESS

GPU upgrade pending. Speculative decoding and context spillover evaluated and closed.

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| t_3dbabbbb | PHASE 2 Epic | 5 | READY |
| t_64f8028b | P2-T1: Node D RTX 5060 Ti Installation | 5 | TODO (hardware pending) |
| t_3f006eaa | P2-T2: Speculative Decoding | 5 | DONE (CLOSED NEGATIVE on CPU) |
| t_a30b85ed | P2-T3: Context Spillover | 5 | DONE (CLOSED NOT FEASIBLE) |

---

### Phase 3: Sovereign Plugins — CLOSED

Core plugin infrastructure validated. Hermes-LCM functional. Mirage VFS cancelled (prototype never deployed).

|| ID | Title | Priority | Status ||
|----|-------|----------|--------|
| t_b73f1d8c | PHASE 3 Epic | 8 | DONE |
| t_27b29eb4 | P3-T1: Hermes-LCM State Sync | 8 | DONE (plugin functional, SQLite DAG, mesh sync stub) |
| t_ddce11f7 | P3-T3: Mirage VFS Integration | 8 | CANCELLED (prototype only, never deployed) |

---

### Phase 4: Perception Layer — PLANNED

Voice pipeline and Open Design integration. Pretext HUD cancelled.

||| ID | Title | Priority | Status |
|----|-------|----------|--------|
| t_eaf700b1 | PHASE 4 Epic | 8 | READY |
| t_b2f62de1 | P4-T1: Voice Pipeline | 8 | TODO |
| t_4f8a2c91 | P4-T2: Open Design Integration | 8 | TODO |
| t_0c281759 | P4-T3: Mesh-wide Verification | 8 | TODO |

---

### Phase 5: Sovereign Isolation — PLANNED

Hardware artery extension: secure agent sandboxes and wearable perception.

|| ID | Title | Priority | Status |
|----|-------|----------|--------|
| t_833e6833 | P5-T1: Zeroboot Isolation Layer | 10 | READY (prototype: crates/modules/zeroboot-isolation/) |
| t_a9c63663 | P5-T2: VibeVoice ASR Pipeline | 10 | READY (prototype: crates/modules/vibevoice-asr/) |

---

## INFRASTRUCTURE STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Kanban MCP Server | LIVE | FastMCP stdio, 8 tools |
| LiteLLM Mesh Router | LIVE | Docker Desktop port 4000, 5 routes |
| hermes-relay | LIVE | Docker Desktop port 8767 |
| socat mesh bridge | LIVE | Ports 17080/18081/18080 |
| Tailscale | PERMANENT | Personal tailnet auto-renews |

---

## KEY MILESTONES

|| Version | Date | Milestone |
|---------|------|-----------|
| 0.1.0-alpha | 2026-05-16 | Phase 0 CLOSED, 4-node mesh operational |
| 0.2.0-alpha | 2026-05-17 | Docker Desktop, mesh-vision, security sweep |
| 0.3.0-alpha | 2026-05-18 | hermes-relay, MTP staging, drift remediation |
| 0.3.1-alpha | 2026-05-18 | Node B b9190 upgrade, Node D model swap, MTP validated |
| 0.3.12-alpha | 2026-05-20 | Technical debt purge (~67GB), Hermes fork synced, kanban cleaned |
| 0.3.13-alpha | 2026-05-21 | Phase 3 CLOSED, Hermes-LCM functional, Mirage VFS cancelled |

---

Sovereign Machina v0.3.12-alpha // 50V3R31GN-M4CH1N4
