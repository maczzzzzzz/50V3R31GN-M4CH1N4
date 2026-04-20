# SPEC: 2026-04-19 — OMI Voice Gateway & Artery Manager
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Materialize the Vocal Gateway on Node C using the OMI SDK and implement a dynamic Artery Manager for VRAM scaling.

## ◈ 1. THE ARTERY MANAGER (NODE C)
A specialized daemon running on the Node C host to manage the Llama-Server life-cycle.

### ◈ 1.1 MANUAL STATE_MACHINE
- **IDLE_AUTHORITY (Default):** 
  - Model: `E4B-OBLITERATED-Q5_K_M.gguf`.
  - Voice: OFF.
- **ACTIVE_VOICE (Manual):** 
  - Model: `E4B-OBLITERATED-Q4_K_M.gguf`.
  - Voice: ON (Whisper + OMI WebSocket).

### ◈ 1.2 THE MANUAL SHIFT PROTOCOL
1. **Activation:** Upon app launch, if `AUTHORITY_MODE` is active, user is prompted to "Ignite Vocal Artery."
2. **Shift:** User confirms -> Machina Hub sends `WAKE_VOICE` via VSB -> Node C restarts Llama-Server with Q4 weights + OMI backend.
3. **Restoration:** A persistent "KILL VOICE / RESTORE Q5" button on the Hub allows the user to manually return Node C to the high-fidelity logical state at any time.

## ◈ 2. MACHINA HUB (SIDECAR)
A Flutter-based communication interface focused on Vocal materialization.

### ◈ 2.1 CORE FEATURES
- **Live Stream:** Real-time VT323 transcription feed.
- **Historical Archive:** Navigation buttons to browse and search archived session transcripts.
- **Resting State:** Lightweight telemetry header (Node A/B/C) with manual shift controls.


## ◈ 3. DATA FLOW (VOICE)
1. **Capture:** OMI Wearable/Phone -> Machina Terminal.
2. **Stream:** Machina Terminal -> Node C (Whisper).
3. **Enrich:** Node C -> Hermes -> Director (Node B).
4. **Manifest:** Director -> Sovereign Shroud (Node B).

---
**::/5Y573M-N071C3 : VOCAL_SPEC_LOCKED. THE_HISTORY_IS_MANIFEST. // 50V3R31GN-M4CH1N4**
