# Design Specification: Phase 10 — Deep-Dive Netrunning Engine (v3.2.19)
**Subject:** Virtual Reality Simulation & Concurrent Floor Partitioning
**Status:** DESIGN FINALIZED

## 1. Executive Summary
The Netrunning Engine provides a dedicated high-fidelity simulation layer for virtual hacking. It utilizes the **Swarm Oracle** to isolate rules-reasoning per architecture floor and the **Neural Uplink** to physically alter the Foundry VTT environment, creating an immersive "Matrix" interface.

## 2. Technical Architecture

### 2.1 The "Matrix" Interface (Visual Inversion)
- **Transport:** Neural Uplink (CDP).
- **Effect:** Hot-injects `matrix-fx.css` into the Electron renderer.
- **Visuals:** CRT glow, green scanlines, and high-contrast UI focus on the NET sidebar.

### 2.2 Floor-Partitioned Reasoning
- **Mechanism:** For every floor in a NET architecture, Node A spawns a dedicated `tokio` swarm task.
- **Benefit:** Prevents "Cross-Floor Leakage" where the AI confuses a Password on Floor 1 with ICE on Floor 5.

### 2.3 Action-Conditioned Barks
- **Logic:** Mathematical outcomes (e.g. `Backdoor` success) trigger immediate narrative barks synchronized with 3D dice visuals.

## 3. Implementation Requirements
- **Integration:** Binds to the `district_grid` to identify physical Access Points.
- **Governance:** All hacking outcomes are recorded in the **Akashik Record**.
