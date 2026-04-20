# Phase 47: Universal Codex & Synapse Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonize all fragmented lore (Fandom Scrapes, 16+ PDFs, RKG Triplets) into a unified, high-performance District-based Synapse Palace.

**Architecture:** Upgrades `Akashik.db` with relational district keys and implements a multi-source harmonization engine. Updates the shell-based reconstruction script to organize the Obsidian vault into a semantic tactical atlas.

**Tech Stack:** TypeScript, SQLite (FTS5), pgvector, Shell.

---

### Task 1: Schema Upgrade (Relational Integrity)

**Files:**
- Modify: `data/Akashik.db` (via migrations)

- [ ] **Step 1: Implement Schema Migrations**
Add `district_id` to `npcs`, `factions`, `locations`, and `triplets`. Create the `districts` reference table.

- [ ] **Step 2: Commit**
`git add . && git commit -m "feat: phase 47 - upgrade database schema for district-based relational integrity"`

---

### Task 2: Harmonization Engine (The Great Sync)

**Files:**
- Create: `scripts/forge/harmonize-codex.ts`

- [ ] **Step 1: Implement Multi-Source Linker**
Create a script that:
1.  Iterates through 36 `district_dna` entries (Fandom).
2.  Grep-scans 3,300+ chronicles (PDFs) for district mentions.
3.  Populates the new `district_id` columns and creates "is located in" triplets.

- [ ] **Step 2: Run Harmonization and Verify**
Run: `npx tsx scripts/forge/harmonize-codex.ts`
Expected: 🟢 1000+ entities linked to formal districts in `Akashik.db`.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: phase 47 - implement multi-source codex harmonization engine"`

---

### Task 3: Semantic Palace Reconstruction

**Files:**
- Modify: `scripts/reconstruct-palace.sh`

- [ ] **Step 1: Upgrade Reconstruction Logic**
Update the script to:
1.  Create `Atlas/Districts/<District_Name>/` folders.
2.  Organize Actors, lore, and items by their primary district.
3.  Inject `#rkg/district/<name>` and Dataview properties into frontmatter.

- [ ] **Step 2: Run Reconstruct and Verify**
Run: `npm run reconstruct`
Expected: 🟢 Obsidian vault displays a hierarchical, district-first structure.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: phase 47 - implement semantic district-first vault reconstruction"`

---

### Task 4: Search Optimization (Zero-Latency)

**Files:**
- Modify: `src/core/unified-oracle.ts`

- [ ] **Step 1: Implement FTS5 and Vector Search**
Enable SQLite FTS5 on the harmonized tables and optimize pgvector queries for cross-district narrative retrieval.

- [ ] **Step 2: Commit**
`git add . && git commit -m "feat: phase 47 - optimize universal codex for zero-latency retrieval"`
