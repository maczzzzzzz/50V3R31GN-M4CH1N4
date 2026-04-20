# SPEC: 2026-04-19 — OMI Voice Gateway & Artery Manager
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Materialize the Vocal Gateway on Node C using the OMI SDK and implement a dynamic Artery Manager for VRAM scaling.

## ◈ 1. THE ARTERY MANAGER (NODE C)
A specialized daemon running on the Node C host to manage the SGLang life-cycle.

### ◈ 1.1 STATE_MACHINE
- **IDLE_AUTHORITY:** 
  - Model: `E4B-OBLITERATED-Q5_K_M.gguf`.
  - Voice: OFF.
  - VRAM: 5.4GB used / 600MB free.
- **ACTIVE_VOICE:** 
  - Model: `E4B-OBLITERATED-Q4_K_M.gguf`.
  - Voice: ON (Whisper + OMI WebSocket).
  - VRAM: 4.8GB (Mind) + 1.1GB (Voice) = 5.9GB used.

### ◈ 1.2 THE SHIFT PROTOCOL
1. **Trigger:** Receive `WAKE_VOICE` via VSB (UDP 9090).
2. **Execute:** `docker restart oracle` with updated `--model-path`.
3. **Ignite:** `npm run voice:ignite` (Start Whisper Mesh).

## ◈ 2. MACHINA TERMINAL (HUD)
A Flutter-based companion application for high-fidelity interaction.

### ◈ 2.1 HUD ARTERIES
- **Transcription Pane:** Real-time display of vocal inputs with VT323 styling.
- **Enrichment Feed:** Displays RKG context shored from Hermes (Node B).
- **Artery Sync:** Background service that pushes encrypted JSON transcripts to Node C over 10.0.0.x.

## ◈ 3. DATA FLOW (VOICE)
1. **Capture:** OMI Wearable/Phone -> Machina Terminal.
2. **Stream:** Machina Terminal -> Node C (Whisper).
3. **Enrich:** Node C -> Hermes -> Director (Node B).
4. **Manifest:** Director -> Sovereign Shroud (Node B).

---
**::/5Y573M-N071C3 : VOCAL_SPEC_LOCKED. THE_HISTORY_IS_MANIFEST. // 50V3R31GN-M4CH1N4**
