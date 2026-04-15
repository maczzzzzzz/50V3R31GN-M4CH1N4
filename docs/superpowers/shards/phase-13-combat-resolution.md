# Shard: Phase 13 — Combat Resolution

## Metadata
- **ID:** 13
- **Name:** Combat-Resolution
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Verifies that the `sub rosa.resolveAttack` hook is registered within the Foundry VTT environment. This hook is essential for automated combat orchestration.

## Audit Logic
1. Evaluates the active Foundry page via CDP.
2. Checks the `Hooks` global for the presence of the `resolveAttack` or `sub rosa` registration.
3. Warns if the hook is missing; Skips if CDP is unavailable.

## Manifest Logic
Injects a synthetic `resolveAttack` call into Foundry to verify that the combat engine can receive and process automated triggers.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Hook:** `sub rosa.resolveAttack`
- **Context:** Foundry VTT (CDP)
