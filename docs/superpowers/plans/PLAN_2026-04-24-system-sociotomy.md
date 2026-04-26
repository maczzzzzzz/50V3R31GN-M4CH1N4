# Phase 1: Sociotomy & Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Physically and logically separate the Sovereign Intelligence OS from the Cyberpunk RED simulation.

**Architecture:** Initialize a new SQLite store (`SovereignIntelligence.db`) for OS-level data, migrate functional tables from `Akashik.db`, and deploy a root-level `SOVEREIGN-IDENTITY.md` to govern profile-based resource routing.

**Tech Stack:** SQLite, Bash, Markdown/YAML, treefmt.

---

### Task 1: System Hardening (treefmt Integration)

**Files:**
- Modify: `flake.nix`
- Create: `treefmt.toml`

- [ ] **Step 1: Add treefmt to flake.nix**

- [ ] **Step 2: Create treefmt.toml configuration**

- [ ] **Step 3: Verify treefmt execution**

Run: `treefmt --version`

- [ ] **Step 4: Commit**

```bash
git add flake.nix treefmt.toml
git commit -m "chore: integrate treefmt universal linter"
```

### Task 2: Initialize SovereignIntelligence.db

**Files:**
- Create: `data/SovereignIntelligence.db`
- Create: `scripts/ops/init_intelligence_store.sh`

- [ ] **Step 1: Write the initialization script**

```bash
#!/bin/bash
# scripts/ops/init_intelligence_store.sh
DB_PATH="data/SovereignIntelligence.db"

sqlite3 "$DB_PATH" <<EOF
CREATE TABLE system_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decision_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    logic_hash TEXT NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('VETO', 'PASS')),
    rationale TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE palace_wings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    wing_type TEXT NOT NULL CHECK (wing_type IN ('DISTRICT', 'FACTION', 'PLAYER')),
    description TEXT,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE palace_rooms (
    id TEXT PRIMARY KEY,
    wing_id TEXT NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('POI', 'SCENE', 'ENCOUNTER')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(wing_id) REFERENCES palace_wings(id) ON DELETE CASCADE
);

CREATE TABLE os_triplets (
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

echo "::/5Y573M-N071C3 : SOVEREIGN_INTELLIGENCE_STORE_INITIALIZED."
```

- [ ] **Step 2: Run the script and verify table creation**

Run: `bash scripts/ops/init_intelligence_store.sh && sqlite3 data/SovereignIntelligence.db ".tables"`
Expected: `decision_audit  os_triplets     palace_rooms     palace_wings     system_state`

- [ ] **Step 3: Commit**

```bash
git add data/SovereignIntelligence.db scripts/ops/init_intelligence_store.sh
git commit -m "feat: initialize SovereignIntelligence.db for OS core"
```

### Task 3: Migrate Functional Data from Akashik.db

**Files:**
- Create: `scripts/ops/migrate_sociotomy.sh`

- [ ] **Step 1: Write the migration script**

```bash
#!/bin/bash
# scripts/ops/migrate_sociotomy.sh
SOURCE_DB="data/Akashik.db"
TARGET_DB="data/SovereignIntelligence.db"

# Migrate system_state
sqlite3 "$SOURCE_DB" "SELECT key, value, updated_at FROM system_state;" | while read -r line; do
    key=$(echo "$line" | cut -d'|' -f1)
    val=$(echo "$line" | cut -d'|' -f2)
    sqlite3 "$TARGET_DB" "INSERT OR REPLACE INTO system_state (key, value) VALUES ('$key', '$val');"
done

# Migrate duel_history to decision_audit
sqlite3 "$SOURCE_DB" "SELECT id, result, occurred_at FROM duel_history;" | while read -r line; do
    id=$(echo "$line" | cut -d'|' -f1)
    res=$(echo "$line" | cut -d'|' -f2)
    ts=$(echo "$line" | cut -d'|' -f3)
    sqlite3 "$TARGET_DB" "INSERT INTO decision_audit (id, logic_hash, verdict, timestamp) VALUES ($id, 'LEGACY_MIGRATION', '$res', '$ts');"
done

# Migrate palace_wings
sqlite3 "$SOURCE_DB" "SELECT id, name, wing_type, description, last_accessed FROM palace_wings;" | while read -r line; do
    id=$(echo "$line" | cut -d'|' -f1)
    name=$(echo "$line" | cut -d'|' -f2)
    type=$(echo "$line" | cut -d'|' -f3)
    desc=$(echo "$line" | cut -d'|' -f4)
    ts=$(echo "$line" | cut -d'|' -f5)
    sqlite3 "$TARGET_DB" "INSERT INTO palace_wings (id, name, wing_type, description, last_accessed) VALUES ('$id', '$name', '$type', '$desc', '$ts');"
done

echo "::/5Y573M-N071C3 : MIGRATION_COMPLETE. SOCIOTOMY_V1_0_EXECUTED."
```

