# Phase 108: Cyberpunk RED Plugin Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surgically extract all simulation-specific logic (Cyberpunk RED, Foundry VTT, NPC Mechanics) into a dedicated plugin, achieving a Clean BASE Sovereign OS.

**Architecture:** We will decouple the core OS logic from the simulation by moving specific files and folders to a new `plugins/sovereign-red-plugin/` directory. We will also unify simulation-specific database tables into a separate `cyberpunk.db`. The core nervous system will interact with this logic only through well-defined plugin interfaces (MCP/VSB).

**Tech Stack:** TypeScript (Node.js), Rust, SQLite

---

### Task 1: Artery of Truth Decoupling (Artery of Truth Unification)

**Files:**
- Modify: `packages/hermes-core/src/db/unified-oracle-client.ts`
- Create: `data/cyberpunk.db`
- Modify: `packages/hermes-core/src/db/world-schema.sql`

- [ ] **Step 1: Extract Simulation Schema**

Identify all simulation-specific tables in `world-schema.sql` (NPCs, gear, factions, gigs) and move them to a new `plugins/sovereign-red-plugin/db/cyberpunk-schema.sql`.

- [ ] **Step 2: Initialize cyberpunk.db**

Create the `data/cyberpunk.db` file and initialize it with the extracted schema.

- [ ] **Step 3: Refactor UnifiedOracleClient**

Update `unified-oracle-client.ts` to only manage the core `world.db` tables. Remove all `UPDATE_NPC`, `ADD_LORE`, and simulation-specific action handlers. These will be handled by the plugin's own DB client.

- [ ] **Step 4: Verify Artery of Truth Purity**

Run a script to ensure `world.db` no longer contains simulation tables.

- [ ] **Step 5: Commit**

```bash
git add packages/hermes-core/src/db/
git commit -m "feat(arch): decouple simulation database from core OS"
```

---

### Task 2: Core Logic Extraction (Nervous System)

**Files:**
- Move: `packages/hermes-core/src/api/foundry-adapter.ts` -> `plugins/sovereign-red-plugin/src/api/foundry-adapter.ts`
- Move: `packages/hermes-core/src/core/onboarding-controller.ts` -> `plugins/sovereign-red-plugin/src/core/onboarding-controller.ts`
- Move: `packages/hermes-core/src/core/economy/` -> `plugins/sovereign-red-plugin/src/core/economy/`
- Move: `packages/hermes-core/src/core/pulse-engine.ts` -> `plugins/sovereign-red-plugin/src/core/pulse-engine.ts`
- Modify: `packages/hermes-core/src/main.ts`

- [ ] **Step 1: Move Simulation Components**

Physically move the identified files to the `plugins/sovereign-red-plugin/` directory.

- [ ] **Step 2: Neutralize main.ts**

Remove the initialization of `FoundryAdapter` and simulation-specific controllers from the core `main.ts` entry point.

- [ ] **Step 3: Update Imports**

Fix any broken imports created by the move.

- [ ] **Step 4: Verify Compilation**

Run: `nix develop --command npm run build`
Expected: Successful build without simulation logic in `hermes-core`.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(arch): surgically extract simulation logic to RED plugin"
```

---

### Task 3: Mechanical Sector Migration (Rust Extraction)

**Files:**
- Move: `zeroclaw/` -> `plugins/sovereign-red-plugin/zeroclaw/`
- Modify: `Cargo.toml` (root)

- [ ] **Step 1: Move zeroclaw directory**

Move the entire `zeroclaw/` directory into the plugin workspace.

- [ ] **Step 2: Update Cargo Workspace**

Remove `zeroclaw/crates/*` from the root `Cargo.toml` workspace members and add the new path.

- [ ] **Step 3: Verify Rust Compilation**

Run: `cargo check`
Expected: Successful compilation of all crates in their new locations.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(arch): move zeroclaw mechanical sector to RED plugin"
```

---

### Task 4: Clean BASE Verification & Audit

**Files:**
- Create: `docs/superpowers/audit/2026-05-01/CLEAN_BASE_VERIFICATION.md`

- [ ] **Step 1: Perform Lore-Bleed Audit**

Run a project-wide `grep` for "cyberpunk", "chrome", "night city", etc., in the core `packages/` and `src/` directories.

- [ ] **Step 2: Neutralize Remnants**

Surgically remove any remaining comments or non-functional references to simulation lore.

- [ ] **Step 3: Finalize Clean BASE Manifest**

Document the resulting architecture and verify against the "Clean BASE" invariants in the audit report.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/audit/
git commit -m "audit: verify clean base sovereignty"
```
