# Screamsheet Factory (Phase 64) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the Screamsheet Architect pipeline to generate and inject high-fidelity SVG flyers into Foundry VTT.

**Architecture:** Data from `Akashik.db` -> Prompted SVG layout on Node C -> VSB Relay -> `50v3r31gn-bridge` Journal injection.

**Tech Stack:** TypeScript, SVG, VT323, VSB (Binary Relay).

---

### Task 1: Prompt Hardening (The Architect)

**Files:**
- Modify: `scripts/forge/skills/screamsheet-architect.md`

- [ ] **Step 1: Test Layout Math with Gemma-4-E2B**
  - Prompt: "Generate a Layout Draft for a Night Market crash at Location X."
  - Verify: Model outputs precise (x, y) coordinates for all 5 segments.

- [ ] **Step 2: Codify SVG Template**
  - Add standard filter definitions (`glitch`, `scanlines`) to the skill shard instructions.

- [ ] **Step 3: Commit**
  ```bash
  git add scripts/forge/skills/screamsheet-architect.md
  git commit -m "feat(ui): harden screamsheet architect prompt with bento-grid math"
  ```

---

### Task 2: Artery Ignition (Data Mesh)

**Files:**
- Create: `src/core/manifest/ScreamsheetService.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Implement data extraction from Gepa**
  - Subscribe to `WORLD_EVENT` emitter.
  - Package event data into a formatted Architect prompt.

- [ ] **Step 2: Commit**
  ```bash
  git add src/core/manifest/ScreamsheetService.ts
  git commit -m "feat(ingest): implement screamsheet data service"
  ```

---

### Task 3: Physical Manifestation (Foundry Mesh)

**Files:**
- Modify: `50v3r31gn-bridge/50v3r31gn-bridge.js`

- [ ] **Step 1: Implement SVG Journal Handler**
  - Add listener for `RENDER_SCREAMSHEET` VSB packets.
  - Create `JournalEntry` and embed SVG as DataURI.

- [ ] **Step 2: Verify End-to-End**
  - Trigger dummy event on Node B.
  - Verify "Night Market Flyer" appears in Foundry.

- [ ] **Step 3: Commit**
  ```bash
  git add 50v3r31gn-bridge/50v3r31gn-bridge.js
  git commit -m "feat(foundry): enable raw SVG journal injection"
  ```
