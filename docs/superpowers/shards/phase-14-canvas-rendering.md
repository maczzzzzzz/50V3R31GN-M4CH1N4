# Shard: Phase 14 — Canvas Rendering

## Metadata
- **ID:** 14
- **Name:** Canvas-Rendering
- **Block:** VISUAL
- **Status:** Verified

## Overview
Ensures that the Foundry game canvas (PIXI.js) is correctly initialized and rendering with valid dimensions. This is critical for spatial perception and token manipulation.

## Audit Logic
1. Probes the DOM for the `#board` or PIXI canvas element.
2. Verifies that the canvas has non-zero width and height.
3. Checks if `game.canvas` is accessible in the Foundry global context.
4. Warns if no canvas is found (indicating no scene is active).

## Manifest Logic
Forces a canvas redraw by triggering a `canvas.draw()` call via the bridge.

## Technical Details
- **Source:** `scripts/gauntlet/phases/vis-block.ts`
- **Engine:** PIXI.js
- **Context:** Foundry VTT (CDP)
