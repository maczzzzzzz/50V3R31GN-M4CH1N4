# Atlas Forge & NC_GANGS_CORPS Implementation Plan (v3.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-performance campaign generation engine using the **Gemini AI (Imagen 3)** "Nano Banana 2" pipeline and a comprehensive Obsidian "NC_GANGS_CORPS" tactical library.

**Prerequisite:** **Phase 44: Bridge Sovereignty** (Motor Cortex handlers) must be operational.

**Architecture:** A modular suite in `scripts/forge/` that leverages Gemini 1.5 Pro for narrative, Imagen 3 for high-fidelity visuals, and the Phase 44 Bridge Motor Cortex. Uses a SQLite registry for idempotency and St3gg for data-baking into map PNGs.

**Tech Stack:** TypeScript, @google/generative-ai, Playwright (CDP), better-sqlite3, js-yaml, St3gg (Go).

---

### Task 1: NC_GANGS_CORPS Library Export

**Files:**
- Create: `scripts/forge/export-threat-library.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement high-fidelity JSON parser**
Extract `system.stats`, `items`, and `img` from the mook pack JSONs.

- [ ] **Step 2: Generate Obsidian Markdown with Spawn Hook**
Include a "Materialize" button in the note body that calls the Phase 44 `create_actor` Bridge handler.

- [ ] **Step 3: Add `npm run forge:library` and verify**
Run: `npm run forge:library`
Expected: 🟢 500+ factions appear in `D:\Obsidian_RKG\Actors\NC_GANGS_CORPS\`.

- [ ] **Step 4: Commit**
`git add . && git commit -m "feat: implement high-fidelity NC_GANGS_CORPS library export"`

---

### Task 2: The Forge Registry (Checkpoint & Resume)

**Files:**
- Create: `scripts/forge/registry.ts`

- [ ] **Step 1: Define the Forge Schema**
Create a new table `forge_registry` in `Akashik.db` to track `map_id`, `state` (PENDING/BAKED), `sha256`, and `district`.

- [ ] **Step 2: Implement Registry Client**
Add `checkExisting(district)` and `registerForged(data)` methods.

- [ ] **Step 3: Commit**
`git add scripts/forge/registry.ts && git commit -m "feat: implement Forge Registry with checkpointing"`

---

### Task 3: The Dream Loop (DREAM & FORGE)

**Files:**
- Create: `scripts/forge/dream.ts`
- Create: `scripts/forge/google-ai-pipe.ts`

- [ ] **Step 1: DREAM — Narrative Spec Generation**
Query 4,000 seeds for a district. Output `MissionSpec.json` via Gemini 1.5 Pro.

- [ ] **Step 2: FORGE — Nano Banana 2 (Imagen 3)**
Implement the Imagen 3 pipe via `@google/generative-ai` with Style-DNA locking.

- [ ] **Step 3: Commit**
`git add scripts/forge/dream.ts scripts/forge/google-ai-pipe.ts && git commit -m "feat: implement DREAM and FORGE stages"`

---

### Task 4: The Dream Loop (AWAKEN & REMEMBER)

**Files:**
- Create: `scripts/forge/awaken.ts`
- Create: `scripts/forge/remember.ts`

- [ ] **Step 1: AWAKEN — Multi-Modal Vision Audit**
Use Gemini 1.5 Pro (Vision) to audit the generated map against the spec.

- [ ] **Step 2: REMEMBER — Semantic Finalization**
Write the Obsidian "Memory" note with St3gg-embedded map and materialization hooks.

- [ ] **Step 3: Commit**
`git add scripts/forge/awaken.ts scripts/forge/remember.ts && git commit -m "feat: implement AWAKEN and REMEMBER stages"`

---

### Task 5: Master Forge CLI (Slow-Burn Automation)

**Files:**
- Create: `scripts/forge/main.ts`
- Modify: `package.json`

- [ ] **Step 1: Assemble Pipeline with Throttling**
Create the master loop with 15s mandatory stabilization waits between generation calls to respect Google Pro rate limits.

- [ ] **Step 2: Add `npm run forge:atlas`**

- [ ] **Step 3: Final Verification**
Run: `npm run forge:atlas --district=Watson`
Expected: 🟢 Full Watson memory generated, organized, and baked.

- [ ] **Step 4: Commit**
`git add . && git commit -m "feat: finalize Atlas Forge master CLI with resilient slow-burn automation"`
