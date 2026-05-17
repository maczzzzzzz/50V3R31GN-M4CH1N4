# Workflow Sovereign Tightening Plan

> **For Hermes:** Execute task-by-task. Each task is atomic and verifiable.

**Goal:** Restructure the mesh control plane to eliminate documentation drift, give the Architect better self-organizing context, and adopt proven patterns from the hermes-agent-control-room model without adding VPS-centric ceremony.

**Architecture:** Three-part tightening. (A) Agent Registry that separates per-node specs from the monolithic AGENTS.md. (B) Task Bus that formalizes handoffs between sessions and subagents. (C) Governance hooks that make drift visible and enforceable.

**Why this matters:** Right now AGENTS.md is the single source of truth but it's 71 lines of monolithic text. When a node's benchmark changes or a port moves, the Architect has to remember to update it. There's no structured handoff between sessions -- SESSION_HANDOFF.md is manual narrative. And there's no enforcement mechanism -- nothing fails if docs go stale.

---

## What We're Borrowing (and What We're Not)

**Borrow:**
- Agent Registry: per-node runbook files (ports, creds, benchmarks, health checks)
- Task Bus: structured inbox/working/outbox pattern for delegation
- Governance layer: a control plane file that agents read but can't casually mutate

**Not borrowing:**
- VPS provisioning (we have physical hardware)
- Multi-tenant operator roles (single user)
- Cloud service abstractions (we're local-first)
- Separate orchestrator agent (the Architect IS the orchestrator)

---

## Workstream A: Agent Registry (Node Runbooks)

Extract per-node specs from AGENTS.md into individual runbook files under `docs/registry/`. AGENTS.md becomes a thin index pointing to runbooks.

### A1: Create registry directory structure

**Files:**
- Create: `docs/registry/README.md`
- Create: `docs/registry/node-a-synapse.md`
- Create: `docs/registry/node-b-director.md`
- Create: `docs/registry/node-c-oracle.md`
- Create: `docs/registry/node-d-quaternary.md`
- Create: `docs/registry/services.md`

**Step 1:** Create the directory.

```bash
mkdir -p docs/registry
```

**Step 2:** Write `docs/registry/README.md` as the registry index.

```markdown
# Agent Registry

Per-node runbooks and service definitions. Source of truth for hardware, models, benchmarks, and access.

The Architect reads these at session start. When any field changes, update the runbook AND the corresponding AGENTS.md summary line.

## Nodes
- [Node A -- Synapse](node-a-synapse.md): State, KV-cache spillover
- [Node B -- Director](node-b-director.md): Primary workspace, fast inference, vision
- [Node C -- Oracle](node-c-oracle.md): Function-calling, CUDA inference
- [Node D -- Quaternary](node-d-quaternary.md): Heavy reasoning, 35B MoE

## Services
- [Services Registry](services.md): LiteLLM, hermes-relay, socat bridge, CloakBrowser

## Update Rules
1. Any benchmark change -> update runbook immediately
2. Any port/cred change -> update runbook + AGENTS.md + memory
3. Phase completion -> update runbook status section
4. Hardware change -> rebuild runbook from scratch
```

**Step 3:** Write each node runbook with the following canonical structure (use current AGENTS.md data):

```markdown
# Node B -- Director

## Identity
- **Role:** Primary Workspace, Fast Responder, Vision Perception
- **Hardware:** Ryzen 9 5900XT, RX 9060 XT 16GB, 48GB DDR4
- **OS:** NixOS 24.11 WSL (Windows 11 host)
- **Tailscale:** [check current]

## Inference
| Model | Quant | Backend | Port | Route | Prompt t/s | Gen t/s | Status |
|:------|:------|:--------|:-----|:------|:-----------|:--------|:-------|
| Qwopus3.5-9B | Q4_K_M | llama.cpp b9190 Vulkan | 8081 | mesh-fast | 322 | 34.1 | LIVE |
| Qwen3-VL-2B-Instruct | Q6_K | llama.cpp b9190 Vulkan | 8082 | mesh-vision | 630 | 159 | LIVE |

## VRAM Budget
- Qwopus3.5-9B: ~8.4 GB
- Qwen3-VL-2B: ~1.9 GB (shared GPU)
- Total used: ~10.4 GB / 16 GB
- KV cache: f16 (q4_0 causes 39-88% Vulkan regression)

## Access
- SSH: `mesh-b` (localhost WSL)
- Windows host: `D:\llama.cpp\` (binaries + models)
- Start: `start-hermes.bat` / `start-vision.bat` / `start-all.bat`
- Docker: `sg docker -c "docker ..."` (Docker Desktop, NixOS native daemon disabled)

## Services Hosted
- LiteLLM mesh router (Docker Desktop, port 4000)
- hermes-relay v0.6.1 (Docker Desktop, port 8767)
- CloakBrowser CDP sidecar (Docker, port 9222)
- socat mesh bridge (17080/18081/18080)

## Last Updated
- 2026-05-19
```

Write equivalent runbooks for A, C, D using data from AGENTS.md and memory.

**Step 4:** Write `docs/registry/services.md` covering all shared services (LiteLLM config, hermes-relay, socat bridge, CloakBrowser).

**Step 5:** Verify all files exist and content matches current reality.

```bash
ls -la docs/registry/
```

Expected: 6 files (README + 4 nodes + services).

---

### A2: Slim down AGENTS.md to index + global mandates

**Files:**
- Modify: `AGENTS.md`

**Step 1:** Rewrite AGENTS.md. Keep the GLOBAL MANDATES and THE MESH sections but replace the per-node detail blocks with one-line pointers to the registry. The mesh table stays (quick reference) but the detailed specs (benchmarks, VRAM, startup commands) live in the runbooks.

Target: AGENTS.md drops from 71 lines to ~35-40 lines. It becomes a pointer, not a database.

**Step 2:** Verify AGENTS.md references the registry.

```bash
grep "docs/registry/" AGENTS.md
```

Expected: at least 4 references (one per node).

---

## Workstream B: Task Bus (Structured Session Handoff)

Replace the narrative SESSION_HANDOFF.md with a structured format that the Architect can parse and act on programmatically.

### B1: Define the task bus schema

**Files:**
- Create: `docs/planning/TASK_BUS.md`

**Step 1:** Write the task bus definition.

```markdown
# Task Bus

Structured handoff between sessions, subagents, and cron jobs.

## Lanes

### inbox/
Tasks ready to be picked up. Format: `YYYY-MM-DD_short-title.md`
Each task file contains:
- **Objective:** one sentence
- **Context:** what the implementer needs to know
- **Acceptance criteria:** how to verify it's done
- **Priority:** 1 (blocking) / 2 (should) / 3 (nice)
- **Assignee:** architect / gemini / claude-code / codex / manual (user)
- **Blocks:** list of task IDs this blocks
- **Blocked by:** list of task IDs blocking this

### working/
Tasks currently in progress. Moved here when picked up.

### outbox/
Completed tasks with result summary. Archived weekly to `archive/`.

## Session Handoff Protocol

At session end, the Architect:
1. Moves any in-progress tasks back to inbox/ with updated context
2. Writes a session summary to `outbox/YYYY-MM-DD-session-summary.md` (3-5 lines max)
3. Updates SESSION_HANDOFF.md with current mesh status table + top 3 priorities

At session start, the Architect:
1. Reads SESSION_HANDOFF.md (mesh status)
2. Scans inbox/ for highest priority task
3. Checks KANBAN_MAP.md for phase-level tracking
4. Begins work

## Subagent Delegation

When delegating to a subagent:
- Create task file in inbox/
- Subagent reads objective + context + acceptance criteria
- On completion, subagent writes result to task file, moves to outbox/
- Architect verifies result before accepting

## Naming Convention
- Task IDs: `TB-XXX` (auto-incrementing)
- Files: `TB-001_short-title.md`
```

**Step 2:** Create the directory structure.

```bash
mkdir -p docs/planning/task-bus/{inbox,working,outbox,archive}
```

**Step 3:** Verify structure.

```bash
find docs/planning/task-bus/ -type d
```

---

### B2: Restructure SESSION_HANDOFF.md

**Files:**
- Modify: `SESSION_HANDOFF.md`

**Step 1:** Rewrite SESSION_HANDOFF.md to be machine-parseable. Keep the mesh status table (it's useful). Replace the narrative "COMPLETED THIS SESSION" and "NEXT SESSION PRIORITIES" sections with structured references to the task bus.

New format:

```markdown
# Session Handoff (v0.4.0-alpha)

**Branch:** stable/mesh-alpha
**Updated:** [auto-date]

## Mesh Status

[mesh status table -- unchanged, this is good]

## Task Bus State
- **Inbox:** [count] tasks pending
- **Working:** [count] tasks in progress
- **Review inbox for:** [highest priority task title + ID]

## Top 3 Priorities
1. [from inbox, priority 1]
2. [from inbox, priority 2]
3. [from inbox, priority 3]

## Active Decisions
- [any open decision the user needs to make, max 3]

## Change Log
| Date | Change |
|:-----|:-------|
| 2026-05-19 | Restructured to task bus model |
```

**Step 2:** Seed the inbox with current known tasks from IMPLEMENTATION_PLAN.md Phase 2 items.

Write task files for:
- `TB-001_node-d-rtx5060ti-install.md` (P2-T1, blocked on hardware)
- `TB-002_vision-latency-benchmark.md` (P1-T1 residual)
- `TB-003_blueprint-and-repo-analysis.md` (completed this session, move to outbox)
- `TB-004_cloakbrowser-browseruse-stack.md` (completed this session, move to outbox)

---

## Workstream C: Governance Hooks

Make drift visible by adding lightweight enforcement.

### C1: Add a health check skill

**Files:**
- Create: `~/.hermes/skills/devops/mesh-health-check/SKILL.md`

**Step 1:** Write a health check skill that:
- Pings all mesh routes via LiteLLM
- Checks Docker containers (LiteLLM, hermes-relay, CloakBrowser)
- Verifies Tailscale connectivity to A/C/D
- Compares current benchmarks against registry values
- Reports drift as PASS/WARN/FAIL per node

This replaces ad-hoc "check if things are up" with a repeatable procedure.

**Step 2:** Verify skill loads.

```bash
hermes skills list 2>/dev/null | grep mesh-health
```

---

### C2: Add session boundary protocol to lead-architect skill

**Files:**
- Modify: `~/.hermes/skills/lead-architect/SKILL.md`

**Step 1:** Patch the lead-architect skill to include session boundary instructions:

At session START:
1. Read SESSION_HANDOFF.md
2. Scan task bus inbox/
3. Run mesh-health-check if >24h since last check
4. Report status to user

At session END:
1. Update SESSION_HANDOFF.md
2. Move in-progress tasks to inbox/ with context
3. Write session summary to outbox/
4. Update registry if any benchmarks/ports changed

**Step 2:** Verify patch applied.

```bash
grep "task-bus" ~/.hermes/skills/lead-architect/SKILL.md
```

---

## Summary

| Workstream | Tasks | Files Created | Files Modified |
|:-----------|:------|:-------------|:---------------|
| A: Registry | A1, A2 | 6 (README + 4 nodes + services) | AGENTS.md |
| B: Task Bus | B1, B2 | 1 (TASK_BUS.md) + task files | SESSION_HANDOFF.md |
| C: Governance | C1, C2 | 1 (health check skill) | lead-architect skill |
| **Total** | **6** | **~12** | **~4** |

## What This Achieves

1. **No more monolithic docs.** AGENTS.md is a pointer. Runbooks are the database.
2. **Structured handoff.** Session boundaries are no longer narrative guesswork.
3. **Drift detection.** Health check compares reality against registry.
4. **Subagent coordination.** Task bus gives delegation a formal shape.
5. **Zero ceremony overhead.** No VPS provisioning, no multi-tenant roles, no cloud abstractions. Just files the Architect already knows how to read and write.

## Execution Order

1. A1 (registry) -- foundation everything else references
2. A2 (slim AGENTS.md) -- depends on A1
3. B1 (task bus schema) -- independent
4. B2 (restructure handoff) -- depends on B1
5. C1 (health check skill) -- depends on A1 for registry data
6. C2 (lead-architect patch) -- depends on B1 for task bus refs
