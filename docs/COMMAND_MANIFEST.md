# ASP.GM-Agent: User & Developer Command Manifest (v1.6.0)

This document provides an exhaustive list of all control plane commands, startup scripts, developer tools, and API events available across the **Split-Node** architecture.

---

## 🚀 Master Ignition & Orchestration
These commands are used to launch, build, and maintain the ASP.GM-Agent ecosystem.

### Ignition Scripts
| Command | Shell | Description |
| :--- | :--- | :--- |
| `.\ignite.ps1` | PowerShell | **Master Launcher**: Bootstraps Foundry (CDP), Orchestrator, Sidecar Atlas, and Crush CLI in a single sequence. |

### NPM Scripts (Node B Orchestrator)
| Command | Description |
| :--- | :--- |
| `npm start` | Launches the Node.js Orchestrator (Mistral-Nemo Director). |
| `npm run build` | Compiles the TypeScript source code into the `dist/` directory. |
| `npm run typecheck` | Runs `tsc --noEmit` to verify strict-mode type safety. |
| `npm run test` | Executes the full Vitest suite (Standard and Integration). |
| `npm run test:watch` | Launches Vitest in interactive watch mode. |
| `npm run audit:theme` | Runs the **Custom Theme Auditor** to verify CSS/UI consistency. |
| `npm run audit:theme:dry` | Performs a dry-run of the Theme Auditor (Report only). |
| `npm run crush` | Launches the Crush CLI control plane. |

---

## ⚡ Crush CLI: System Control
The Crush CLI is the primary human-in-the-loop management interface for the AI GM.

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/scan` | None | Triggers the dual-node CV pipeline (Geometric + Semantic) and SensoryFilter LOS audit to ground the AI in the current map topology. |
| `/onboard` | `<PlayerName> <Role> <BuildType>` | Orchestrates the Fixer Interview and character creation pipeline. |
| `/pulse` | None | Manually advances the deterministic world state (faction influence shifts and NPC coordinate updates). |
| `/audit` | None | Performs a high-signal health check across Node A, Node B, the binary bridge, and the TaskRouterProxy queue. |

---

## 🎲 Foundry VTT: In-Game Mechanical Events
These events are triggered by player actions in Foundry and routed to the Split-Node stack.

| Event Type | Payload Data | Response |
| :--- | :--- | :--- |
| `evaluate_intent` | Trigger actor, scene context, event data. | **Intent Swarm**: Concurrent Tone (Node B) + Intensity (Node A) fusion for reactive environmental FX. |
| `resolve_attack` | Attacker/Defender stats, range, mods. | Node A Math + Node B Narrative + 3D Dice. |
| `calculate_dv` | Check type, skill, stat, difficulty. | DV Target + Breakdown pushed to chat. |
| `oracle_roll` | Formula (e.g. 1d10), luck points. | Deterministic result + 3D Dice. |
| `query_scenes` | Optional name filter. | Array of `{ id, name, active }` representing world maps. |
| `buy_item` | Actor ID, Item ID, Cost. | Ownership transfer in RKG + Narrative + Chronicle post. |
| `open_night_market` | Actor ID, Vendor Name. | Opens the Afterlife-themed shopping UI in Foundry. |

---

## 🛠️ MCP Tools: AI Agent Capabilities
These tools are available to the AI GM (Mistral-Nemo) to interact with the world engine.

### `nitro-logic` (Rules Authority)
- `resolve_math`: Ground rules checks in the Physics Constitution.
- `detect_walls`: Access the geometric CV pass on Node A.

### `chrome-devtools` (Neural Uplink)
- `capture_screenshot`: Capture the raw GPU rendering buffer of the Electron window.
- `inject_css`: Inject real-time style overrides (Inversion Engine).
- `evaluate_javascript`: Execute arbitrary code in the Foundry context.
- `reload_foundry`: programmatically refresh the Electron application.

### `nitro-db` (RKG Persistence)
- `rag_search`: Precision search over lore triplets.
- `execute_command`: Materialize state changes (Update NPC, Add Lore).

### `nitro-dev` (God Mode / Debugging)
- `force_world_mutation`: Unified tool for surgically overriding the world state.
  - `SET_HP_SP`: Directly set health or armor values for any actor.
  - `ADD_CRITICAL`: Manually inflict specific injuries (e.g., "Broken Leg").
  - `HL_BOMB`: Instantly trigger humanity loss and empathy decay.
  - `SET_MARKET_MULT`: Force price multipliers for specific vendors or categories.
  - `FORCE_PULSE`: Manually advance faction influence shifts.
- `bypass_approval_queue`: Globally enable/disable the GM approval gate for rapid testing.

### `discord-chronicler` (World Barks)
- `screamsheet_post`: Broadcast events to Discord via personas (NCPD, Street Rumor).

---

## 🦀 Node A: Rules Vault (Rust)
Commands for managing the ZeroClaw rules authority.

| Command | Directory | Description |
| :--- | :--- | :--- |
| `cargo run` | `zeroclaw/` | Launches the ZeroClaw Rust server (Local Debug). |
| `cargo test` | `zeroclaw/` | Executes the Rust unit test suite. |
| `cargo build --release` | `zeroclaw/` | Compiles the production binary for Node A. |
