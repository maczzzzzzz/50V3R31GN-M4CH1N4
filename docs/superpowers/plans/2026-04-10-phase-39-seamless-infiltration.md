# Phase 39: 534ML355-1NF1L7R4710N Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the machine into an active infiltration engine with transient biometric scanning, integrated netrunning hacks, and automated smart-asset ingestion.

**Architecture:** 
- **Bridge Layer:** Socket hooks for hover events.
- **Mmap Layer:** Expansion of `black_ice_state.mem` for transient data.
- **HUD Layer:** Reactive scanner and hacking menu in Egui.
- **Judge Layer:** Rules-bypass toggle for GM Sovereign Mode.

**Tech Stack:** Node.js (Foundry), Go (Crush), Rust (Cyberdeck sidecar), Binary UDP (VSB).

---

### Task 1: Bridge Perception Hooks

**Files:**
- Modify: `foundry-module/foundry-api-bridge.js`

- [ ] **Step 1: Implement Hover Hooks**
Inject `hoverToken`, `hoverDrawing`, and `hoverNote` listeners into `init()`.

- [ ] **Step 2: Implement POI Discovery**
Add logic to extract `sovereign` flags from hovered drawings.

---

### Task 2: Mmap Expansion & Sovereign Mode

**Files:**
- Modify: `crush/main.go`
- Modify: `src/core/shared-memory-service.ts`

- [ ] **Step 1: Add Sovereign Mode Command**
Add `sovereign-mode` subcommand to `crush/main.go` to toggle the God-Mode bit.

- [ ] **Step 2: Map Transient Buffer**
Reserve bytes in `black_ice_state.mem` for the `HOVERED_UNIT` slot.

---

### Task 3: Reactive HUD Infiltration Overlay

**Files:**
- Modify: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Implement Scanner UI**
Create a reactive window in Rust that populates when the Mmap transient slot is active.

- [ ] **Step 2: Quick Hack Console**
Integrate buttons in the `DECK` tab that trigger `crush hack` for the currently hovered unit.

---

### Task 4: Auto-Forge Architect Loop

**Files:**
- Modify: `src/core/architect-pass-service.ts`

- [ ] **Step 1: Hook Materialization**
Update `materializeTokens` to call the Forge RPC, background-baking biometrics into token portraits.

---

### ◈ Completion Criteria
1. Hovering a token in Foundry displays live biometrics in the Rust HUD.
2. Clicking "SY573M-5H0CK" in the HUD applies damage via Node A Judge.
3. `crush start --lite` successfully suppresses GUI components.
4. All 565 tests pass.
