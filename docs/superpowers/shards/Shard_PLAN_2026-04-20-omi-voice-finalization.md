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
- Modify: `zeroclaw/crates/zeroclaw-kernel/src/bin/artery_manager.rs`

- [x] **Step 1: Finalize Real-time Audio bytes endpoint**
  - Implement Axum WebSocket to receive chunks from OMI wearable.
  - Mocked Whisper integration for high-speed transcription.

- [x] **Step 2: Intent Extraction**
  - Link transcribed text to the **Healer Protocol** for VSB trigger generation.

- [x] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "feat(vocal): consolidate OMI real-time audio bridge into Rust daemon"
  ```

---

### Task 3: Full Trinity Handshake

- [ ] **Step 1: Verify End-to-End**
  - Speak to OMI wearable -> Node C (Rust) swaps mind -> Node B (Shroud) pulses visuals.

- [ ] **Step 2: Commit**
  ```bash
  git commit -m "feat(vocal): full trinity vocal handshake verified"
  ```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
