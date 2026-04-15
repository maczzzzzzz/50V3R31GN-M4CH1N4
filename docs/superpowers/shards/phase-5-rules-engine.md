# Shard: Phase 5 — Rules Engine

## Metadata
- **ID:** 5
- **Name:** Rules-Engine
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Verifies that the Rules Engine (Node A Tactical) is operational and accepting reasoning queries. The Rules Engine is the final authority on Cyberpunk RED mechanics.

## Audit Logic
1. Probes the Node A llama-server models API.
2. Performs a minimal tactical query (e.g., "Respond with SOVEREIGN").
3. Fails if the server is unreachable; Warns if the reasoning response is empty.

## Manifest Logic
Forces a tactical query to confirm Node A is acceptably accepting and processing commands.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Node:** Node A (GTX 1050 Ti)
- **Model:** Open-Reasoner-1.5B
