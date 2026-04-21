# Sovereign Observer Implementation Plan (Phase 64.5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the OMI Desktop-inspired ambient screen capture daemon for WSL2/Node B.

**Architecture:** Rust Daemon (`sovereign-observer`) -> `/dev/shm` Frame Buffer -> Dual-Vision Array.

**Tech Stack:** Rust, `xcap` or `scrap`, `image` crate, VSB (UDP).

---

### Task 1: Observer Scaffold (Node B)

**Files:**
- Create: `zeroclaw/crates/sovereign-observer/Cargo.toml`
- Create: `zeroclaw/crates/sovereign-observer/src/main.rs`
- Modify: `zeroclaw/Cargo.toml`

- [ ] **Step 1: Initialize Crate**
  - Add `sovereign-observer` to the zeroclaw workspace members.
  - Add `xcap`, `image`, and `tokio` dependencies.

- [ ] **Step 2: Implement Capture Loop**
  - Implement 1Hz capture interval.
  - Filter for "Foundry VTT" or "Chromium" window title.
  - Save to `/dev/shm/optic_nerve_latest.png`.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "feat(sensory): scaffold sovereign-observer for ambient screen awareness"
  ```

---

### Task 2: Falcon OCR Integration (The Reflexes)

- [ ] **Step 1: Wire Falcon to /dev/shm**
  - Update `zeroclaw-kernel` perception logic to poll the shared memory buffer.
  - Implement tactical OCR extraction for "Combat Log" keywords.

- [ ] **Step 2: Commit**
  ```bash
  git commit -m "feat(sensory): link Falcon perception to observer frame buffer"
  ```
