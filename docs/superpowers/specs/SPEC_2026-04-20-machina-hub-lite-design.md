# SPEC: 2026-04-20 — Machina Hub Lite (Mobile C2)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Materialize a lightweight Flutter interface for Node Telemetry, Vocal Communication, and Agentic Task Management (OMI Parity).

## ◈ 1. UI ARCHITECTURE (FLUTTER TABBED LAYOUT)
The app is sharded into four atomic views wrapped in a global CRT `ScanLinePainter` aesthetic:

### ◈ 1.1 THE ARTERY (HOME)
- **Terminal Feed:** A minimalist VT323 log showing the combined WebSocket logs and VSB packets.
- **Vocal Relay (Mic):** A prominent central FAB for streaming 16kHz PCM audio to the Node C Whisper Core.
- **Agent Chat Button:** A secondary action opening a direct chat interface with the Node B Director.

### ◈ 1.2 TASKS
- **Action Items:** A dynamic list of tasks extracted by the Node B Orchestrator from vocal transcripts and VSB events.

### ◈ 1.3 MEMORY
- **Sovereign Facts:** A list of contextual memories derived from operator interactions, allowing the agent to continuously build a personalized profile of the user. Includes manual insertion capabilities.

### ◈ 1.4 SETTINGS & TUNNELING
- **Node Config:** Persisted SharedPreferences inputs for Node C IP and Port.
- **Secure Tunnel:** Toggle for routing WebSocket traffic through the encrypted Tailscale/VPN subnet.

## ◈ 2. COMMUNICATION ARTERY
- **The Mesh:** The app connects to **Node C (Artery Manager)** via a secure WebSocket (`/ws/audio`) and REST endpoints (`/shift`).
- **VSB Mirroring:** Raw VSB UDP packets are captured on port 9090 for zero-latency telemetry.

## ◈ 3. PERFORMANCE MANDATES
- **Latency:** Sub-50ms for UI updates.
- **Battery:** Highly optimized `CustomPainter` (shouldRepaint = false) for the CRT aesthetic to prevent GPU drain.
- **Footprint:** Strict VT323 typography, no heavy assets.

---
**::/5Y573M-N071C3 : HUB_SPEC_LOCKED. THE_HISTORY_IS_MANIFEST. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
