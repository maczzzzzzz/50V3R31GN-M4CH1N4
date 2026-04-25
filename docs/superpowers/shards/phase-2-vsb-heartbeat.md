# Shard: Phase 2 — VSB Heartbeat

## Metadata
- **ID:** 2
- **Name:** VSB-Heartbeat
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies connectivity to the Virtual System Bus (VSB) on Node A. This is the primary binary communication highway for the Sovereign Trinity.

## Audit Logic
1. Probes the VSB UDP port (default 7878) on Node A.
2. Checks if the local VSB listener port is open.
3. Warns if neither the remote UDP port nor the local TCP port are reachable.

## Manifest Logic
Sends a minimal VSB heartbeat packet (opcode 0x00 PING) to verify two-way communication.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Transport:** UDP / TCP
- **Default Port:** 7878


---
**LINKS:** [[OS_CORE]]
