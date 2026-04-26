# Shard: Phase 54.1 — Topology Library

## Metadata
- **ID:** 541
- **Name:** Topology-Library-Index
- **Block:** ATLAS_FORGE
- **Status:** Verified

## Overview
Ensures that the core topology library is indexed and its 1-bit PNG skeletons are physically present on disk. It verifies that the `TileDNA` metadata (walls and exits) is internally consistent with the generated pixel maps.

## Audit Logic
1. Verifies that at least 3 standard tiles (Gaff, Artery, Hub) are defined in `scripts/forge/topology-lib/tiles.ts`.
2. Checks for the existence of 16x16px skeleton PNG files in `scripts/forge/topology-lib/skeletons/`.
3. Performs a pixel-consistency audit: verifies that grey "Exit Points" are open (false) and white "Walls" are closed (true) in the generated masks.
4. Confirms that lookup functions (`getTileById`, `getTilesWithExits`) return valid DNA objects.

## Manifest Logic
Triggers `npx tsx scripts/forge/topology-lib/generate-pngs.ts` to autonomously rebuild the 1-bit skeleton library from DNA definitions.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-54-1.ts`
- **Resolution:** 1px = 1 Cell (16x16 total)
- **Pattern:** Modular Topology


---
**LINKS:** [[OS_CORE]]
