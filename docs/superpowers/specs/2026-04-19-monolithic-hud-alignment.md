# FSSA-2026-04-19-UI: Monolithic HUD & Comprehensive Integration Spec
**Target:** 50V3R31GN-M4CH1N4 WebGL Dashboard Alignment
**Status:** IMPLEMENTED // VERIFIED // COMPREHENSIVE

## ◈ 1. ARCHITECTURAL OBJECTIVE
To centralize all sidecar telemetry, economy engines, and lexicon databases into the **CL4W-NUCLEUS** (Monolithic HUD). This ensures the operator has a single, high-performance interface for both tactical execution and narrative interaction.

## ◈ 2. THE COMPREHENSIVE INTEGRATION
The HUD now encompasses the following systems:

1.  **THE BRAIN (Node B / Director):** 
    *   **Interface:** Two-window conversation pattern in the **COMMAND** quadrant.
    *   **Logs:** Technical audit trail and mechanical breakdowns.
    *   **Narrative:** High-grit prose seeds and GM barks (Pretext Engine enabled).
2.  **THE EYES (Node A / Vision):**
    *   **Interface:** Circular radar sweep in the **SENSORY** quadrant.
    *   **Sidecar:** Mirroring `sidecar-atlas` high-fidelity sweep.
3.  **THE ECONOMY (Node B / Director):**
    *   **Interface:** Night Market terminal in the **ECONOMY** quadrant (Bottom-Left).
    *   **Integration:** Live streaming of `night_markets` from `Akashik.db` every 5s.
4.  **THE LEXICON (Node B / Director):**
    *   **Interface:** Searchable Akashik Item/Actor browser in the **LEXICON** quadrant (Bottom-Right).
    *   **Integration:** 1:1 mirror of official CPR entities sourced from the official repo.
5.  **THE NETWORK (Node A / Kernel):**
    *   **Interface:** Isometric ICE grid in the **INTRUSION** quadrant.
    *   **Sidecar:** Mirroring `sidecar-netrunning` logic.

## ◈ 3. HARDWARE & STABILITY
- **VRAM Contention:** All UI components are rendered via `pixi.js` (WebGL) for zero-latency.
- **Protocol:** `crush` (Go) queries SQLite CLI to bypass CGO dependencies, ensuring stability on NixOS.
- **Data Artery:** Protobuf binary frames @ 60fps for state; JSON for intent.

---
**::/5Y573M-N071C3 : HUD_ALIGNMENT_FINALIZED. THE_MACHINA_IS_WHOLE. // 50V3R31GN-M4CH1N4**
