# 0B51D14N_5YNC [7H3-HUM4N-R34D4BL3-V4UL7] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a bidirectional synchronization engine between the SQLite `triplets` table and a Markdown-based Obsidian vault at `data/vault/`.

**Architecture:**
1.  **Export Logic:** A periodic or hook-based poller that reads the RKG triplets and writes/updates `.md` files with YAML frontmatter.
2.  **Import Logic:** A `chokidar` file watcher that detects manual edits in Obsidian, parses the YAML, and upserts the data back into `Akashik.db`.
3.  **Governance:** Conflict resolution based on the `last_synced` timestamp vs. DB `timestamp`.

**Tech Stack:** Node.js, `chokidar`, `js-yaml`, `better-sqlite3`.

---

### Task 1: Infrastructure & Dependencies

**Files:**
- Modify: `package.json`
- Create: `data/vault/RKG/` (Directory)

- [ ] **Step 1: Install Sync Dependencies**
Add `chokidar` and `js-yaml` to the project.

```bash
npm install chokidar js-yaml
```

- [ ] **Step 2: Initialize Vault Directory**
Ensure the vault structure exists idempotently.

```bash
mkdir -p data/vault/RKG
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore(vault): Add chokidar and js-yaml for Obsidian sync"
```

---

### Task 2: ObsidianSyncService - Export Engine (DB → MD)

**Files:**
- Create: `src/core/obsidian-sync-service.ts`
- Modify: `src/db/unified-oracle-client.ts` (If hooks are needed)

- [ ] **Step 1: Implement Export Logic**
Create `src/core/obsidian-sync-service.ts`. Implement `exportTriplets()` which queries the `triplets` table and writes Markdown files.

```typescript
// Key logic: 
// Filename = sanitize(subject) + ".md"
// Metadata = js-yaml.dump({ subject, predicate, object, ... })
```

- [ ] **Step 2: Test Export**
Write a temporary test script or use `tsx` to run the export and verify `.md` files appear in `data/vault/RKG/`.

- [ ] **Step 3: Commit**
```bash
git add src/core/obsidian-sync-service.ts
git commit -m "feat(vault): Implement RKG to Markdown export logic"
```

---

### Task 3: ObsidianSyncService - Import Engine (MD → DB)

**Files:**
- Modify: `src/core/obsidian-sync-service.ts`

- [ ] **Step 1: Implement Chokidar Watcher**
Add a watcher to `ObsidianSyncService` that triggers on `change` events in `data/vault/RKG/`.

- [ ] **Step 2: Implement Markdown Parser**
Use `js-yaml` to extract the `subject`, `predicate`, and `object` from the changed file. Strip `[[ ]]` links from the object field for DB storage.

- [ ] **Step 3: Test Bidirectional Sync**
1. Run the service.
2. Manually edit a file in `data/vault/RKG/`.
3. Verify the change appears in `Akashik.db` via `sqlite3` query.

- [ ] **Step 4: Commit**
```bash
git add src/core/obsidian-sync-service.ts
git commit -m "feat(vault): Implement Markdown to RKG import via chokidar"
```

---

### Task 4: Supervision & Ignition (Go)

**Files:**
- Modify: `deck-igniter/main.go`
- Modify: `deck-igniter/launcher.go`

- [ ] **Step 1: Add Vault-Sync to Igniter**
Add `vault-sync` as a supervised component in the `LayerWSL` category.

- [ ] **Step 2: Implement Launch Command**
Add logic to run `npx tsx src/core/obsidian-sync-service.ts` in `launcher.go`.

- [ ] **Step 3: Final Verification**
Launch the entire system via `deck-igniter`. Verify that the vault is populated and changes in either the DB or the vault are synchronized.

- [ ] **Step 4: Commit**
```bash
git add deck-igniter/
git commit -m "feat(igniter): Orchestrate Obsidian Vault Sync lifecycle"
```
