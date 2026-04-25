# Shard: Phase 44.5 — Sovereign Shroud

## Metadata
- **ID:** 44.5
- **Name:** Sovereign-Shroud
- **Block:** VISUAL
- **Status:** Verified

## Overview
Verifies the integrity of the Master Shroud (WebGL overlay). This includes checking the PIXI container, VT323 BitmapText availability, and the health of the GLSL shader uniforms.

## Audit Logic
1. Evaluates the Foundry page via CDP.
2. Locates the `SovereignShroud` container in the PIXI stage hierarchy.
3. Probes the shader filters for critical uniforms: `uScanlineAlpha` and `uGlitchIntensity`.
4. Verifies that `PIXI.BitmapText` is registered for high-performance font rendering.
5. Warns if the container or specific uniforms are missing.

## Manifest Logic
Dispatches a test `pretext_overlay` and `pretext_glitch_impulse` through the bridge to verify end-to-end visual manifestation.

## Technical Details
- **Source:** `scripts/gauntlet/phases/vis-block.ts`
- **Shader:** `sovereign-shroud.frag`
- **Font:** VT323 (Bitmap Atlas)


---
**LINKS:** [[OS_CORE]]
