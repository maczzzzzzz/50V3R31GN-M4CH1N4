# DECK-IGNITER TUI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Go-based TUI (Bubble Tea) that orchestrates the full ASP.GM-Agent stack across Windows, WSL, and Node A.

**Architecture:** A concurrent Go application using `os/exec` for local processes, WSL interop for Windows tasks, and SSH for Node A commands. Heartbeat monitoring via background goroutines.

**Tech Stack:** Go, Bubble Tea (TUI), SSH, WSL Interop.

---

### Task 1: Initialize Project & Core Types

**Files:**
- Create: `deck-igniter/main.go`
- Create: `deck-igniter/go.mod`

- [ ] **Step 1: Initialize Go module**
Run: `mkdir deck-igniter && cd deck-igniter && go mod init github.com/maczzzzzzz/deck-igniter`

- [ ] **Step 2: Define Component and State types**
Define the structures for tracking component health (Running, Starting, Error) and the TUI model.

### Task 2: Implement Execution Layer (Foundry & Sidecars)

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Implement Windows interop launcher**
Add logic to trigger the Foundry executable via `cmd.exe`.

- [ ] **Step 2: Implement Nix-native WSL launchers**
Add logic to launch the Director and Sidecars using `nix develop --command`.

### Task 3: Implement Remote Layer (Node A SSH)

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Implement SSH command wrapper**
Add logic to run commands on Node A using `~/win_id_ed25519`.

- [ ] **Step 2: Implement Node A sequence**
Implement the two-stage boot: `setup-resident-models.sh` followed by `zeroclaw`.

### Task 4: Build the Bubble Tea UI

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Implement Header and Status Table**
Create the visual representation of the component grid using `lipgloss`.

- [ ] **Step 2: Implement Hotkey Handlers**
Map `ctrl+i`, `r`, `k`, and `shift+q` to their respective orchestration actions.

### Task 5: Implement Heartbeat Monitor

**Files:**
- Modify: `deck-igniter/main.go`

- [ ] **Step 1: Add background polling**
Implement a 2s ticker that probes HTTP/CDP endpoints and updates the UI model.

- [ ] **Step 2: Verify full integration**
Run: `go run .` and perform a manual verification of the handshake logic.

---

### Task 6: Finalization

- [ ] **Step 1: Commit and Push**
```bash
git add deck-igniter/
git commit -m "feat: implement DECK-IGNITER TUI master supervisor"
git push origin master
```
