# IMPLEMENTATION PLAN: Phase 67.8 - Voice Control Hardening

## 🎯 Objective
Achieve peak operational power and efficiency in the OMI voice integration before the final system lock.

## 📋 Step-by-Step Execution

### Task 1: Implement VAD (Voice Activity Detection) Gate
1.  Modify `artery_manager.rs` to include a ring buffer for incoming PCM audio bytes.
2.  Implement an RMS (Root Mean Square) energy calculation function to detect speech vs. silence.
3.  Wrap the Whisper `transcribe_audio` call in a VAD state machine: accumulate audio while energy is high, trigger inference when energy drops (silence detected), then flush the buffer.

### Task 2: Decouple Intent Routing
1.  Remove the hardcoded `transcript.to_lowercase().contains(...)` logic from `handle_socket` in `artery_manager.rs`.
2.  Construct a robust JSON payload formatter for `VOCAL_INTENT` VSB packets.
3.  Ensure the payload includes the raw transcript and a confidence score.

### Task 3: Visual Context Injection Mocking
1.  Establish a placeholder in the `SharedState` for the `latest_frame_hash`.
2.  Update the `VOCAL_INTENT` JSON payload to include this hash.
3.  (Integration with `sovereign-observer` memory space is staged for future mesh upgrades, but the transport layer must be ready now).

## 🛡️ Verification
- Build `zeroclaw-kernel` with `cargo check --features cuda`.
- Ensure no VRAM leaks occur during continuous silent audio streaming (VAD should block inference).