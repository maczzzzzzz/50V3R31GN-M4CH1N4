# Shard: Phase 51.2 — Headless Heartbeat

## Metadata
- **ID:** 512
- **Name:** Headless-Heartbeat
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies that the headless sidecars (`atlas`, `cyberdeck`) are active and updating their shared memory heartbeats. This replaces legacy window-handle checks for daemonized services.

## Audit Logic
1. Probes `data/heartbeat.mem` (Mmap slots 4000-4001).
2. Calculates the delta time since the last update.
3. Warns if the delta is >100ms; Fails if the memory file is absent or the heartbeat is flatlined (>1s).

## Manifest Logic
Attempts a 2-stage autonomous repair:
1. Sends `SIGUSR1` to the sidecars to force a heartbeat update.
2. If that fails, triggers a full restart of the sidecar binaries.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-51-2.ts`
- **Mechanism:** Mmap / Heartbeat
- **Target Latency:** <33ms (30Hz)
