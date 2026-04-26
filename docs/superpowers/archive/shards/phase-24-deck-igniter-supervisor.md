# Shard: Phase 24 — Deck-Igniter Supervisor

## Metadata
- **ID:** 24
- **Name:** DeckIgniter-Supervisor
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies that the `deck-igniter` supervisor is active. This binary manages the lifecycle of all secondary sidecars and system-wide orchestration components.

## Audit Logic
1. Checks for the `deck-igniter-cli` binary.
2. Uses `pgrep` to confirm the supervisor process is running.
3. Fails if the binary is missing; Warns if the process is not detected.

## Manifest Logic
Starts the supervisor via `./deck-igniter-cli start`.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Dependency:** Go binary


---
**LINKS:** [[OS_CORE]]
