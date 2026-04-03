# ASP.GM-Agent: User & Developer Command Manifest (v1.1.2)

This document provides a comprehensive list of all control plane commands available via the **Crush CLI**, **MCP Tools**, and the **Foundry VTT Bridge**.

---

## ⚡ Crush CLI: System Control
The Crush CLI is the low-level management interface for the AI GM.

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/scan` | None | Triggers the dual-node CV pipeline (Geometric + Semantic) to ground the AI in the current map topology. |
| `/onboard` | `<PlayerName> <Role> <BuildType>` | Orchestrates the Fixer Interview and character creation pipeline. |
| `/pulse` | None | Manually advances the deterministic world state (faction influence shifts and NPC coordinate updates). |
| `/audit` | None | Performs a high-signal health check across Node A, Node B, and the binary bridge. |

---

## 🎲 Foundry VTT: In-Game Mechanical Events
These events are triggered by player actions in Foundry and routed to the Split-Node stack.

| Event Type | Payload Data | Response |
| :--- | :--- | :--- |
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

