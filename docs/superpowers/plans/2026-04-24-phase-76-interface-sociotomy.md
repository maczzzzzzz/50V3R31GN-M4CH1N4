# Phase 76: Task 3 - Interface Sociotomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce [SOVEREIGN_OS] as default boot and migrate critical crush commands to the Hermes TUI registry.

**Architecture:** Hardcoded profile invariant in SOVEREIGN-IDENTITY.md and command mapping in the LangGraph Orchestrator.

**Tech Stack:** TypeScript, Markdown, Bash.

---

### Task 1: Default Boot Invariant

- [ ] **Step 1: Update SOVEREIGN-IDENTITY.md**
Set `ACTIVE_PROFILE: [SOVEREIGN_OS]` as the shored default.
Add comment `[BOOT_INVARIANT]` to prevent accidental changes.

- [ ] **Step 2: Update ignite-all.sh**
Ensure the startup sequence initializes the `hub` (Hermes TUI) as the primary terminal focus.

---

### Task 2: Command Migration (Hermes Registry)

- [ ] **Step 1: Map /profile to Hermes**
Modify `src/core/hermes/LangGraphOrchestrator.ts` to recognize `/profile` as a high-priority system command.

- [ ] **Step 2: Map /status (Belt) to Hermes**
Implement a tool call that triggers the `crush belt list` logic and renders it in the Ink TUI.

- [ ] **Step 3: Map /vault to Hermes**
Integrate `crush vault` as an OS-level tool for managing the sharded knowledge graph.

---

### Task 3: Aesthetic Finalization

- [ ] **Step 1: Update TUI Theme**
Update `tutorial-hermes-tui.md` and the Ink-based TUI components to use the new **Gruvbox** palette (Primary: #FABD2F, BG: #282828).

---

### Task 4: Commit & Sync

- [ ] **Step 1: Run Scribe**
```bash
npm run scribe
```

- [ ] **Step 2: Commit**
```bash
git commit -m "feat(interface): enforce OS-default boot and migrate command registry"
```
