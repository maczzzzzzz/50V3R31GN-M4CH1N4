# Design: WSL-Native Director & Sovereign Triangle (v3.2.19)
**Date:** 2026-04-04
**Target:** Phase 22 (Sovereign Highway Milestone)

## 1. Overview
The WSL-Native Director architecture moves the **Director Narrative Engine (Node B)** and the **Crush CLI** into a hermetic **Windows Subsystem for Linux (WSL)** environment. This creates a "Sovereign Triangle" where the Linux-native "Soul" communicates with the Windows-native "Body" (Foundry VTT and Ollama) via a protocol-agnostic **Binary UDP Virtual System Bus (VSB)**.

## 2. Architecture: The Sovereign Triangle
The system is partitioned into three specialized clusters linked via sub-1ms UDP:

### 2.1 The Command Center (WSL / Linux)
- **Director-RS:** Fork of `claw-code::runtime` (Rust) managing the narrative orchestrator and session logic.
- **Crush CLI:** The master operator interface running natively in the Linux terminal.
- **Modality:** Managed via **Nix Flakes** for 100% reproducibility and security.

### 2.2 The Rendering Client (Windows Host)
- **Foundry VTT:** Remains Windows-native for direct GPU driver access.
- **UDP-Relay:** A tiny Node.js sidecar that proxies Foundry's WebSockets into **Binary UDP Packets** for the VSB.
- **Visuals:** Receives state-sync from WSL to trigger **Pretext Overlays** and **Neural-Compositor** glitches.

### 2.3 The Inference Backend (Windows Host)
- **Ollama:** Windows-native service providing zero-overhead AMD GPU access (16GB VRAM).
- **Bridge:** The WSL Director communicates with the Windows Ollama instance via a mapped localhost HTTP/REST bridge.

## 3. Data Flow & Subsystem Discovery
- **Discovery Protocol:** Windows-side components broadcast a "Presence" beacon; the WSL Director listens and automatically updates its VSB routing table with the current host IP.
- **VSB Protocol:** All nodes (WSL, Windows Host, Remote Node A) communicate via a unified **Binary UDP Schema**, ensuring state parity across the entire distributed system.
- **Latency:** WSL2 local-subnet UDP latency (~0.1ms) satisfies the 1ms Sovereign Highway requirement.

## 4. Resilience
- **Heartbeat Monitoring:** WSL Director monitors UDP heartbeats from the Windows host.
- **Safe-State Mode:** If the host disconnects, the Director pauses the 12B Brain and triggers a **Pretext "System Offline" Glitch** in the HUDs to maintain immersion.

## 5. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>
