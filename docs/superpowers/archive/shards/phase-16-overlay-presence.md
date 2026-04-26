# Shard: Phase 16 — Overlay Presence

## Metadata
- **ID:** 16
- **Name:** Overlay-Presence
- **Block:** VISUAL
- **Status:** Verified

## Overview
Verifies that the Sovereign overlay infrastructure (Pretext, HUD, Error Overlays) is present and functional. It ensures that the bridge can dispatch high-fidelity visual notifications.

## Audit Logic
1. Scans the DOM for specific Sovereign elements (e.g., `#pretext-overlay`, `.sovereign-hud`).
2. Checks if the `SOVEREIGN_BRIDGE.showErrorOverlay` method is registered.
3. Verifies that the Foundry notifications container is available.
4. Warns if the overlay method is missing from the bridge.

## Manifest Logic
Triggers a high-intensity "Neural Shroud" pulse via the `crush-cli intent` command to verify visual feedback loops.

## Technical Details
- **Source:** `scripts/gauntlet/phases/vis-block.ts`
- **Subsystem:** Pretext Overlay Manager
- **Context:** Foundry VTT (CDP)


---
**LINKS:** [[OS_CORE]]
