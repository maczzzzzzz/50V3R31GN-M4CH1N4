# Shard: Phase 50 — Nucleus Artery

## Metadata
- **ID:** 50
- **Name:** Nucleus-Artery
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies the health of the Nucleus Artery (Go-based VSB bridge). This service streams the binary state of the Virtual System Bus to the WebGL Command Deck via Protobuf-over-WebSocket.

## Audit Logic
1. Checks for the `crush` binary and the `nucleus` subcommand.
2. Probes the Nucleus Artery port (default 9090).
3. Verifies that the Protobuf bridge is accepting connections.
4. Warns if the artery is closed or if the frontend scaffold is missing.

## Manifest Logic
Restarts the Nucleus Artery via `crush nucleus` to restore high-fidelity telemetry streaming.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-50.ts`
- **Port:** 9090
- **Protocol:** Protobuf / WebSocket
