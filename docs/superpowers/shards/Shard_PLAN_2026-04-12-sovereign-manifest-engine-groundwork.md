# Sovereign Manifest Engine: Groundwork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the Gauntlet Engine with Bimodal Vision support and implement "Proof of Life" verification for all 43 project phases.

**Architecture:** A TypeScript runner providing a shared `GauntletContext`. 
- **Infrastructure:** Singleton CDP, SQLite, and dual Vision RPC clients.
- **Resiliency:** `recursivePageHunt()` handles Foundry world reloads and CDP target loss.
- **Cognition:** Shards use Node A (Tactical) and Node B (Aesthetic) vision to verify system state.

**Tech Stack:** TypeScript, Playwright (CDP), better-sqlite3, pg, llama-server.

---

### Task 1: Engine Infrastructure & Dual Vision Hooks

**Files:**
- Create: `scripts/gauntlet/types.ts`
- Create: `scripts/gauntlet/engine.ts`
- Create: `scripts/gauntlet/vision-client.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement Vision Client**
Create a wrapper for Node A (Tactical) and Node B (Pixtral) VLM endpoints to allow shards to "see" the session.

- [ ] **Step 2: Implement Context Resiliency**
Add `recursivePageHunt()` to the engine core. This must poll for the `game.ready` global in all available CDP targets after context destruction.

- [ ] **Step 3: Implement Engine Core**
Initialize all clients (DB, PG, CDP, Vision) into the `GauntletContext`.

- [ ] **Step 4: Commit**
`git add . && git commit -m "feat: gauntlet engine infrastructure with bimodal vision and resiliency"`

---

### Task 2: Data & Orchestration Verification Shards (12 Phases)

**Files:**
- Create: `scripts/gauntlet/phases/data-*.ts`
- Create: `scripts/gauntlet/phases/orch-*.ts`

- [ ] **Step 1: Implement DATA Block Verifications (Phases 0, 1, 30, 34, 37, 43)**
Include `audit()` hooks for Zod schemas, pgvector health, and RKG hierarchy.

- [ ] **Step 2: Implement ORCHESTRATION Block Verifications (Phases 2, 4, 15, 18, 22.5, 24)**
Include `audit()` hooks for VSB heartbeat (UDP) and Service PIDs.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement data and orchestration verification shards"`

---

### Task 3: Mechanical & Visual Verification Shards (12 Phases)

**Files:**
- Create: `scripts/gauntlet/phases/mech-*.ts`
- Create: `scripts/gauntlet/phases/vis-*.ts`

- [ ] **Step 1: Implement MECHANICAL Block Verifications (Phases 5, 8, 13, 25, 26, 31, 40)**
Use Node A (Tactical) vision to verify token placement matches `Akashik.db` coordinates.

- [ ] **Step 2: Implement VISUAL Block Verifications (Phases 11, 14, 16, 35, 42)**
Use Node B (Aesthetic) vision to detect white background "leaks" in Journal sheets.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement mechanical and visual verification shards"`

---

### Task 4: Narrative Verification & Full Audit (Remaining 19 Phases)

**Files:**
- Create: `scripts/gauntlet/phases/nar-*.ts`

- [ ] **Step 1: Implement NARRATIVE Block Verifications (Phases 5, 6, 9, 12, 19, 20, 21)**
Verify Story Engine state and Narrative buffer depth.

- [ ] **Step 2: Run Full System Audit**
Run: `npm run gauntlet`
Expected: 🟢 43/43 PHASES VERIFIED.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: complete groundwork pass - all 43 phases verified"`


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
