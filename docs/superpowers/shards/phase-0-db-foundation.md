# Shard: Phase 0 — DB Foundation

## Metadata
- **ID:** 0
- **Name:** DB-Init
- **Block:** DATA
- **Status:** Verified

## Overview
Verifies that the core SQLite database tables are present and correctly initialized. This shard is the baseline for all persistent state in the 50V3R31GN-M4CH1N4 ecosystem.

## Audit Logic
1. Probes `world.db` (or `Akashik.db`).
2. Checks for existence of `system_state`, `npcs`, `factions`, `locations`, `triplets`, `palace_rooms`, and `chronicle_seeds`.
3. Fails if any core tables are missing.

## Manifest Logic
Triggers `npx tsx scripts/db-migrate.ts` to initialize missing tables and apply pending migrations.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-block.ts`
- **Fallback:** `scripts/gauntlet/phases/data-0.ts` (PhaseShard interface)
