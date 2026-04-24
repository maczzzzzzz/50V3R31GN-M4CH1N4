# Phase 73: Task 1 - Vault Sociotomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the massive RKG vault into a Hot (indexed) and Cold (ignored) shard to achieve <2s Obsidian boot times.

**Architecture:** Physical file migration followed by Obsidian configuration lockdown and vector search re-mapping.

**Tech Stack:** Bash, JSON, Obsidian config.

---

### Task 1: Physical Migration of Lore Shards

- [ ] **Step 1: Create the Archive Structure**
Run: `mkdir -p data/vault/RKG_Archive/Lore`

- [ ] **Step 2: Move the Lore Shards**
Run: `mv data/vault/RKG/Global/Lore/* data/vault/RKG_Archive/Lore/`

- [ ] **Step 3: Verify Migration**
Run: `find data/vault/RKG/Global/Lore/ -type f | wc -l`
Expected: 0
Run: `find data/vault/RKG_Archive/Lore/ -type f | wc -l`
Expected: ~3000

- [ ] **Step 4: Commit Migration**
```bash
git add data/vault/RKG_Archive/Lore
git commit -m "feat(vault): move lore shards to cold archive"
```

---

### Task 2: Obsidian Configuration Lockdown

- [ ] **Step 1: Locate app.json**
File: `data/vault/RKG/.obsidian/app.json`

- [ ] **Step 2: Add Exclusion Rule**
If `RKG_Archive` is inside the vault root (for git tracking), ensure it is excluded. If outside, skip.
Assuming archive is moved to a sibling directory outside the vault root for maximum speed.

- [ ] **Step 3: Cleanup Empty Folders**
Run: `rmdir data/vault/RKG/Global/Lore`

- [ ] **Step 4: Commit Config**
```bash
git commit -am "chore(vault): remove lore directory from hot index"
```

---

### Task 3: Vector Index Re-Mapping

- [ ] **Step 1: Update Ingestion Paths**
Modify the ingestion scripts to point to `data/vault/RKG_Archive/` for future lore updates.

- [ ] **Step 2: Test query_memory_palace**
Run a test query to ensure the vector DB can still find the files in their new physical location.
```bash
# Example command to test vector search connectivity
```

- [ ] **Step 3: Commit**
```bash
git commit -m "fix(memory): re-map vector ingestion paths to archive"
```
