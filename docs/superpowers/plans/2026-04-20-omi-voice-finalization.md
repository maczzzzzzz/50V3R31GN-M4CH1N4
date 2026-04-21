# Rust Artery Daemon & Vocal Finalization (Phase 67.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Node C Artery Manager to Rust for sub-10ms mind-swapping and finalize the diegetic vocal interface.

**Architecture:** Rust Daemon (Node C) -> Docker Control -> OMI FastAPI -> Flutter HUD.

**Tech Stack:** Rust, Docker API, Flutter, FastAPI, VSB (UDP).

---

### Task 1: Rust Artery Manager (The Guardian)

**Files:**
- Create: `zeroclaw/src/bin/artery-manager.rs`
- Modify: `zeroclaw/Cargo.toml`

- [ ] **Step 1: Implement Docker Control in Rust**
  - Use `bollard` crate to interface with the Node C Docker engine.
  - Implement `swap_mind(quantization: string)` logic.

- [ ] **Step 2: VSB Listener**
  - Implement UDP listener for `WAKE_STATE_<TYPE>` packets.
  - Sub-10ms reaction time target.

- [ ] **Step 3: Commit**
  ```bash
  git add zeroclaw/
  git commit -m "feat(vocal): materialize rust artery manager daemon"
  ```

---

### Task 2: OMI Real-Time Mesh (The Ear)

**Files:**
- Create: `src/api/voice/OmiMesh.ts` (or Python equivalent on Node C)

- [ ] **Step 1: Finalize Real-time Audio bytes endpoint**
  - Implement webhook to receive 5-10s chunks from OMI wearable.
  - Link to Faster-Whisper for high-speed transcription.

- [ ] **Step 2: Intent Extraction**
  - Link transcribed text to the **Healer Protocol** for VSB trigger generation.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "feat(vocal): finalize OMI real-time audio bridge"
  ```

---

### Task 3: Full Trinity Handshake

- [ ] **Step 1: Verify End-to-End**
  - Speak to OMI wearable -> Node C (Rust) swaps mind -> Node B (Shroud) pulses visuals.

- [ ] **Step 2: Commit**
  ```bash
  git commit -m "feat(vocal): full trinity vocal handshake verified"
  ```
