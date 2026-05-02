# 50V3R31GN-M4CH1N4: 0B51D14N_5YNC [7H3-HUM4N-R34D4BL3-V4UL7]
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS (The Human-Readable Synapse Milestone)
**Status:** DESIGN_APPROVED
**Sub-Project:** B (The Human-Readable Vault)

## ◈ OVERVIEW
The **0B51D14N_5YNC** engine provides a human-readable interface for the machine's memory. It synchronizes the **Recursive Knowledge Graph (RKG)** stored in `Akashik.db` with a collection of Markdown files in an Obsidian-compatible vault. This enables "Human-in-the-Loop" memory management and visualizes the world's lore through Obsidian's graph view.

## ◈ ARCHITECTURE
### 1. The Sync Engine (Node.js)
- **Service:** `ObsidianSyncService` located in `src/core/obsidian-sync-service.ts`.
- **Persistence Path:** `/home/nixos/50V3R31GN-M4CH1N4/data/vault/`.
- **Primary Loop:**
    - Monitors the `triplets` table in `Akashik.db` for changes.
    - Exports each unique `subject` as a `.md` file.
    - Uses `js-yaml` to maintain triplet metadata in the file header.

### 2. The Bidirectional Watcher
- **Tool:** `chokidar` library.
- **Logic:**
    - Listens for `change` events in the `data/vault/` directory.
    - On save, parses the YAML frontmatter.
    - Executes an `INSERT OR REPLACE` into `Akashik.db` using the `UnifiedStrategic OracleClient`.
- **Conflict Resolution:** The `Akashik.db` timestamp acts as the source of truth for the latest version.

### 3. Optionality & Sovereignty
- **Decoupling:** The machine does not require Obsidian to be running to function.
- **Fail-Safe:** Errors in the sync engine (e.g., file lock, directory missing) are logged as `S1GN4L_L055` but do not block the core agentic loop or inference.

## ◈ NOTE SCHEMA
### YAML Frontmatter
```yaml
---
subject: "[Subject Name]"
predicate: "[Predicate Action]"
object: "[[Object Link]]"
sovereign: true
source: AKASHIK_DB
last_synced: YYYY-MM-DDTHH:mm:ssZ
---
```

### Body Generation
- The body of the note includes a `# [Subject]` header.
- A section titled `### ◈ CONNECTED TRIADS` lists all related triplets as internal Obsidian links `[[ ]]` to facilitate graph generation.

## ◈ COMPONENTS
### 1. File Sanitizer
- Ensures `subject` names are compatible with the Linux/Ext4 filesystem (removes `/`, `\`, `?`, etc.).

### 2. Triplet Parser
- Extract `[[ ]]` wrapped values from YAML to ensure they remain indexed correctly in SQLite without the brackets.

### 3. Vault Initializer
- Idempotently creates the `data/vault/RKG` folder structure on boot.

## ◈ SUCCESS CRITERIA
- Every triplet in `Akashik.db` has a corresponding Markdown file.
- Manual edits to a Markdown note's YAML are reflected in the database within 500ms.
- Obsidian's Graph View displays a connected network of world lore.
- Deleting a file in the vault optionally marks the triplet as `purged` or `archived` in the DB.


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
