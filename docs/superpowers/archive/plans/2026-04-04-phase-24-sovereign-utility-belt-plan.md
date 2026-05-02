# Implementation Plan: Phase 24 — Sovereign Utility Belt (v3.8.28-GOLD)

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Agent into a physical actor with human-in-the-loop safety. Deploy the HUD Utility Belt and the Crush Sidecar Registry.

**Architecture:** Distributed supervisor (Crush/Go) managing independent Egui/Rust sidecars with a VSB-driven Physical ACK flow.

**Tech Stack:** Go (Crush), Rust (Sidecars), TypeScript (Node B), VSB (Mmap).

---

### Task 1: The Sidecar Registry (Crush CLI) [DONE]

**Files:**
- Create: `crush/registry.go` [DONE]
- Modify: `crush/main.go` [DONE]

**Step 1: Implement Process Supervisor** [DONE]
Create a Go module to manage `os/exec.Cmd` child processes for sidecar binaries.
- Binary discovery in `./dist/sidecars/`
- `Start()`, `Stop()`, `Restart()` methods
- Capturing stdout/stderr to `.crush/logs/`

**Step 2: Add `crush belt` Commands** [DONE]
Expose the supervisor via the CLI:
- `crush belt list`
- `crush belt start <name>`
- `crush belt stop <name>`

**Step 3: Commit** [DONE]
```bash
git add crush/
git commit -m "feat(crush): implement Sidecar Registry and 'belt' command"
```

---

### Task 2: VSB ProposedActions & Physical ACK [DONE]

**Files:**
- Create: `crush/watcher.go` [DONE]
- Create: `crush/auth_pane.go` [DONE]
- Modify: `crush/main.go` [DONE]

**Step 1: Go-native VSB Mesh** [DONE]
Implement a Go-native `mmap` watcher for the Virtual System Bus.
- Read `ProposedActions` ring buffer.
- Detect `PENDING` status changes.

**Step 2: Implement Authorization Pane** [DONE]
Use `lipgloss` to render a high-contrast terminal overlay.
- Blocking UI loop when `PENDING` action is detected.
- Keybinds: `ENTER` to Approve, `ESC` to Reject.

**Step 3: Commit** [DONE]
```bash
git add crush/
git commit -m "feat(crush): implement VSB watcher and Physical ACK Authorization Pane"
```

---

### Task 3: HUD Deployment (Atlas v2.0 & Netrunning HUD)

**Files:**
- Modify: `sidecar-atlas/src/main.rs`
- Create: `sidecar-netrunning/` (Scaffold)

**Step 1: Atlas Radar v2.0**
Update `sidecar-atlas` to support:
- `GhostBlips` (Phase 23) visualization.
- Tactical heatmaps from Node A.

**Step 2: Netrunning HUD Scaffold**
Create a new `eframe` (Rust) sidecar for Netrunning.
- 3D Isometric grid rendering.
- Basic ICE node visualization.

**Step 3: Commit**
```bash
git add sidecar-atlas/ sidecar-netrunning/
git commit -m "feat(hud): upgrade Atlas Radar and scaffold Netrunning HUD"
```

---

### Task 4: The Flush Gate Integration (Director)

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Modify: `src/api/foundry-adapter.ts`

**Step 1: Propose vs. Execute**
Refactor Node B to write `PENDING` actions to VSB instead of direct execution for critical paths.

**Step 2: Approved Listener**
Implement the VSB watcher in Node B to catch `APPROVED` flags and finally commit the change to Foundry VTT.

**Step 3: Commit**
```bash
git add src/
git commit -m "feat(director): implement the Flush Gate (AI Proposal -> Human ACK -> Execution)"
```


---
**LINKS:** [[OS_CORE]]
