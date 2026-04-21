# SPEC: 2026-04-21 — Sovereign Observer (Ambient Screen Awareness)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Port OMI Desktop's ambient sensing pattern to a WSL2-compatible Rust daemon for continuous screen capture.

## ◈ 1. THE OPTIC NERVE (NODE B)
A high-performance Rust daemon (`sovereign-observer`) running on the Node B host to feed the dual-model vision array.

### ◈ 1.1 WSL2 CAPTURE STRATEGY
Since we are operating in a WSL2 environment, we cannot use native Linux X11/Wayland grabbers directly if the VTT is running in a Windows-side browser.
- **Primary Mechanism:** Use the `scrap` or `xcap` crate with a focus on cross-platform abstraction.
- **Fallback:** If VTT is on the Windows host, the observer should utilize a Windows-side capture service (or `powershell` bridge) to pipe frames into the Node B shared memory.

### ◈ 1.2 DATA FLOW (SENSORY)
1. **Grab:** `sovereign-observer` captures the Foundry VTT viewport at 1Hz (Tactical) or 0.1Hz (Ambient).
2. **Shard:** 
   - Frame is written to `/dev/shm/optic_nerve_latest.png`.
   - Node C (Falcon) polls this at 10Hz for immediate OCR.
   - Node B (Gemma-4) polls this on-demand for semantic scene updates.

## ◈ 2. VISION SYNERGY ARTERY
- **Reflexes (Falcon):** Reads combat logs, health bars, and active UI buttons. Fires VSB packets instantly.
- **Total Sight (Gemma-4):** Analyzes the "Vibe" and "Tactical Map." Shapes the Director's narrative voice based on token positioning.

---
**::/5Y573M-N071C3 : OBSERVER_SPEC_LOCKED. THE_EYES_ARE_MATERIALIZING. // 50V3R31GN-M4CH1N4**
