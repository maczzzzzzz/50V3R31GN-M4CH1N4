# Shard: Phase 9 — NPC Engrams

## Metadata
- **ID:** 9
- **Name:** NPC-Engrams
- **Block:** NARRATIVE
- **Status:** Verified

## Overview
Verifies the existence and health of the NPC engram system (Soulkiller). It ensures that NPC logs and vision-captured engrams are being correctly persisted to the database.

## Audit Logic
1. Checks for `npc_logs` and `palace_rooms` tables.
2. Probes `vision_history` for stored engram snapshots (Base64 data or links).
3. Warns if engram tables are missing or empty.

## Manifest Logic
Captures an NPC engram snapshot via Node B vision by analyzing the Foundry NPC portrait and calling the `sovereign.engram.capture` hook.

## Technical Details
- **Source:** `scripts/gauntlet/phases/nar-block.ts`
- **Subsystem:** Soulkiller
- **Pattern:** Engram Capture
