# Sovereign Manifest Engine: Control Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Gauntlet Engine into a "Command & Control" motor cortex by implementing self-healing `execute()` hooks for all 43 phases.

**Architecture:** Expands `GauntletContext` with VSB packet injection, direct memory manipulation, and administrative JS script injection. Each shard implements a resilient, retrying `execute()` hook that can physically manifest errors via Pretext overlays.

**Tech Stack:** TypeScript, Playwright (CDP), Node.js dgram (UDP), child_process.

---

### Task 1: Context Expansion (The Control API)

**Files:**
- Modify: `scripts/gauntlet/types.ts`
- Modify: `scripts/gauntlet/engine.ts`

- [ ] **Step 1: Add Write-Hooks to GauntletContext**
Add `vsb.send`, `bridge.runScript`, `bridge.injectCSS`, and `cli.execute` to the context.

- [ ] **Step 2: Implement Implementation Hooks**
Implement the UDP socket for VSB and the `page.evaluate` wrappers for Bridge injection.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: expand gauntlet context with write-capable control hooks"`

---

### Task 2: Data & Orchestration Control implementation

**Files:**
- Modify: `scripts/gauntlet/phases/data-*.ts`
- Modify: `scripts/gauntlet/phases/orch-*.ts`

- [ ] **Step 1: Implement DATA Block Control (0, 1, 30, 34, 37, 43)**
Add `execute()` hooks for `runMigration()`, `reconstructVault()`, and `forceSync()`.

- [ ] **Step 2: Implement ORCHESTRATION Block Control (2, 4, 15, 18, 22.5, 24)**
Add `execute()` hooks for `restartService()`, `sendVsbPacket()`, and `purgeZombies()`.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement data and orchestration control hooks"`

---

### Task 3: Mechanical & Visual Control Implementation

**Files:**
- Modify: `scripts/gauntlet/phases/mech-*.ts`
- Modify: `scripts/gauntlet/phases/vis-*.ts`

- [ ] **Step 1: Implement MECHANICAL Block Control (5, 8, 13, 25, 26, 31, 40)**
Add `execute()` hooks for `resolveAttack()`, `spawnMission()`, and `triggerDrift()`.

- [ ] **Step 2: Implement VISUAL Block Control (11, 14, 16, 35, 42)**
Add `execute()` hooks for `triggerOverlay()`, `captureSnapshot()`, and `enforceTheme()`.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement mechanical and visual control hooks"`

---

### Task 4: Narrative Control & Machina Integration

**Files:**
- Modify: `scripts/gauntlet/phases/nar-*.ts`
- Create: `tests/integration/machina-control-test.ts`

- [ ] **Step 1: Implement NARRATIVE Block Control (5, 6, 9, 12, 19, 20, 21)**
Add `execute()` hooks for `onboardNPC()`, `mutateSpeech()`, and `injectLatentSeed()`.

- [ ] **Step 2: Sovereign Machina Parity Test**
Implement a test where the Machina calls a shard's `execute()` to manipulate the world state.

- [ ] **Step 3: Final Verification**
Run: `npx tsx tests/integration/machina-control-test.ts`
Expected: 🟢 SUCCESS — Sovereign control established.

- [ ] **Step 4: Commit**
`git add . && git commit -m "feat: complete sovereign control upgrade and machina integration"`
