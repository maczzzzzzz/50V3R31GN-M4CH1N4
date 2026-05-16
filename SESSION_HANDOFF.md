# SESSION HANDOFF -- 2026-05-16 04:50 UTC

**Branch:** stable/mesh-alpha
**Model:** GLM-4.7 via Z.ai (switched from GLM-5 mid-session)
**Node B Gateway:** Running clean (PID 24066, up 26min, zero kanban errors)

---

## WHAT HAPPENED (24hr Forensic)

### Root Cause of 11hr Outage
`kanban_db.py` had `idx_events_run` index in `SCHEMA_SQL` referencing `run_id` column. Legacy DBs created before the migration that adds `run_id` would crash with `sqlite3.OperationalError: no such column: run_id` on every kanban tick (~47 errors/min). This cascaded into:
- Gateway memory bloat (209MB + 84MB swap)
- Directors-forge restart loop (185 restarts, wrong `/var/lib/` perms)
- System memory exhaustion -> reboots

### Fixes Applied This Session
1. **kanban_db.py schema fix** -- Moved `idx_events_run` from SCHEMA_SQL into migration block
2. **sovereign_vsb removal** -- 651 lines deleted, replaced by LiteLLM mesh router
3. **directors-forge** -- Service stopped, needs nixos-rebuild to apply module fix
4. **Stale files purged** -- 22+ crate modules, handoff docs, test-standalone DB deleted
5. **Hermes fork synced** -- Was 275 commits behind upstream, now 0. Merge conflicts in README.md, environments/agent_loop.py, uv.lock all resolved. All sovereign plugins preserved.
6. **Fork default branch** -- Changed from `main` to `stable/mesh-alpha` on GitHub. `main` fast-forwarded to upstream.
7. **Stale CI workflows** -- 4 deleted (ci-master.yml, ci-pr.yml, qa.yml, submodule-audit.yml). All targeted wrong branches.

---

## CURRENT MESH STATE

| Node | Status | Role | Service |
|:-----|:-------|:-----|:--------|
| Node B | ONLINE | Director (this machine) | LiteLLM port 4000, Gateway running |
| Node C | ONLINE (Tailscale 100.102.109.81) | Oracle | ik_llama.cpp CUDA, port 8081 |
| Node D | ONLINE (Tailscale 100.120.225.12) | Quaternary | ik_llama.cpp AVX2, port 8081 |
| Node A | ONLINE (Tailscale 100.90.196.70) | Synapse | No inference |

---

## PHASE 0 VALIDATION GATE -- What's Actually Done

### DONE
- [x] V0-T1: Node B benchmark (prompt 93.2 t/s, gen 33.7 t/s, Vulkan)
- [x] V0-T2: Node D benchmark (prompt 8.8 t/s, gen 6.1 t/s, AVX2)
- [x] V0-T3: LiteLLM mesh routing (3 groups: mesh-fast/mesh-function-calling/mesh-heavy)
- [x] V0-T5: Tailscale artery (all 5 nodes connected, healthy)

### NOT VERIFIED (needs confirmation)
- [ ] V0-T4: TurboQuant (q4_0 KV-cache) -- claimed but not independently verified on each node

### BLOCKERS BEFORE PHASE WORK
1. **Node B nixos-rebuild** -- directors-forge module fix needs a rebuild to apply. Service is currently stopped (unit not found).
2. **Node C SSD mount** -- SOVEREIGN_SOUL (476.9GB ext4) mount pending. Requires sudo on Node C.
3. **Kanban MCP server** -- Scaffolded at `sidecars/kanban-mcp-server/`, 13/13 tests passing, configured in config.yaml. **Gateway restart needed to activate MCP tools.** (was done but session crashed before verification)

---

## NEXT SESSION PRIORITIES (in order)

### 1. Activate Kanban MCP Tools
Restart gateway, verify `hermes kanban` commands work through MCP. This unblocks cross-agent coordination with Gemini CLI.

### 2. Verify TurboQuant on All Nodes
Confirm q4_0 KV-cache is actually active on Node B (Vulkan), Node C (CUDA), Node D (AVX2). Check ik_llama.cpp launch flags.

### 3. Node C SSD Mount
SSH to 100.102.109.81, mount SOVEREIGN_SOUL, update /etc/fstab. This is needed for model storage expansion.

### 4. Node B nixos-rebuild
Apply directors-forge fix. Re-evaluate if directors-forge is still needed or if it should be killed entirely (kanban MCP may replace it).

### 5. Phase 1 Work (after Phase 0 gate closes)
Start with the highest-value Phase 1 items. Kanban MAP has the full breakdown. Cross-cutting tasks (t_mcp_001-005) should run in parallel with Phase 1.

---

## REPO STATE

### Parent: 50V3R31GN-M4CH1N4-stable-mesh-alpha
- Branch: stable/mesh-alpha
- Latest: `2d30e04` chore: remove stale CI workflows
- 3 commits ahead of origin
- Dependabot: 46 vulnerabilities (hermes-agent submodule deps, not urgent)

### Fork: 50V3R31GN-M4CH1N4-hermes-agent-fork
- Default branch: stable/mesh-alpha (changed from main)
- `main`: synced to upstream (0 behind)
- `stable/mesh-alpha`: synced to upstream (0 behind)
- 34 sovereign commits ahead of upstream
- All 6 sovereign plugins preserved (mirage-vfs, n8n-mcp, telegram-artery, hermes-lcm, psy-core, sovereign_vsb removed separately)

### Sovereign Plugins Status
| Plugin | Location | Status |
|:-------|:---------|:-------|
| mirage-vfs | plugins/general/mirage-vfs/ | Preserved, path traversal fix applied |
| n8n-mcp | plugins/general/n8n-mcp/ | Preserved, MCP tool registration fixed |
| telegram-artery | plugins/general/telegram-artery/ | Preserved, memory leak fix applied |
| hermes-lcm | plugins/memory/hermes-lcm/ | Preserved, SQLite fix applied |
| psy-core | plugins/general/psy-core/ | Preserved, signature hardening applied |
| sovereign_vsb | plugins/model_providers/sovereign_vsb/ | REMOVED (replaced by LiteLLM) |

---

## KEY FILES
- Kanban MAP: `docs/planning/KANBAN_MAP.md`
- LiteLLM config: `sidecars/mesh/litellm-mesh.yaml`
- Kanban MCP server: `sidecars/kanban-mcp-server/`
- Hermes fork: `sidecars/hermes-agent-nous/`
- AGENTS.md: root
- LEAD_ARCHITECT.md: root

---
::/5Y573M-N071C3 : HANDOFF_V3_8_ALPHA. CLEAN_MESH. READY_FOR_PHASE_WORK. // 50V3R31GN-M4CH1N4
