# Shard: Phase 26 — Radar Heat

## Metadata
- **ID:** 26
- **Name:** Radar-Heat
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Verifies the Virtual System Bus (VSB) `FRICTION_INTENT` opcode functionality. This system manages "Radar Heat" levels, which track faction friction and environmental tension.

## Audit Logic
1. Probes Node A using the `FRICTION_INTENT` (0x05) opcode with a query payload.
2. Checks for a binary acknowledgement from the VSB listener.
3. Warns if the probe receives no response.

## Manifest Logic
Directly sets the radar heat level via the VSB, verifying that tension state can be physically modulated.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Opcode:** 0x05 (FRICTION_INTENT)
- **Transport:** UDP
