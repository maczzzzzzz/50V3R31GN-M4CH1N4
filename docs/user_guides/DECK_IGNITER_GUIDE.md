# DECK IGNITER: UNIFIED ORCHESTRATION GUIDE

## OVERVIEW
The **Deck Igniter** is a Go-based TUI (Terminal User Interface) orchestrator designed to synchronize the distributed boot sequence of the ASP-GM-AGENT system. It manages the handshake between Node B (The Director) and Node A (The Kernel) while ensuring all sidecar processes and inference engines are healthy.

## CORE RESPONSIBILITIES
1. **Node A Handshake**: Executes the remote setup script on Node A via SSH to initialize resident models (`Open-Reasoner-Zero-1.5B`, `Falcon-0.3B`).
2. **VSB Heartbeat**: Probes the `zeroclaw` service using the Virtual System Bus (Binary UDP) protocol to verify mechanical rules readiness.
3. **CDP Probe**: Connects to Foundry VTT's Chrome DevTools Protocol (CDP) port (9222) to verify the visual bridge.
4. **Process Supervision**: Monitors sidecar PIDs (Atlas, Netrunning, Cyberdeck) via Signal 0.
5. **Inference Health**: Verified `llama-server` availability via OpenAI-compatible health endpoints.

## CONFIGURATION
Deck Igniter reads the master `.env` file in the project root. Key variables include:

- `CLAWLINK_USER`: SSH username for Node A (e.g., `maczz`).
- `CLAWLINK_SSH_PORT`: SSH port for Node A (default `22`).
- `ZEROCLAW_PORT`: VSB/UDP port (default `7878`).
- `FOUNDRY_CDP_PORT`: CDP debug port (default `9222`).

## USAGE
To launch the Igniter within the Nix development environment:

```bash
cd crush
go run main.go
```

### INTERFACE CONTROLS
- **[S] Start All**: Initiates the sequential boot sequence.
- **[R] Remote Setup**: Triggers only the Node A resident model initialization.
- **[P] Probe Status**: Refresh health checks for all nodes and sidecars.
- **[Q] Quit**: Shuts down the Igniter (does not kill background sidecars).

## BOOT SEQUENCE LOGIC
The Igniter follows a strict dependency chain to ensure system integrity:
1. **Foundry VTT**: Must be reachable via CDP.
2. **Director (Node B)**: WebSocket server at `:3010` must be up.
3. **Node A Setup**: Remote SSH script must exit with Code 0.
4. **Inference Engines**: Node A and Node B `llama-server` instances must return `200 OK`.
5. **ZeroClaw (VSB)**: Must respond to a `302-byte` Intent Heartbeat packet.
6. **Sidecars**: Atlas and Netrunning HUDs must be running.

## IMMERSIVE HACKING (NEW)
The v1.9.0 release introduces **AI-Driven Script Injection**. The Director (Node B) can now inject raw JavaScript into the Foundry client to simulate "Netrunner Attacks":
- **UI Glitches**: Forcing CSS filters and disorientation effects.
- **Biometric Scrambling**: Triggering red critical-state overlays via Pretext.
- **Black Ice Injection**: Creating dynamic macros to dim lights and spawn hostile entities.

These effects are managed by the `NetrunnerAntagonistService` and are visible in the **Netrunner HUD Sidecar**, which now features real-time **Intrusion Alert** visuals.
## TROUBLESHOOTING
- **SSH Timeout**: Ensure your SSH key (`~/win_id_ed25519`) is added to the agent or has `600` permissions.
- **VSB Packet Mismatch**: The Igniter expects a strict `#[repr(C, packed)]` binary format. Ensure `zeroclaw` is compiled with the latest `vsb_protocol.rs`.
- **CDP Refused**: Ensure Foundry is started with `--remote-debugging-port=9222`.

---
**AUTHORITY NOTICE**: THE DECK IGNITER IS THE SOLE GATEKEEPER TO THE SOVEREIGN HIGHWAY.
