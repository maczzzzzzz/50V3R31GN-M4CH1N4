# Shard: Phase 15 — Director Service

## Metadata
- **ID:** 15
- **Name:** Director-Service
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies that the Director (Node B) orchestrator is running and listening for commands. The Director is responsible for narrative orchestration and high-level agent logic.

## Audit Logic
1. Probes the Director's MCP/API port (default 3010).
2. If the port is unresponsive, checks the process list for `src/main.ts`.
3. Fails if the service is not listening; Warns if the process exists but the port is closed.

## Manifest Logic
Restarts the Director service via `npm run start`.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Default Port:** 3010


---
**LINKS:** [[OS_CORE]]
