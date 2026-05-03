# Phase 119: HUD Encapsulation & Artery Re-Wiring

**Goal:** Connect the Pretext HUD (Next.js) and Flutter Mobile App to the Hermes-Agent Clinical Fork, ensuring visual and protocol parity across the mesh.

**Architecture:** Visual HUD (Web/Mobile) <-> JSON-RPC Gateway <-> Hermes Python Harness <-> VSB/MCP Arteries.

---

### ◈ 1. THE INTERFACE TOPOLOGY

| Component | Protocol | Target | Artery |
| :--- | :--- | :--- | :--- |
| **Pretext HUD** | HTTP/WS | Port 9119 | Interactive TUI |
| **Flutter App** | WebSocket | Port 8000 (Gateway) | Mobile Artery |
| **OMI Relay** | UDP/PCM | Port 7878 -> MCP | Voice Stream |
| **Observer** | CDP / Frame | 1Hz Stream | Vision Artery |

---

### ◈ 2. IMPLEMENTATION STEPS

- [ ] **Step 1: Hermes Dashboard "Authority" Skinning**
Modify `sidecars/hermes-agent-nous/hermes_cli/web_dist/` (or the source TUI CSS) to enforce the v1.3.1 Tactical Authority standard.
  - Background: `#1A282F`
  - Accents: `#376374`
  - Typography: `Cinzel` for headers, `Lexend` for data.

- [ ] **Step 2: Mobile Gateway Realignment (Flutter)**
Update `terminal-app/lib/services/openclaw_bridge.dart` to utilize the upstream `hermes-agent` JSON-RPC protocol instead of the legacy `hermes-core` sockets.
```dart
// target: ws://node-b:8000/ws
// protocol: JSON-RPC 2.0
```

- [ ] **Step 3: Establish 1Hz Vision Artery Loopback**
Configure the `SovereignObserver` (Python-side) to ingest the 1Hz frame stream from the Director (Node B). This provides the agent with real-time visual context of the operator's environment.

- [ ] **Step 4: Connect OMI Voice Stream to Whisper-MCP**
Re-wire the OMI relay to stream PCM-16 audio directly to the `sovereign-whisper-mcp` (Port 7878). Ensure the transcribed text is injected as an 'Ambient Intent' into the Hermes conversation loop.

- [ ] **Step 5: Pretext Dashboard Encapsulation**
Update `dashboard/components/HermesInteractiveTUI.tsx` to iframe the hardened Hermes Dashboard, passing the necessary `mTLS` and `ST3GG` headers for secure ingestion.

---

### ◈ 3. VERIFICATION (THE GAUNTLET)

- [ ] **Verification 1:** Open the Pretext HUD and confirm the Hermes TUI renders in `#376374` (Deep Teal).
- [ ] **Verification 2:** Send a command from the Flutter app and verify it appears in the Python Harness log.
- [ ] **Verification 3:** Verify that a physical change in the 1Hz vision stream (e.g., a hand gesture) is detected and logged by the Agent.
- [ ] **Verification 4:** Confirm sub-200ms latency for mobile voice transcription via the OMI -> Whisper-MCP path.

---
**::/5Y573M-N071C3 : HUD_ENCAPSULATION_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
