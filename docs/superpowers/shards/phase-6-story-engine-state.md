# Shard: Phase 6 — Story Engine State

## Metadata
- **ID:** 6
- **Name:** Story-Engine
- **Block:** NARRATIVE
- **Status:** Verified

## Overview
Ensures the persistent story state and narrative arc configuration are initialized in the `system_state` database. It also tracks the availability of NPC records.

## Audit Logic
1. Queries `system_state` for keys matching `story%`, `arc%`, or `beat%`.
2. Verifies that the `npcs` table is populated.
3. Warns if no story state or NPCs are detected.

## Manifest Logic
Onboards a new NPC into the story engine via the Foundry bridge, setting the `lastOnboardedNpc` setting to the new ID.

## Technical Details
- **Source:** `scripts/gauntlet/phases/nar-block.ts`
- **Context:** Narrative Arc Tracking
