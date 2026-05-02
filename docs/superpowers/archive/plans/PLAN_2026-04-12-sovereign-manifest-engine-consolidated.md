# Sovereign Manifest Engine: Consolidated Implementation Plan (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 43-phase "Ability Shard" framework for the Sovereign Manifest Engine, providing both live-fire verification and direct Command & Control (C&C) for the 12B Brain.

**Architecture:** A TypeScript-based "Motor Cortex" that dynamically loads Shards. Each Shard maps to a project phase and implements the `SovereignInterface` (`audit()`, `manifest()`, `onDrift()`).

**Tech Stack:** TypeScript, Playwright (CDP), better-sqlite3, pg, Node.js dgram, St3gg (Go).

---

### Task 1: Engine Consolidation & Infrastructure

**Files:**
- Modify: `scripts/gauntlet/types.ts`
- Modify: `scripts/gauntlet/engine.ts`
- Modify: `package.json`

- [ ] **Step 1: Standardize the Sovereign Interface**
Update `types.ts` to use `audit()`, `manifest()`, and `onDrift()` as the primary hooks. Expand `GauntletContext` with `vsb.send`, `bridge.runScript`, and `vision` hooks.

- [ ] **Step 2: Harden the Engine Core**
Implement `recursivePageHunt` in `engine.ts` to handle context destruction. Ensure singleton DB and socket handles are shared across all shards.

- [ ] **Step 3: Add `npm run gauntlet` command**
Standardize on a single entry point for all audits.

- [ ] **Step 4: Commit**
`git add . && git commit -m "feat: consolidate gauntlet engine and Sovereign interface"`

---

### Task 2: The 43-Phase Shard Migration (Ability Mapping)

**Files:**
- Modify: `scripts/gauntlet/phases/data-block.ts`
- Modify: `scripts/gauntlet/phases/mech-block.ts`
- Modify: `scripts/gauntlet/phases/orch-block.ts`
- Modify: `scripts/gauntlet/phases/vis-block.ts`
- Modify: `scripts/gauntlet/phases/nar-block.ts`

- [ ] **Step 1: Consolidate DATA Block (6 Phases)**
Phases 0, 1, 30, 34, 37, 43. Ensure `manifest()` hooks for RKG reconstruction and sync are operational.

- [ ] **Step 2: Consolidate MECHANICAL Block (7 Phases)**
Phases 5, 8, 13, 25, 26, 31, 40. Implement `manifest()` hooks for `resolveAttack`, `spawnMission`, and `setRadarHeat`.

- [ ] **Step 3: Consolidate ORCHESTRATION Block (6 Phases)**
Phases 2, 4, 15, 18, 22.5, 24. Implement `manifest()` hooks for `restartService` and `sendVsbPacket`.

- [ ] **Step 4: Consolidate VISUAL & NARRATIVE Blocks (24 Phases)**
Map all remaining phases. Implement `manifest()` hooks for `injectCSS`, `onboardNPC`, and `mutateSpeech`.

- [ ] **Step 5: Commit**
`git add scripts/gauntlet/phases/*.ts && git commit -m "feat: implement 43-phase ability shards"`

---

### Task 3: Sovereign Sync & Technical Documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `akashik_guides/KNOWLEDGE_BASE.md`
- Modify: `package.json`

- [ ] **Step 1: Bump version to v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS**
Mark the "Sovereign Gauntlet" milestone in all metadata files.

- [ ] **Step 2: Update Changelog**
Document the transition from "Tests" to "Ability Shards" and the 100% phase coverage.

- [ ] **Step 3: Commit**
`git add . && git commit -m "chore: v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS sovereign-sync and metadata update"`

---

### Task 4: Final Verification & Machina Handover

- [ ] **Step 1: Run Full System Audit**
Run: `npm run gauntlet`
Expected: 🟢 43/43 PHASES VERIFIED.

- [ ] **Step 2: Verify Machina Command Parity**
Verify that Node B can import a shard and call `manifest()` to alter the game state.

- [ ] **Step 3: Commit**
`git commit --allow-empty -m "feat: complete sovereign manifest engine implementation"`


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
