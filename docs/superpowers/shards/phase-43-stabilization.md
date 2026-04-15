# Shard: Phase 43 — Stabilization

## Metadata
- **ID:** 43
- **Name:** Stabilization
- **Block:** DATA
- **Status:** Verified

## Overview
Ensures system stability by verifying the integrity of the Relational Knowledge Graph (RKG) hierarchy and the availability of essential state databases.

## Audit Logic
1. Checks `system_state` table for core configuration keys.
2. Verifies the RKG directory structure (`Items`, `NPCs`, `Factions`, `Locations`, `Scenes`, `Chronicle`).
3. Confirms existence of `crush.db` for session history.
4. Warns if the RKG vault or specific directories are missing.

## Manifest Logic
Triggers `bash scripts/reconstruct-palace.sh` to semanticly reconstruct the RKG hierarchy.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-block.ts`
- **Path:** `D:\Obsidian_RKG` (Default)
