# Design Spec: DECK-IGNITER TUI (Master Startup & Supervisor)

**Date:** 2026-04-05
**Version:** 3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Project:** 50V3R31GN-M4CH1N4
**Domain:** Node B (NixOS/WSL) Orchestration

## 1. Objective
Create a robust, high-fidelity Terminal UI (TUI) that acts as the single "Power Button" and supervisor for the entire 50V3R31GN-M4CH1N4 ecosystem. It eliminates manual multi-terminal management and provides real-time health monitoring of the Sovereign Highway.

## 2. Architecture
The Igniter is a Go-based application built with the **Bubble Tea** framework. It manages concurrent processes across three distinct execution layers:

### 2.1 Layer 1: Windows (Foundry VTT)
- **Mechanism:** WSL Interop (`/mnt/c/Windows/System32/cmd.exe`).
- **Command:** `cmd.exe /C start "" "D:\FoundryVTT\Foundry Virtual Tabletop\Foundry Virtual Tabletop.exe" --remote-debugging-port=9222`.
- **Session Logic:** The Igniter will not timeout during Foundry startup. It will poll `localhost:9222` and display "FOUNDRY: NEGOTIATING" until the CDP bridge is active and the game world is detected.

### 2.2 Layer 2: WSL (Director & Sidecars)
- **Director:** Launches the Node.js orchestrator via `nix develop --command pnpm start`.
- **Sidecars:** Launches Atlas and Netrunning sidecars via `nix develop --command cargo run --release`.
- **Process Management:** Each component runs in a dedicated goroutine with `os/exec`.

### 2.3 Layer 3: Remote (Node A Kernel)
- **Handshake:** Uses SSH with the confirmed key (`~/win_id_ed25519`).
- **Cognition:** Starts `llama-server` with the 1.5B Reasoner via `setup-resident-models.sh`.
- **Authority:** Starts the `zeroclaw` Rust binary.

## 3. Visual Identity (Black-Ice Theme)
- **Primary:** Cyan (`#ff003c`) for active/healthy states.
- **Accent:** Red (`#ff003c`) for stopped/error states.
- **UI Components:**
    - ASCII Art Header: `IGNITER`.
    - Component Status Table: Name, State (Starting/Running/Error), Uptime, PID/IP.
    - System Log Feed: Last 5 events from all combined streams.

## 4. Interaction Model (Supervisor)
- `ctrl+i`: Sequential boot of the full deck.
- `r`: Trigger a "Service Reset" for the selected component (pkill + restart).
- `k`: Hard kill of the selected component.
- `shift+q`: Graceful shutdown of all subsystems and exit.

## 5. Reliability & Health
- **Probes:** Every 2s, the tool verifies:
    - HTTP 200 from Node A (`/health`).
    - CDP JSON response from Node B (`localhost:9222`).
    - Heartbeat ACK from the VSB UDP server.
- **Auto-Restore:** If a component fails unexpectedly, the Igniter will attempt a limited number of restarts before alerting the user.


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
