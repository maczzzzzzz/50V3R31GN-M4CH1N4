# Shard: Phase 40 — Economy Engine

## Metadata
- **ID:** 40
- **Name:** Economy-Engine
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Verifies the health of the Red Trade and Night Market subsystems. This includes checking for the existence of inventory and player housing databases.

## Audit Logic
1. Probes the primary state database.
2. Checks for `inventory` and `player_housing` tables.
3. Verifies that the counts for inventory items and housing records are accessible.
4. Warns if economy tables are missing.

## Manifest Logic
Triggers a VSB `FRICTION_INTENT` roll targeting a specific faction to verify that economic tension can be modulated.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Subsystem:** Red Trade
- **Dependency:** SQLite


---
**LINKS:** [[OS_CORE]]
