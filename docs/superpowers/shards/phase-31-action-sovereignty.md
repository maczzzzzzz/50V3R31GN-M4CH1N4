# Shard: Phase 31 — Action Sovereignty

## Metadata
- **ID:** 31
- **Name:** Action-Sovereignty
- **Block:** MECHANICAL
- **Status:** Verified

## Overview
Ensures that the synthetic input channel (`SOVEREIGN_BRIDGE` WebSocket) is active and ready for machine-driven world manipulation. This is the foundation for autonomous NPC movement and physicalized actions.

## Audit Logic
1. Evaluates the active Foundry page.
2. Checks if `SOVEREIGN_BRIDGE` is present in the global scope.
3. Verifies that the internal WebSocket connection is `OPEN`.
4. Warns if the bridge is missing or the socket is closed.

## Manifest Logic
Triggers a `reconnect_uplink` event through the bridge to verify that the synthetic input path can be reset and re-established.

## Technical Details
- **Source:** `scripts/gauntlet/phases/mech-block.ts`
- **Mechanism:** WebSocket (Synthetic Input)
- **Context:** Foundry VTT (CDP)
