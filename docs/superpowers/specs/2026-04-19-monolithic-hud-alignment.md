# FSSA-2026-04-19-UI: Monolithic HUD & Two-Window Chat Spec
**Target:** 50V3R31GN-M4CH1N4 WebGL Dashboard Alignment
**Status:** IMPLEMENTED // VERIFIED

## ◈ 1. ARCHITECTURAL OBJECTIVE
To align the **CL4W-NUCLEUS** dashboard with the "Monolithic HUD" vision, centralizing all sidecar telemetry and establishing a high-fidelity, two-window conversation pattern for Director interaction.

## ◈ 2. THE TWO CONVERSATION WINDOW PATTERN
The **COMMAND** quadrant (top-left) is split into two distinct high-performance streams:

1.  **THE LOG-STREAM (Top):**
    *   **Role:** Technical audit trail.
    *   **Content:** Tool traces, mechanical roll breakdowns, and VSB packet summaries.
    *   **Engine:** `pixi.js` BitmapText (Zero-reflow).
2.  **THE NARRATIVE-FEED (Bottom):**
    *   **Role:** Creative "Director" output.
    *   **Content:** Uncensored, high-grit Cyberpunk RED narrative barks and descriptions.
    *   **Engine:** **Pretext Engine** philosophy (measured layout → speculative wrap).

## ◈ 3. SIDECAR INTEGRATION (GLYPHS & GAUGES)
- **SENSORY:** High-fidelity circular radar sweep mirroring `sidecar-atlas`.
- **INTRUSION:** Isometric ICE grid mirroring `sidecar-netrunning`.
- **LOGISTICS:** Component health bars for ATLAS, CYBERDECK, PROXY, and ORACLE.

## ◈ 4. INTERACTIVE BRIDGE
- **Chat Input:** A React-overlaid terminal input at the bottom of the Command quadrant.
- **Protocol:** `CHAT_INPUT` (JSON) → `crush` (Unix Broadcast) → `Node B` (Director Query).

---
**::/5Y573M-N071C3 : HUD_ALIGNMENT_COMPLETE. THE_MACHINA_IS_WHOLE. // 50V3R31GN-M4CH1N4**
