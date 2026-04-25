# Design Spec: The Sovereign Shroud (Phase 44.5)

**Status:** Draft
**Date:** 2026-04-12
**Author:** Gemini CLI (Strategist)
**Topic:** High-Fidelity Pretext Overlay Engine Upgrade

---

## 1. Executive Summary
The **Sovereign Shroud** is a high-performance visual layer for Foundry VTT that provides the "Aesthetic Voice" of the Sovereign Machina. It replaces individual standard text overlays with a single, WebGL-accelerated Master Shroud. This layer provides immersive "Over the Top" effects—including CRT scanlines, chromatic aberration, screen tearing, and static noise—while maintaining 60fps performance by offloading all visual processing to a custom GLSL fragment shader.

## 2. System Architecture

### 2.1 Technical Stack
- **Rendering:** PIXI.js v7 (Foundry v12 Native)
- **Font Engine:** PIXI.BitmapText (VT323 Texture Atlas)
- **Visual FX:** Custom GLSL Fragment Shader (PIXI.Filter)
- **Layering:** `canvas.interface` (InterfaceCanvasGroup)

### 2.2 Data Flow
1. **Trigger:** Node B (Orchestrator) dispatches a `pretext_overlay` or `pretext_glitch_impulse` WebSocket event.
2. **Mesh:** `FoundryApiMesh` routes the event to `PretextOverlayManager`.
3. **Engine:** 
   - New labels are added to the Shroud's `BitmapText` batch.
   - Glitch impulses update the shader's `uGlitchIntensity` uniform.
4. **GPU:** The Master Shader processes the entire Shroud container in a single pass, applying CRT scanlines and dynamic distortions.

## 3. Shader Specification (`sovereign-shroud.frag`)

The shader will implement the following effects controlled via uniforms:

- **Ambient CRT:** A permanent, subtle (2-5% alpha) sine-wave opacity mask creating horizontal scanlines.
- **Chromatic Aberration:** Dynamic horizontal channel splitting (R/G/B offsets) mapped to `uGlitchIntensity`.
- **Horizontal Screen Tear:** Random horizontal displacement strips using a time-based noise function.
- **Static Noise:** High-frequency grain overlay applied to text elements.

### Uniforms
| Name | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `uTime` | float | 0.0+ | Global clock for animation |
| `uGlitchIntensity` | float | 0.0 - 1.0 | Master multiplier for distortion |
| `uTearAmount` | float | 0.0 - 50.0 | Max pixel offset for horizontal tearing |
| `uScanlineAlpha` | float | 0.0 - 0.1 | Opacity of the CRT scanline grid |

## 4. Implementation Details

### 4.1 VT323 Bitmap Font
We will generate a pre-rendered texture atlas for the `VT323` font. This ensures that the "Machine Voice" is perfectly sharp and can be updated every frame (for glitching/parsing effects) without the performance hit of standard text-to-texture uploads.

### 4.2 Shroud Singleton
The `PretextOverlayManager` will maintain a persistent `PIXI.Container` (The Shroud) that automatically re-attaches to `canvas.interface` on scene changes. This container will have the Master Filter applied at all times.

## 5. Performance & Error Handling
- **O(1) Pass:** All effects occur in a single fragment shader pass, regardless of how many text labels are on screen.
- **Graceful Fallback:** If WebGL context is lost or shaders fail to compile, the system falls back to standard PIXI.Text rendering without filters.
- **Readable Bounds:** Maximum glitch intensity is capped to ensure the tactical map remains visible to the players.

## 6. Testing Strategy
- **Visual Audit:** Use Node B (Aesthetic Eye) vision to verify scanline transparency and chromatic aberration intensity.
- **Performance Benchmarking:** Verify 60fps rendering during high-intensity "Impulse" triggers using Chrome DevTools.
- **Integration Test:** `scripts/gauntlet/phases/vis-block.ts` will be updated to include "Shroud Integrity" checks.

---
*Design Approved by Lead Architect.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
