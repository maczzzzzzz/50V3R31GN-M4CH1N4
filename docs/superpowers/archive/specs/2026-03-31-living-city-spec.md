# Design Specification: The Living City & Project "Eyes-On" (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** March 31, 2026
**Subject:** Computer Vision, Pulse Engine, and Spatial Tactical Intelligence
**Status:** FINALIZED (Research Hardened)

## 1. Executive Summary
Phase 6 (The Living City) provides the final layer of immersion for the 50V3R31GN-M4CH1N4. It introduces **Project Eyes-On**, a dual-node Computer Vision pipeline that automates map walling and tactical region identification. It also implements the **Pulse Engine**, a deterministic background simulation that advances world state, faction turf, and NPC agendas via recursive SQLite triggers.

## 2. Project "Eyes-On" (CV Pipeline)

### 2.1 Node A: Geometric Pass (The Architect)
- **Stack:** Rust + `imageproc`.
- **Logic:**
    - **Edge Detection:** Grayscale → Gaussian Blur → Canny Edge Detection.
    - **Line Extraction:** Hough Line Transform to identify structural walls.
    - **Coordinate Mapping:** `SceneX = PixelX + (ImageWidth * Padding)`.
- **Output:** Native Foundry `walls` array JSON.

### 2.2 Node B: Tactical Pass (The Tactician)
- **Stack:** LLava 1.6 7B (via Ollama).
- **Format Enforcement:** Uses Ollama's **Structured Outputs** (GBNF) to force a valid JSON response.
- **Coordinate System:** Returns objects in `[ymin, xmin, ymax, xmax]` format normalized to a `0-1000` scale.
- **Categories:** `cover_high`, `cover_partial`, `hazard`, `security`.
- **Output:** Foundry v12 `RegionDocument` array with RKG metadata.

## 3. The Pulse Engine (World Heartbeat)
The Pulse Engine advances the `world.db` state deterministically via SQLite logic.

### 3.1 Faction Influence Maps
- **Algorithm:** Deterministic Chebyshev Distance decay.
- **Implementation:** `PRAGMA recursive_triggers = ON`.
- **Logic:** $I_{cell} = \max(SourceValue, \max(I_{neighbors}) - 1)$. 
- **Effect:** Faction "Strength" ripples across the district grid from source bases.

### 3.2 Dynamic World Barks
- **Synthesis:** Mistral-Nemo generates narrative "Screamsheets" based on the RKG state delta (e.g., turf losses, NPC movements).
- **Broadcast:** Pushed to Discord Chronicler and Foundry Chat.

## 4. Tactical Grounding Flow
Before every narrative beat, the HRC executes a **Spatial Join**:
1. **Query:** `SELECT * FROM regions WHERE distance(token_pos, region_pos) < 10`.
2. **Context:** Prepend tactical region types to the prompt.
3. **Intelligence:** AI leverages specific map features (e.g., "The industrial fan [Hazard]") in its combat tactics.

## 5. Verification Plan
- **CV Parity:** >90% accuracy against control maps.
- **Pulse Determinism:** Identical world state results on Node B and Node A (Rules Authority) for the same time delta.
- **Performance:** Full map scan + region generation in **<30s**.


---
**LINKS:** [[OS_CORE]]
