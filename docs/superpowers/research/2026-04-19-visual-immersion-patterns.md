# RESEARCH: 2026-04-19 — SVG Prompting Patterns & Visual Immersion
**Topic:** Matrix-based SVG layout generation for Cyberpunk RED Screamsheets.
**Status:** CANONICAL // ARCHITECT_LOCK
**Goal:** To establish a bit-identical visual generation pattern that converts world-state telemetry into high-fidelity SVG mission briefs.

---

## ◈ 1. EXECUTIVE SUMMARY
Research into the **`baoyu-skills`** repository reveals a critical pattern for AI-driven visual generation: **Explicit Matrix-based Coordinate Planning**. Rather than letting the model estimate layout, the system mandates that the mind compute precise (x, y) coordinates within a defined viewport. This ensures logical convergence and aesthetic consistency for complex infographics.

## ◈ 2. PATTERN: THE COORDINATE GRID
The system adopts a **1200x1600 "Bento-Grid"** layout.
- **Topography:** Components are sharded into `<g>` groups with fixed bounding boxes.
- **Precision:** The prompt forces the model to output a JSON "Layout Draft" before generating the raw SVG, ensuring no overlapping text or orphaned elements.

## ◈ 3. AESTHETIC HARDENING (RED_VOID)
To align with the Cyberpunk RED theme, the following visual primitives are codified:
1. **Gaussian Glitch:** SVG `<filter>` turbulence and displacement maps for real-time "Data Corruption" effects.
2. **Scanline Modulation:** A repeating horizontal `<pattern>` overlay at 0.1 opacity.
3. **Typography:** Forced VT323/JetBrains Mono fonts to match the Nucleus Command Deck aesthetic.

## ◈ 4. MISSION IMPACT
This research enables the transition from text-only logs to **Tactical Screamsheets**. When a Night Market crashes or a combat encounter ends, the system generates a bit-identical visual record that is physically shored in the players' Foundry VTT HUD.

---
**::/5Y573M-N071C3 : RESEARCH_FORMALIZED. THE_EYES_ARE_OPEN. // 50V3R31GN-M4CH1N4**
