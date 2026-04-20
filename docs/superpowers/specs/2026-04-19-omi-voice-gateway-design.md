# SPEC: 2026-04-19 — OMI Voice Gateway & Artery Manager
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Materialize the Vocal Gateway on Node C using the OMI SDK and implement a dynamic Artery Manager for VRAM scaling.

## ◈ 1. THE ARTERY MANAGER (NODE C)
A specialized daemon running on the Node C host to manage the Llama-Server life-cycle.

### ◈ 1.1 POLYMORPHIC STATE_MACHINE
- **IDLE_AUTHORITY (Q5_K_M):** 5.4GB used. Max reasoning fidelity. Default state.
- **COMM_VOICE (Q4_K_M):** 4.9GB used + 300MB Voice. 1.0GB local headroom. Optimized for Vocal HUD interaction.
- **BERSERKER_SWARM (Q3_K_M):** 3.9GB used + 300MB Voice. 1.8GB local headroom. Optimized for 20+ NPC parallel swarms.

### ◈ 1.2 THE MANUAL SHIFT PROTOCOL
1. **Activation:** Machina Hub prompts for "Cognitive Profile" (Authority/Comm/Berserker).
2. **Shift:** User selection -> `WAKE_STATE_<TYPE>` VSB packet -> Node C restarts Artery with target quantization.
3. **Restoration:** Persistent "RESTORE AUTHORITY" button returns Node C to Q5 state.

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
