# Kanban Board Map: IMPLEMENTATION_PLAN.md v0.3.1-alpha

**Status:** ACTIVE | **Baseline:** stable/mesh-alpha
**Bootstrap:** `python3 scripts/repro/kanban-bootstrap.py`
**CLI:** `hermes kanban list` / `hermes kanban show <id>`

---

## BOARD STATE (27 Cards)

### Cross-cutting: Agent Coordination

| ID | Title | Priority | Plan | Status |
|:---|:------|:--------|:-----|:-------|
| t_mcp_001 | XC-1: Kanban MCP Server Scaffold | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) | DONE |
| t_mcp_002 | XC-2: Hermes MCP Integration | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) | DONE |
| t_mcp_003 | XC-3: Gemini CLI MCP Integration | 2 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) | DONE |
| t_mcp_004 | XC-4: MCP Documentation | 3 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) | DONE |
| t_mcp_005 | XC-5: Cross-Agent Verification Test | 3 | [plan](plans/2026-05-14-shared-kanban-mcp-server.md) | PENDING |

### Phase 0: Validation Gate -- CLOSED

All validation tasks verified with documented benchmarks. Phase 1 authorized.

| ID | Title | Priority | Status |
|:---|:------|:--------|:-------|
| t_7f6b463f | PHASE 0 Epic | 1 | CLOSED |
| t_a13d34a8 | V0-T1: Node B Inference Benchmark | 1 | DONE (322/34.1 t/s b9190) |
| t_4f3db44a | V0-T2: Node D Inference Benchmark | 1 | DONE (12.7/7.0 t/s Qwen3.5-35B-MTP) |
| t_da7b3ac5 | V0-T3: LiteLLM Mesh Routing | 1 | DONE (4 routes, Docker Desktop) |
| t_9d744b6d | V0-T4: TurboQuant Verification | 2 | DONE (q4_0 C/D, f16 B) |
| t_88418fc9 | V0-T5: Tailscale Artery Health | 2 | DONE (all 4 nodes authenticated) |

### Phase 1: Kinetic Agency -- CONDITIONAL CLOSE

Core capabilities delivered. Remaining items tracked as tech debt. Audit: docs/planning/audits/phase1-completion-audit.md

| ID | Title | Priority | Status |
|:---|:------|:--------|:-------|
| t_029a8e68 | PHASE 1 Epic | 2 | CONDITIONAL CLOSE |
| t_8b222f89 | P1-T1: Vision UI | 2 | CONDITIONAL (Qwen3-VL live, image verified, latency untested) |
| t_a78cf589 | P1-T2: Terminal Control | 2 | CONDITIONAL (SSH C/D working, key auth not universal) |
| t_195a4dc7 | P1-T3: Screen Triage | 5 | CONDITIONAL (910ms capture, 25s e2e, no systemd service) |

### Phase 2: Cognitive Hierarchy -- IN PROGRESS

Expand Node D inference capacity and validate cross-node KV-cache spillover.

| ID | Title | Priority | Status |
|:---|:------|:--------|:-------|
| t_3dbabbbb | PHASE 2 Epic | 5 | IN PROGRESS |
| t_64f8028b | P2-T1: Node D GPU Installation | 5 | BLOCKED (RTX 5060 Ti hardware pending) |
| t_3f006eaa | P2-T2: Node D Multi-Model Stack | 5 | PARTIAL (model swapped, MTP validated CPU-negative, ngram untested) |
| t_a30b85ed | P2-T3: Context Spillover | 5 | PENDING (RPC research, Node A target) |

### Phase 3: Sovereign Plugins

| ID | Title | Priority | Status |
|:---|:------|:--------|:-------|
| t_b73f1d8c | PHASE 3 Epic | 8 | PLANNED (blocked on Phase 2) |
| t_27b29eb4 | P3-T1: Hermes-LCM | 8 | PLANNED |
| t_059e22aa | P3-T2: Directors Forge | 8 | DEPRIORITIZED (euthanized, Kanban MCP replaces) |
| t_ddce11f7 | P3-T3: Mirage VFS | 8 | PLANNED |

### Phase 4: Perception Layer

| ID | Title | Priority | Status |
|:---|:------|:--------|:-------|
| t_eaf700b1 | PHASE 4 Epic | 8 | PLANNED (blocked on Phase 3) |
| t_b2f62de1 | P4-T1: Voice Pipeline | 8 | PLANNED |
| t_d0b6adb8 | P4-T2: Pretext HUD | 8 | PLANNED |
| t_0c281759 | P4-T3: Mesh-wide Verification | 8 | PLANNED |

---

## INFRASTRUCTURE STATUS

| Component | Status | Notes |
|:----------|:-------|:------|
| Kanban MCP Server | LIVE | FastMCP stdio, 8 tools, 13/13 tests |
| LiteLLM Mesh Router | LIVE | Docker Desktop port 4000, 4 routes |
| Gemini CLI Integration | LIVE | Shared kanban MCP, Pro/Flash routing |
| sovereign-sniffer | DEPLOYED | On-demand only, no systemd service |
| hermes-relay v0.6.1 | LIVE | Docker Desktop port 8767, WSS bridge |
| directors-forge | EUTHANIZED | Removed May 17, Kanban MCP replaces |
| KV Cache | ACTIVE | q4_0 (C/D CPU), f16 (B Vulkan) |

---

## CRATE STATUS (post-purge)

| Crate | Status | Action |
|:------|:-------|:-------|
| directors-forge | EUTHANIZED | Removed May 17. Kanban MCP replaces. |
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

## KEY MILESTONES

| Version | Date | Milestone |
|:--------|:-----|:----------|
| 0.1.0-alpha | 2026-05-16 | Phase 0 CLOSED, 4-node mesh operational |
| 0.2.0-alpha | 2026-05-17 | Docker Desktop, mesh-vision, security sweep |
| 0.3.0-alpha | 2026-05-18 | hermes-relay, MTP staging, drift remediation |
| 0.3.1-alpha | 2026-05-18 | Node B b9190 upgrade, Node D model swap, MTP validated |

---
::/5Y573M-N071C3 : KANBAN_V0.3.1_ALPHA. THE_BOARD_IS_TRUTH. // 50V3R31GN-M4CH1N4
