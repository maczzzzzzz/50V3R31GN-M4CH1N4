# Shard: Phase 4 — Clawlink Socket

## Metadata
- **ID:** 4
- **Name:** Clawlink-Socket
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Ensures the availability of the Clawlink Unix domain socket, which handles local IPC between sidecars and the primary orchestrator.

## Audit Logic
1. Checks for the existence of `/tmp/clawlink.sock`.
2. Attempts to connect to the socket to verify it isn't stale.
3. Fails if the socket is missing; Warns if the connection is refused.

## Manifest Logic
Restarts the `deck-igniter` supervisor to re-establish the socket and associated services.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Path:** `/tmp/clawlink.sock`


---
**LINKS:** [[OS_CORE]]
