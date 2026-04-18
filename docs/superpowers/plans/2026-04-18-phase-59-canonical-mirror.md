# Phase 59: Canonical Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achive 1:1 Parity with the official Cyberpunk RED ruleset by ingesting the official repo and porting its logic to Node A (Rust).

**Architecture:** A hybrid ETL pipeline in TypeScript for data ingestion and a high-performance Rules Kernel in Rust for bit-identical execution.

**Tech Stack:** TypeScript, Rust, SQLite, YAML, FNV-1a.

---

### Task 1: Environment & Backup

**Files:**
- Create: `scripts/recovery/backup-mind.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement Backup Utility**

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DB_PATH = 'data/Akashik.db';
const BACKUP_DIR = 'data/archive';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

if (fs.existsSync(DB_PATH)) {
  const backupPath = path.join(BACKUP_DIR, `legacy-mind-${TIMESTAMP}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`◈ BACKUP_COMPLETE: ${backupPath}`);
}
```

- [ ] **Step 2: Add backup script to package.json**

```json
"mind:backup": "tsx scripts/recovery/backup-mind.ts"
```

- [ ] **Step 3: Verify backup execution**

Run: `npm run mind:backup`
Expected: File created in `data/archive/`

- [ ] **Step 4: Commit**

```bash
git add scripts/recovery/backup-mind.ts package.json
git commit -m "infra: add mind backup utility for recovery safety"
```

---

### Task 2: Schema Evolution (Akashik.db v4)

**Files:**
- Modify: `src/db/world-schema.sql`
- Modify: `src/types/world.ts`

- [ ] **Step 1: Update SQL Schema with Canonical Tables**

```sql
-- New tables for Canonical Mirror
CREATE TABLE IF NOT EXISTS dv_tables (
  weapon_category TEXT NOT NULL,
  range_bracket TEXT NOT NULL,
  dv INTEGER NOT NULL,
  PRIMARY KEY (weapon_category, range_bracket)
);

CREATE TABLE IF NOT EXISTS item_components (
  item_id TEXT NOT NULL,
  component_type TEXT NOT NULL,
  PRIMARY KEY (item_id, component_type),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_modifiers (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value INTEGER NOT NULL,
  mode TEXT CHECK(mode IN ('permanent', 'situational')) NOT NULL,
  trigger_tag TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS localized_dictionary (
  key TEXT PRIMARY KEY,
  value_en TEXT NOT NULL
);

-- Expansion of existing tables
ALTER TABLE npcs ADD COLUMN interface_level INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN rez INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN deck_slots INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN head_sp INTEGER DEFAULT 0;
ALTER TABLE npcs ADD COLUMN body_sp INTEGER DEFAULT 0;

ALTER TABLE items ADD COLUMN concealable BOOLEAN DEFAULT 0;
ALTER TABLE items ADD COLUMN slots_used INTEGER DEFAULT 0;
ALTER TABLE items ADD COLUMN reliability TEXT;
ALTER TABLE items ADD COLUMN is_installed BOOLEAN DEFAULT 0;
```

- [ ] **Step 2: Update TypeScript types**

Update `src/types/world.ts` to include the new fields in `Npc` and `Item` interfaces.

- [ ] **Step 3: Verify schema application**

Run: `sqlite3 data/Akashik.db ".schema dv_tables"`
Expected: Table structure matches SQL.

- [ ] **Step 4: Commit**

```bash
git add src/db/world-schema.sql src/types/world.ts
git commit -m "db: evolve schema to v4 for canonical rules mirror"
```

---

### Task 3: The ETL Ingestor (TypeScript)

**Files:**
- Create: `src/core/ingest/CprOfficialIngestor.ts`
- Modify: `src/core/ingest/SovereignIngestService.ts`

- [ ] **Step 1: Implement YAML-to-SQLite Mapper**

```typescript
import fs from 'node:fs';
import yaml from 'js-yaml';
import { Database } from 'better-sqlite3';

export class CprOfficialIngestor {
  constructor(private db: Database, private repoPath: string) {}

  async ingestPacks() {
    // 1. Ingest DV Tables from internal packs
    // 2. Ingest Babele Localization
    // 3. Ingest Core Items (Weapons, Cyberware, etc)
    // 4. Map Actor YAMLs to npcs table
  }
}
```

- [ ] **Step 2: Implement "025-040" Migration Logic**

Translate the JS migrations from the official repo into the TS ingestor to ensure data normalization.

- [ ] **Step 3: Integrate into master Ingest service**

Update `SovereignIngestService` to call `CprOfficialIngestor` as the primary layer.

- [ ] **Step 4: Commit**

```bash
git add src/core/ingest/CprOfficialIngestor.ts src/core/ingest/SovereignIngestService.ts
git commit -m "feat(ingest): implement official CPR repo ETL pipeline"
```

---

### Task 4: Node A Rules Kernel (Rust)

**Files:**
- Modify: `zeroclaw/src/rules/mod.rs`
- Create: `zeroclaw/src/rules/canonical_math.rs`
- Create: `zeroclaw/src/rules/dv_resolver.rs`

- [ ] **Step 1: Implement exploding d10 math in Rust**

```rust
pub fn roll_d10_exploding() -> i32 {
    // Implementation of 10s explode up, 1s explode down
}
```

- [ ] **Step 2: Implement DV Lookup Engine**

Connect to SQLite from Rust to query the `dv_tables`.

- [ ] **Step 3: Implement Modifier Stacking**

Port the `CPRMod` logic into a Rust struct that aggregates permanent and situational bonuses.

- [ ] **Step 4: Verify build**

Run: `cd zeroclaw && cargo build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add zeroclaw/src/rules/
git commit -m "feat(zeroclaw): port canonical combat rules to rust kernel"
```

---

### Task 5: The Nuke & Rebuild Loop

**Files:**
- Create: `scripts/recovery/nuke-and-rebuild-v4.sh`

- [ ] **Step 1: Implement master nuke script**

```bash
#!/usr/bin/env bash
npm run mind:backup
rm data/Akashik.db
rm -rf data/vault/RKG/*
npm run mind:fresh
npm run mind:ingest -- --official
```

- [ ] **Step 2: Run the loop**

Run: `bash scripts/recovery/nuke-and-rebuild-v4.sh`
Expected: Akashik.db rebuilt with 1000+ canonical entities.

- [ ] **Step 3: Commit**

```bash
git add scripts/recovery/nuke-and-rebuild-v4.sh
git commit -m "ops: finalize canonical reconstruction sequence"
```
