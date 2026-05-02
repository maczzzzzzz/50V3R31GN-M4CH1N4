# Design Specification: Phase 67.8 - Voice Control Hardening (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

## 1. Overview
Phase 67.8 introduces critical efficiency and contextual upgrades to the Rust-native Artery Manager (`artery_manager.rs`) running on Node C. The goal is to minimize VRAM waste via Voice Activity Detection (VAD), scale command execution via decoupled intent routing, and integrate optical context for spatial voice commands.

## 2. Architecture Updates

### 2.1 Voice Activity Detection (VAD) Gate
- **Mechanism:** Implement a fast, low-overhead energy threshold calculation on the incoming 16kHz PCM audio chunks.
- **Logic:** Audio frames are accumulated in a ring buffer. If the RMS (Root Mean Square) energy of the buffer exceeds the `VAD_THRESHOLD`, the buffer is passed to the `candle` Whisper decoder. If it falls below the threshold for `SILENCE_FRAMES`, inference is triggered on the captured segment, and the buffer is cleared.
- **Benefit:** Zero GPU cycles wasted on ambient noise.

### 2.2 Intent Router (Node B Delegation)
- **Mechanism:** Remove hardcoded `.contains()` string matching from `artery_manager.rs`.
- **Logic:** Transcribed text is wrapped in a JSON payload and broadcasted over the VSB as a `VOCAL_INTENT` packet.
- **Payload Structure:**
  ```json
  {
    "type": "VOCAL_INTENT",
    "transcript": "Scan that access point.",
    "confidence": 0.98,
    "timestamp": 1713715200
  }
  ```
- **Benefit:** Node B (Director) uses its LLM to semantically map the transcript to the appropriate MCP tool, allowing for infinite scalability.

### 2.3 Visual Context Injection
- **Mechanism:** Mesh the `sovereign-observer` (screen capture) with the `artery_manager`.
- **Logic:** When `artery_manager` emits a `VOCAL_INTENT` packet, it requests the latest frame hash from the shared state (populated by the observer). The hash is appended to the packet.
- **Payload Addition:** `"visual_context": "hash_xyz123"`
- **Benefit:** The LLM on Node B can cross-reference the visual hash with the Vision Artery to understand spatial pronouns ("this", "that").

## 3. Implementation Constraints
- Must remain purely within Rust (`zeroclaw-kernel`) for Node C components.
- Must not increase TTFT (Time To First Token) latency.
- Must maintain the 6GB VRAM ceiling.

---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
