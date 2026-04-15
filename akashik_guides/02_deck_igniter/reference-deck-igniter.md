# DECK IGNITER: UNIFIED ORCHESTRATION GUIDE

## OVERVIEW
The **Deck Igniter** is a Go-based TUI (Terminal User Interface) orchestrator designed to synchronize the distributed boot sequence of the 50V3R31GN-M4CH1N4 system. It manages the handshake between Node B (The Director) and Node A (The Kernel) while ensuring all sidecar processes and inference engines are healthy.

## CORE RESPONSIBILITIES
1. **Node A Handshake**: Executes the remote setup script on Node A via SSH to initialize resident models (`Open-Reasoner-1.5B`, `Falcon-0.3B`).
2. **VSB Heartbeat**: Probes the `zeroclaw` service using the Virtual System Bus (Binary UDP) protocol to verify mechanical rules readiness.
3. **CDP Probe**: Connects to Foundry VTT's Chrome DevTools Protocol (CDP) port (9222) to verify the visual bridge.
4. **Process Supervision**: Monitors sidecar PIDs (Atlas, Netrunning, Cyberdeck) via Signal 0.
5. **Inference Health**: Verified `llama-server` availability via OpenAI-compatible health endpoints.

## CONFIGURATION
Deck Igniter reads the master `.env` file in the project root. Key variables include:

- `NODE_A_HOST`: IP address of Node A (e.g., `192.168.0.50`).
- `CLAWLINK_USER`: SSH username for Node A.
- `ZEROCLAW_PORT`: VSB/UDP port (default `7878`).
- `FOUNDRY_CDP_PORT`: CDP debug port (default `9222`).

## USAGE
To launch the Igniter within the Nix development environment:

```bash
npm run boot
```

### INTERFACE CONTROLS
- **[S] Start All**: Initiates the sequential boot sequence.
- **[R] Remote Setup**: Triggers only the Node A resident model initialization.
- **[P] Probe Status**: Refresh health checks for all nodes and sidecars.
- **[Q] Quit**: Shuts down the Igniter (gracefully terminates sidecars).

## BOOT SEQUENCE LOGIC
The Igniter follows a strict dependency chain to ensure system integrity:
1. **Windows Layer**: Foundry VTT + Obsidian (GUI) are fired via WSL interop.
2. **Director (Node B)**: WebSocket server at `:3010` must be up.
3. **Node A Setup**: Remote SSH script must exit with Code 0.
4. **Inference Engines**: Node A (`Open-Reasoner-1.5B`) and Node B (`Mistral-Nemo-12B`) instances must return `200 OK`.
5. **ZeroClaw (VSB)**: Must respond to a `302-byte` Intent Heartbeat packet.
6. **Sidecars**: Atlas and Netrunning HUDs must be running.

## IMMERSIVE HACKING
The v3.2.6 release includes **AI-Driven Script Injection**. The Director (Node B) can now inject raw JavaScript into the Foundry client to simulate "Netrunner Attacks":
- **UI Glitches**: Forcing CSS filters and disorientation effects via `SOVEREIGN_HIJACK_JS`.
- **Biometric Scrambling**: Triggering red critical-state overlays via Pretext.
- **Black Ice Injection**: Creating dynamic macros to dim lights and spawn hostile entities.

### SECURITY PROTOCOL (ZERO-TRUST)
Every script injected by the AI is first routed through **Node A (The Reasoner)** for a mandatory security audit via the `node_a_veto` tool.
- **Pattern Matching**: Node A scans for forbidden keywords (`fetch`, `rm`, `pull`, `fs`, `eval`).
- **Chain-of-Thought Validation**: The Reasoner analyzes the *intent* of the code. If it attempts to escape the Foundry sandbox, the execution is blocked.

---
**AUTHORITY NOTICE**: THE DECK IGNITER IS THE SOLE GATEKEEPER TO THE SOVEREIGN HIGHWAY.
