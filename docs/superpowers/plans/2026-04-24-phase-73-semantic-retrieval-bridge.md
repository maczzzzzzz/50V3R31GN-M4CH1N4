# Phase 73: Task 4 - Semantic Retrieval Mesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the `query_cold_lore` tool to allow on-demand access to the archived lore shards.

**Architecture:** A TypeScript-based MCP tool that queries the `SovereignIntelligence.db` (vector table) and writes snippets to a transient vault file.

**Tech Stack:** TypeScript, SQLite-vec, Obsidian.

---

### Task 1: Tool Materialization

- [ ] **Step 1: Create the tool script**
File: `scripts/dev/query-cold-lore.ts`
Implement logic to:
- Take a semantic query string.
- Run `SELECT` against `os_triplets` or a dedicated lore vector table.
- Read the physical files from `/mnt/d/Obsidian_Archive/Lore/` or `/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG_Archive/Lore/`.

- [ ] **Step 2: Implement "Transient" Injection**
Write the results to `data/vault/RKG/Transient/lore-brief.md`.

- [ ] **Step 3: Register MCP Tool**
Add `query_cold_lore` to the `mcp-daemon.ts` registry.

---

### Task 2: Verification

- [ ] **Step 1: Run Test Query**
Run: `npx tsx scripts/dev/query-cold-lore.ts "stats for a cyberdeck"`
Verify that `Transient/lore-brief.md` is created with relevant content.

- [ ] **Step 2: Commit**
```bash
git add scripts/dev/query-cold-lore.ts
git commit -m "feat(vault): materialize semantic retrieval bridge for cold lore"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
