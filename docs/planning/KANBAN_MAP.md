# Kanban Board Map: IMPLEMENTATION_PLAN.md v3.7.0-ALPHA

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Bootstrap:** `python3 scripts/repro/kanban-bootstrap.py`
**CLI:** `hermes kanban list` / `hermes kanban show <id>`

---

## BOARD STATE (27 Cards)

### Cross-cutting: Agent Coordination

| ID | Title | Priority | Plan |
|:---|:------|:--------|:-----|
| t_mcp_001 | XC-1: Kanban MCP Server Scaffold | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) |
| t_mcp_002 | XC-2: Hermes MCP Integration | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) |
| t_mcp_003 | XC-3: Gemini CLI MCP Integration | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) |
| t_mcp_004 | XC-4: MCP Documentation | 3 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) |
| t_mcp_005 | XC-5: Cross-Agent Verification Test | 3 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) |

### Phase 0: Validation Gate (CRITICAL -- blocks everything)

| ID | Title | Priority |
|:---|:------|:--------|
| t_7f6b463f | PHASE 0 Epic | 1 |
| t_a13d34a8 | V0-T1: Node B Inference Benchmark | 1 |
| t_4f3db44a | V0-T2: Node D Inference Benchmark | 1 |
| t_da7b3ac5 | V0-T3: LiteLLM Mesh Routing | 1 |
| t_9d744b6d | V0-T4: TurboQuant Verification | 2 |
| t_88418fc9 | V0-T5: Tailscale Artery Health | 2 |

### Phase 1: Kinetic Agency

| ID | Title | Priority |
|:---|:------|:--------|
| t_029a8e68 | PHASE 1 Epic | 2 |
| t_8b222f89 | P1-T1: Vision UI | 2 |
| t_a78cf589 | P1-T2: Terminal Control | 2 |
| t_195a4dc7 | P1-T3: Screen Triage | 5 |

### Phase 2: Cognitive Hierarchy

| ID | Title | Priority |
|:---|:------|:--------|
| t_3dbabbbb | PHASE 2 Epic | 5 |
| t_64f8028b | P2-T1: Node D Dual-Model | 5 |
| t_3f006eaa | P2-T2: Model Routing Rules | 5 |
| t_a30b85ed | P2-T3: Context Spillover | 5 |

### Phase 3: Sovereign Plugins

| ID | Title | Priority |
|:---|:------|:--------|
| t_b73f1d8c | PHASE 3 Epic | 8 |
| t_27b29eb4 | P3-T1: Hermes-LCM | 8 |
| t_059e22aa | P3-T2: Directors Forge | 8 |
| t_ddce11f7 | P3-T3: Mirage VFS | 8 |

### Phase 4: Perception Layer

| ID | Title | Priority |
|:---|:------|:--------|
| t_eaf700b1 | PHASE 4 Epic | 8 |
| t_b2f62de1 | P4-T1: Voice Pipeline | 8 |
| t_d0b6adb8 | P4-T2: Pretext HUD | 8 |
| t_0c281759 | P4-T3: Mesh-wide Verification | 8 |

---

## CRATE STATUS (post-purge)

| Crate | Status | Action |
|:------|:-------|:-------|
| directors-forge | KEPT | Needs tests |
| mirage-vfs | KEPT | Ready |
| pretext-core | KEPT | Ready |
| vibevoice-asr | KEPT | Needs merge into Hermes |
| zeroboot-isolation | KEPT | Needs rework |
| consensus-alignment | KILLED | Stub |
| goose-execution | KILLED | Useless sandbox |
| graphify-ast | KILLED | Toy parser |
| matlab-mcp-bridge | KILLED | Wraps nothing |
| visuals-gl | KILLED | Empty directory |
| voxcpm-tts | KILLED | Wraps nothing |

---
::/5Y573M-N071C3 : KANBAN_REBUILT. THE_BOARD_IS_TRUTH. // 50V3R31GN-M4CH1N4
