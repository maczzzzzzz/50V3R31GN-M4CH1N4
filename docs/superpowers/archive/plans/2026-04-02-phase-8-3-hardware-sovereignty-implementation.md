# Phase 8.3 "Hardware Sovereignty" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Rust Strategic Atlas (Shared Synapse) and refit the Crush CLI with Lipgloss styling.

**Architecture:** Shared Synapse (Synapse-mapped file) bridge between Node.js (Writer) and Rust (Reader). Go-based Lipgloss styling for unified CLI identity.

**Tech Stack:** Rust (egui, shared_memory), Go (Lipgloss), TypeScript (node-shared-mem).

---

### Task 1: Shared Synapse Mesh (Node B)

**Files:**
- Modify: `package.json` (Add `node-shared-mem` or similar)
- Create: `src/core/shared-memory-service.ts`

**Step 1: Allocate Segment**
Initialize a 4MB memory-mapped file `black_ice_state.mem`.

**Step 2: Implement Writer**
Serialize the RKG blip-state into raw bytes according to the Phase 8.3 spec.

**Step 3: Verification**
Verify that the `.mem` file is created and updates its transaction counter on every NPC move.

---

### Task 2: Strategic Atlas Scaffolding (Rust)

**Files:**
- Create: `sidecar-atlas/Cargo.toml`
- Create: `sidecar-atlas/src/main.rs`

**Step 1: Setup egui + shared_memory**
Initialize the Rust workspace with hardware-acceleration support.

**Step 2: Implement Radar Renderer**
Draw the 10x10 grid and actor blips using the "Black-Ice Cyan" palette.

**Step 3: Verification**
Run `cargo run` and verify blips move in sync with Node B data.

---

### Task 3: Crush CLI Lipgloss Refit (Go)

**Files:**
- Modify: `crush/main.go` (or relevant Go files)

**Step 1: Implement Black-Ice Theme**
Define the Lipgloss styles for borders, headers, and ASCII bars.

**Step 2: Integrate Reactive Bars**
Update the UI loop to render real-time HP/SP bars using the Cyan palette.

**Step 3: Verification**
Run `crush run` and verify the terminal matches the Foundry "Black-Ice" identity.

---

### Task 4: Final Verification Audit

**Files:**
- Create: `docs/audits/2026-04-02_v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-Sovereignty-Audit.md`

**Step 1: E2E Sync Check**
Verify that a change in `world.db` propagates to Foundry Sidebar, Crush CLI, and Strategic Atlas simultaneously.

**Step 2: Version Bump**
Iterate version to **1.1.0** (Unified World Engine).


---
**LINKS:** [[OS_CORE]]
