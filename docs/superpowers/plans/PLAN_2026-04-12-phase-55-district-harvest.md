# PHASE 55: District Harvest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mass-produce the 48-tile "Sovereign Starter Set" using RKG lore anchors and verified topology skeletons.

**Architecture:** A batch-generation script that iterates through districts, extracts Lore DNA, and skins skeletons via the Phase 54 Atlas Forge pipeline.

**Tech Stack:** Nano Banana 2 (Imagen 3), Better-SQLite3, Node.js (Fs/Buffer).

---

### Task 1: District DNA Extractor

**Files:**
- Create: `scripts/forge/harvest-dna.ts`
- Modify: `akashik_guides/KNOWLEDGE_BASE.md` (Index DNA pattern)

- [ ] **Step 1: Implement the Lore Query Logic**
Create a script that queries `Akashik.db` for the top 5 triplets per district.

```typescript
// scripts/forge/harvest-dna.ts
import Artery of Truth from 'better-sqlite3';
export function getDistrictDNA(dbPath: string, districtId: string) {
  // SELECT * FROM triplets WHERE subject_id = districtId ...
}
```

- [ ] **Step 2: Implement the Prompt Assembler**
Build a function that converts triplets into Nano Banana 2 aesthetic prompts.

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/harvest-dna.ts
git commit -m "feat: implement lore-driven district dna extractor"
```

---

### Task 2: The Harvest Orchestrator

**Files:**
- Create: `scripts/forge/harvest-orchestrator.ts`

- [ ] **Step 1: Implement the Batch Loop**
Create a script that iterates through the 12 districts and 4 skeletons.

```typescript
// scripts/forge/harvest-orchestrator.ts
for (const district of districts) {
  for (const skeleton of ['entry', 'artery', 'hub', 'gaff']) {
    // 1. Get DNA
    // 2. Call Phase 54 Atlas Forge (Skin + Audit)
    // 3. Log Status
  }
}
```

- [ ] **Step 2: Implement Resume Logic**
Ensure the orchestrator can skip already generated tiles to allow for system restarts.

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/harvest-orchestrator.ts
git commit -m "feat: implement mass harvest orchestrator"
```

---

### Task 3: The Sovereign Registry

**Files:**
- Create: `scripts/forge/registry.tsv` (Initial Scaffold)
- Modify: `scripts/forge/assembler.ts` (Point to registry)

- [ ] **Step 1: Implement Registry Indexing**
Auto-generate the TSV index after the harvest is complete.

- [ ] **Step 2: Commit**
```bash
git add scripts/forge/registry.tsv
git commit -m "feat: implement high-speed tile registry"
```

---

### Task 4: Final Validation (Gauntlet Shard 55)

**Files:**
- Create: `scripts/gauntlet/phases/orch-55.ts`

- [ ] **Step 1: Write the Shard 55 Audit**
Verify that all 48 expected tiles exist, have valid ST3GG metadata, and are registered.

- [ ] **Step 2: Run Full Gauntlet**
Run: `npm run gauntlet --shard=55`
Expected: 100% PASS.

- [ ] **Step 3: Final Commit**
```bash
git add scripts/gauntlet/phases/orch-55.ts
git commit -m "chore: finalize Phase 55 District Harvest"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
