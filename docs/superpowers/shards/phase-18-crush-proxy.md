# Shard: Phase 18 — Crush Proxy

## Metadata
- **ID:** 18
- **Name:** Crush-Proxy
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Ensures the `win-proxy` (Crush Proxy) is active. This service acts as a WSL→Windows bridge for CDP traffic, allowing Node B to control the Foundry Electron instance on the host.

## Audit Logic
1. Probes the proxy port (9223) on `127.0.0.1`.
2. Checks for the existence of the Clawlink socket used for IPC.
3. Fails if both the port and socket are missing; Warns if only the port is closed.

## Manifest Logic
Restarts the `crush-cli proxy` to re-establish the WSL-to-Windows bridge.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Port:** 9223
