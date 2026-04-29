# Design: Pretext Aesthetic Buffer & Mission-Load Sequence (v3.8.8)
**Date:** 2026-04-04
**Target:** Phase 23 (Neural World Engine)

## 1. Overview
The Pretext Aesthetic Buffer transforms the **Foundry VTT** canvas into a high-performance "Net-AR" display. It leverages the **Pretext Engine** (60fps reflow-free rendering) to provide visual grounding for the **Sovereign Highway** (VSB). This design mandates that all mission generation, hardware latency, and systemic state-changes are masked by immersive "Glitch-Sync" and "Lore-Tickers."

## 2. Architecture: The VSB-to-Pretext Pipeline
Pretext acts as the visual "Aesthetic Buffer" between the **Sidecars (Input)** and **Foundry (Visual)**.

### 2.1 The Mission-Load Sequence (Baked-In)
Every "Click-to-Generate" action in the **Atlas Radar** triggers a three-stage Pretext sequence:
1. **The Static Phase:** Immediate activation of a `PRETEXT_GLITCH_MODE` (Dithered noise/static) across the Foundry screen to mask 12B Brain initialization.
2. **The Lore Streaming:** Real-time "Partial Completion" tokens from the 12B Brain (Mistral-Nemo) are streamed directly to a **Pretext Matrix Ticker** (e.g., "SYNCING HEYWOOD L1-REGISTRY...", "ROOTS BIAS: [RESISTANCE]").
3. **The Final Render:** The completed mission brief is rendered as a high-resolution, full-screen **Screamsheet Overlay** directly on the PIXI canvas.

### 2.2 Aesthetic HUD Modes
- **Net-AR Tactical HUD:** Anchored spatial labels for **ST3GG Ghost Objects** (Ports, Caches). Flickering, red-dithered text that pulses based on Cyberdeck proximity.
- **Matrix Diagnostic Stream:** A scrolling sidebar of "Code-Rain" and "Diagnostic Logs" that activates during **Cyberdeck "Deep Dive"** mode.
- **Glitch-Sync Feedback:** Procedural text distortion (glitches) affecting in-game labels (Token names, District titles) during high **VSB heat_level** or Black ICE attacks.

## 3. Data Flow & VSB Interaction
- **Director (Node B):** Monitors the `NetBus`, `DeckBus`, and `ProposedActions` in the VSB.
- **Pretext Command:** Node B serializes `PRETEXT_OVERLAY` commands and pushes them to the `foundry-api-bridge.js` for 60fps execution.
- **Hardware Masking:** If Node A reports a `BUSY` signal (VRAM swapping), Node B automatically triggers a "System Resync" Pretext glitch to maintain immersion.

## 4. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
