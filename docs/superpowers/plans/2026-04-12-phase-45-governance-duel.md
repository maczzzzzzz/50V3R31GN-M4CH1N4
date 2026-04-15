# Phase 45: The Governance Duel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Logic Duel" mechanism to arbitrate conflicts between manual operator actions and the Sovereign Machina's authority.

**Architecture:** Wraps Foundry document updates via **libWrapper** to detect overrides. Dispatches a bimodal audit (Node B will, Node A rules) and renders a real-time "Duel HUD" in the Crush CLI.

**Tech Stack:** JavaScript (Foundry), libWrapper, Bubbletea (CLI), SQLite.

---

### Task 1: Conflict Interception (Bridge)

**Files:**
- Modify: `50v3r31gn-bridge/50v3r31gn-bridge.js`

- [ ] **Step 1: Register libWrapper Hooks**
Wrap `TokenDocument.prototype.update` and `Actor.prototype.update`. Check for `flags.sovereign.authority`.

- [ ] **Step 2: Implement the `conflict_interrupt` event**
If a manual change is detected on an authorized object, send an event to Node B and `await` the verdict.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: phase 45 - implement bridge conflict interceptor"`

---

### Task 2: Arbitration & CLI Duel HUD

**Files:**
- Modify: `crush/main.go`
- Create: `src/core/arbitration-service.ts`

- [ ] **Step 1: Implement Arbitration Service**
Logic to gather Node B's rationale and Node A's skill check result.

- [ ] **Step 2: Build the CLI Duel HUD**
Create a new Bubbletea view in `crush` that flares red and displays the "Will vs. Will" logic stream during arbitration.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: phase 45 - implement arbitration service and duel HUD"`

---

### Task 3: Verification (Live Duel)

- [ ] **Step 1: Run a Test Duel**
1. Set an NPC to `sovereign.authority = true`.
2. Manually move the token in Foundry.
Expected: CLI flares red, shows the duel, and (if Agent wins) the token glides back.

- [ ] **Step 2: Commit**
`git add . && git commit -m "feat: verify governance duel loop"`
