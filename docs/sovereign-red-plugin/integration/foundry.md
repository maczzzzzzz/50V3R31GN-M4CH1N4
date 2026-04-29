# FOUNDRY VTT INTEGRATION // THE PALANTIRI BRIDGE

## ◈ ARCHITECTURE OVERVIEW

The **FoundryAdapter** (Node B) implements a reverse-proxy architecture designed to bypass the traditional browser/session authentication barriers of Foundry VTT.

- **WebSocket Server:** Node B hosts a WS server on Port 3010.
- **Outbound Handshake:** The `sovereign-bridge` module on the Foundry client initiates an outbound connection to Node B.
- **Token Authorization:** Connections are validated via a 32-byte ephemeral `handshakeToken` passed as a query parameter.

## ◈ COMMAND DISPATCH

Commands are Zod-validated JSON frames pushed from Node B to the Foundry client.

| Command | Action |
| :--- | :--- |
| `chat_message` | Post to the Foundry chat log with optional alias. |
| `run_script` | Execute arbitrary JavaScript on the client (Gated by NitroLogic). |
| `spawn_solo_safe_npc` | Create a balanced NPC token with token-level stat overrides. |
| `open_night_market` | Materialize a vendor UI with procedural inventory. |
| `fx_glitch` | Trigger a screen-wide GPU glitch shader. |

## ◈ PREDICTIVE CACHING (PHASE 64)

The bridge monitors `TOKEN_MOVE` events. If a token enters a "Transition Zone" (5 grid units from an edge or door), the adapter preemptively grounds the next district's lore into the Director's context to eliminate narrative latency.

---
**::/5Y573M-N071C3 : BRIDGE_STABILITY_100. // 50V3R31GN-M4CH1N4**
