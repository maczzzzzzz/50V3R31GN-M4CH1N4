# Shard: Phase 46 — Pulse Propagation

## Metadata
- **ID:** 46
- **Name:** Pulse-Propagation
- **Block:** DATA
- **Status:** Verified

## Overview
Ensures that the sovereignty depth (machine authority levels) is correctly tracked and propagated based on the outcome of Governance Duels. It verifies the existence of the `duel_history` table and the `sovereignty_depth` state key.

## Audit Logic
1. Checks for the `duel_history` table.
2. Verifies the `sovereignty_depth` key in the `system_state` table.
3. Fails if the table or key is missing.

## Manifest Logic
Seeds a test duel record and executes a simulated pulse propagation to verify that the sovereignty math correctly updates the system state.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-46.ts`
- **Metric:** `sovereignty_depth` (0.0 to 1.0)
- **Dependency:** `duel_history` table


---
**LINKS:** [[OS_CORE]]
