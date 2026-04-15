# Shard: Phase 8 — VSB Packet Integrity

## Metadata
- **ID:** 8
- **Name:** VSB-Packet-Integrity
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Ensures the `crush-cli` client and its associated VSB packet module are healthy and capable of connecting to the database.

## Audit Logic
1. Executes `crush-cli` and checks for a successful exit code (0).
2. Parses the version string to confirm the binary is correctly built and linked.
3. Warns if the binary fails to start or connect.

## Manifest Logic
Triggers a VSB self-ping to verify that the packet path from the CLI to the Kernel is clear.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Binary:** `crush-cli` (Go)
