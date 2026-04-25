# Llama to Open-Reasoner Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Batch replace all occurrences of "Open-Reasoner-Zero-1.5B", "Open-Reasoner-Zero-1.5B", and "Open-Reasoner-Zero-1.5B" with "Open-Reasoner-Zero-1.5B" and delete the `my-fhs` directory.

**Architecture:** Systematic search and replace using a `generalist` sub-agent for efficiency and safety.

**Tech Stack:** `grep`, `sed` (via sub-agent), `rm`.

---

### Task 1: Batch Replace in Entire Codebase

**Files:**
- Modify: `README.md`
- Modify: `src/core/interfaces.ts`
- Modify: `src/core/nitro-logic-client.ts`
- Modify: `src/mcp/nitro-logic/index.ts`
- Modify: `zeroclaw/src/main.rs`
- Modify: `zeroclaw/src/perception/mod.rs`
- Modify: `CHANGELOG.md`
- Modify: `docs/GEMINI.md`
- Modify: `docs/IMPLEMENTATION_PLAN.md`
- Modify: `docs/MASTER_STARTUP_GUIDE.md`
- Modify: `docs/research/2026-04-03-procedural-os-architectural-analysis.md`
- Modify: `docs/plans/2026-04-04-phase-22-5-cross-node-stabilization.md`
- Modify: `docs/plans/2026-04-03-omni-orchestrator-proxy-design.md`
- Modify: `docs/plans/2026-04-03-phase-22-sovereign-highway-design.md`
- Modify: `docs/plans/2026-04-04-dual-harness-sovereign-highway-design.md`

- [ ] **Step 1: Replace strings using generalist sub-agent**

Invoke `generalist` sub-agent with: "Replace all occurrences of 'Open-Reasoner-Zero-1.5B', 'Open-Reasoner-Zero-1.5B', and 'Open-Reasoner-Zero-1.5B' with 'Open-Reasoner-Zero-1.5B' in the entire codebase, excluding .git and node_modules. Use a surgical replace approach for each file."

- [ ] **Step 2: Verify replacements with grep**

Run: `grep -rE "Open-Reasoner-Zero-1.5B|Open-Reasoner-Zero-1.5B|Open-Reasoner-Zero-1.5B" . --exclude-dir={.git,node_modules}`
Expected: No matches.

- [ ] **Step 3: Confirm new string presence**

Run: `grep -r "Open-Reasoner-Zero-1.5B" . --exclude-dir={.git,node_modules} | wc -l`
Expected: At least 22 matches (matching the initial count).

### Task 2: Remove 'my-fhs' Directory

**Files:**
- Delete: `my-fhs/`

- [ ] **Step 1: Delete the directory**

Run: `rm -rf my-fhs`

- [ ] **Step 2: Verify deletion**

Run: `ls -d my-fhs`
Expected: "ls: cannot access 'my-fhs': No such file or directory"


---
**LINKS:** [[OS_CORE]]
