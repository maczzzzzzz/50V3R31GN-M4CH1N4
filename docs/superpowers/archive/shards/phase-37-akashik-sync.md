# Shard: Phase 37 — Akashik Sync

## Metadata
- **ID:** 37
- **Name:** Akashik-Sync
- **Block:** DATA
- **Status:** Verified

## Overview
Verifies the accessibility and integrity of the `Akashik.db` file, which serves as the "Long-Term Synapse" and external knowledge source for the 50V3R31GN-M4CH1N4.

## Audit Logic
1. Probes `data/Akashik.db` (configurable via `AKASHIK_DB_PATH`).
2. Verifies table access and NPC count.
3. Fails if the file is missing; Warns if inaccessible or corrupt.

## Manifest Logic
Forces a sync by copying the active `world.db` state to `Akashik.db`.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-block.ts`
- **Dependency:** Better-SQLite3


---
**LINKS:** [[OS_CORE]]
