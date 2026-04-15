# Shard: Phase 20 — Prompt Anchors

## Metadata
- **ID:** 20
- **Name:** Prompt-Anchors
- **Block:** NARRATIVE
- **Status:** Verified

## Overview
Ensures that the prompt anchors (AAAK Dialect) are initialized. This system uses compressed context files and lore triplets to ground the narrative engine in reality.

## Audit Logic
1. Checks for the existence of `palace_context.json`.
2. Verifies that the `triplets_fts` table is present for fast lore retrieval.
3. Warns if both the context file and triplets are missing.

## Manifest Logic
Forces a context rebuild by triggering `reconstruct-palace.sh --context-only`.

## Technical Details
- **Source:** `scripts/gauntlet/phases/nar-block.ts`
- **Dialect:** AAAK (170-token Identity)
- **Dependency:** `scripts/reconstruct-palace.sh`