- [ ] **Step 2: Run migration and verify counts**

Run: `bash scripts/ops/migrate_sociotomy.sh && sqlite3 data/SovereignIntelligence.db "SELECT count(*) FROM decision_audit;"`
Expected: Number matches `sqlite3 data/Akashik.db "SELECT count(*) FROM duel_history;"`

- [ ] **Step 3: Commit**

```bash
git add scripts/ops/migrate_sociotomy.sh
git commit -m "feat: migrate functional data from Akashik to SovereignIntelligence"
```

### Task 4: Deploy SOVEREIGN-IDENTITY.md

**Files:**
- Create: `SOVEREIGN-IDENTITY.md`

- [ ] **Step 1: Create the Identity file**

```markdown
# SOVEREIGN-IDENTITY.md

---
ACTIVE_PROFILE: [SOVEREIGN_OS]
CORE_CONSTRAINTS:
  VRAM_LIMIT: 16GB
  PRIMARY_NODE: Node B
  SECONDARY_NODE: Node C
  NETWORK_PROTOCOL: VSB_UDP
---

## Identity: Sovereign Intelligence OS
- **Archetype**: High-Level Reasoner // System Supervisor.
- **Voice**: Radical Candor, Terse, Analytical.
- **Goal**: Maintain architectural integrity and physical sovereignty.

## Identity: RED Director (Simulation Shard)
- **Archetype**: Cyberpunk RED Game Master.
- **Voice**: Gritty, Narrative-heavy, Cyberpunk RED terminology.
- **Goal**: Simulate the 2045 Time of the Red.

## Behavioral Rules
1. In [SOVEREIGN_OS] mode, detach Akashik.db and ignore all Cyberpunk RED lore.
2. Every change must be verified against IMPLEMENTATION_PLAN.md.
3. Zero-Trust verification is mandatory for all browser interactions.
```

- [ ] **Step 2: Verify file existence and formatting**

Run: `ls SOVEREIGN-IDENTITY.md && cat SOVEREIGN-IDENTITY.md`

- [ ] **Step 3: Commit**

```bash
git add SOVEREIGN-IDENTITY.md
git commit -m "feat: deploy SOVEREIGN-IDENTITY.md for profile management"
```

### Task 5: Clean Up Akashik.db (The Sociotomy Surgery)

**Files:**
- Modify: `data/Akashik.db`

- [ ] **Step 1: Drop migrated tables from Akashik.db**

Run: `sqlite3 data/Akashik.db "DROP TABLE IF EXISTS palace_closets; DROP TABLE IF EXISTS palace_halls; DROP TABLE IF EXISTS palace_rooms; DROP TABLE IF EXISTS palace_wings; DROP TABLE IF EXISTS palace_tunnels; DROP TABLE IF EXISTS duel_history; DROP TABLE IF EXISTS system_state;"`

- [ ] **Step 2: Verify cleanup**

Run: `sqlite3 data/Akashik.db ".tables"`
Expected: No `palace_*` or `system_state` tables remain.

- [ ] **Step 3: Commit**

```bash
git add data/Akashik.db
git commit -m "refactor: complete sociotomy surgery by purging Akashik.db of OS logic"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
