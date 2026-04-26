# DECK IGNITER: HEADLESS ORCHESTRATION ENGINE

## OVERVIEW
The **Deck Igniter** is a Go-based orchestration engine designed to synchronize the distributed boot sequence of the 50V3R31GN-M4CH1N4 system. While originally a TUI (Terminal User Interface), it has been transitioned to a **Headless Backend Service** triggered primarily by the **WebGL Nucleus Deck**.

It manages the handshake between Node B (The Director) and Node A (The Kernel) while ensuring all sidecar processes and inference engines are healthy.

## CORE RESPONSIBILITIES
1. **Node A Handshake**: Executes the remote setup script on Node A via SSH to initialize resident models (`Open-Reasoner-1.5B`, `Falcon-0.3B`).
2. **VSB Heartbeat**: Probes the `zeroclaw` service using the Virtual System Bus (Binary UDP) protocol to verify mechanical rules readiness.
3. **CDP Probe**: Connects to Foundry VTT's Chrome DevTools Protocol (CDP) port (9222) to verify the visual bridge.
4. **Process Supervision**: Monitors sidecar PIDs (Atlas, Netrunning, Cyberdeck) via Signal 0.
5. **Cognition Health**: Verified `llama-server` availability via OpenAI-compatible health endpoints.

## ARCHITECTURAL SHIFT: WEBGL FIRST
As of **Phase 50**, the manual TUI is deprecated. All ignition commands are routed through the **Nucleus Artery** (`crush nucleus`) which executes the Igniter in background mode.

### Triggering Ignition
The Igniter is invoked by the Nucleus Artery using:
```bash
crush start --headless --full
```
This sets the following environment variables:
- `HEADLESS=1`: Disables the Bubble Tea TUI renderer.
- `AUTO_IGNITE=1`: Immediately initiates the `bootSequenceCmd`.

## USAGE (BACKEND)
The Igniter is typically managed by the **Nucleus Artery** at `http://localhost:3030`.

### MANUAL DEBUG MODE
If direct terminal observability is required for debugging orchestration failures:
```bash
npm run boot
```
*Note: Using manual boot while a Nucleus-driven boot is active may cause process collisions.*

---
**AUTHORITY NOTICE**: THE DECK IGNITER IS THE ENGINE; THE NUCLEUS DECK IS THE PILOT.

## IMMERSIVE HACKING
The v3.8.7 release includes **AI-Driven Script Injection**. The Director (Node B) can now inject raw JavaScript into the Foundry client to simulate "Netrunner Attacks":
- **UI Glitches**: Forcing CSS filters and disorientation effects via `SOVEREIGN_HIJACK_JS`.
- **Biometric Scrambling**: Triggering red critical-state overlays via Pretext.
- **Black Ice Injection**: Creating dynamic macros to dim lights and spawn hostile entities.

### SECURITY PROTOCOL (ZERO-TRUST)
Every script injected by the AI is first routed through **Node A (The Reasoner)** for a mandatory security audit via the `node_a_veto` tool.
- **Pattern Matching**: Node A scans for forbidden keywords (`fetch`, `rm`, `pull`, `fs`, `eval`).
- **Chain-of-Thought Validation**: The Reasoner analyzes the *intent* of the code. If it attempts to escape the Foundry sandbox, the execution is blocked.

---
**::/5Y573M-N071C3 : TRU7H UN1F13D. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[02_deck_igniter]] | [[OS_CORE]]
