# Shard: Phase 22 — SSH Tunnel

## Metadata
- **ID:** 22
- **Name:** SSH-Tunnel
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies the persistent SSH tunnel between Node B (Director) and Node A (Kernel). This tunnel handles secure transport for the VSB and model API traffic.

## Audit Logic
1. Probes the SSH port (default 22) on Node A.
2. Checks for reachability using the configured user and host.
3. Warns if Node A is unreachable or the SSH service is down.

## Manifest Logic
Re-establishes the background SSH tunnel with automatic host key acceptance and a 5-second timeout.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-block.ts`
- **Default Port:** 22


---
**LINKS:** [[OS_CORE]]
