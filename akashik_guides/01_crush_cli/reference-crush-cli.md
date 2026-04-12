# User Guide: Crush CLI (The Control Plane)

**Version:** 3.2.0
**Role:** Primary Human Interface for 50V3R31GN-M4CH1N4

---

## 🏁 Overview
The **Crush CLI** is your physical cockpit. It provides direct, low-latency control over the Split-Node World Engine, allowing you to trigger rules resolutions, narrative shifts, and physical materializations.

## ⚡ Core Commands (Consolidated)

### 1. System Operations
- **`npm run boot`**: The primary ignition command (via Deck-Igniter). Starts all components including Foundry VTT and Obsidian.
- **`npm run hub`**: Launches the main Rust Sidecar EGUI (The Cyberdeck Hub) for tactical radar and hacking overlays.
- **`npm run terminal`**: Directly opens the interactive Node B narrative link for two-way AI communication.
- **`npm run reconstruct`**: Re-syncs and organized the Obsidian RKG vault into semantic folders.
- **`./crush-cli help`**: Displays the full available command set.

### 2. Physical Materialization (The Architect Pass)
- **`/onboard [actor_id]`**: Triggers a conversational characterization for a new NPC and materializes their token in Foundry.
- **`/pulse`**: Advances the world clock by one "beat," triggering economic shifts and faction influence propagation.

### 3. Procedural Mission Engine (The Infinite Night)
- **`/mission [district_name]`**: Dispatches the **Mission Swarm** to synthesize a rules-correct mission blueprint, complete with tactical DVs and lore-anchored NPCs.

### 4. Vault Security
- **`./crush-cli vault seal <path>`**: Encrypts cleartext docs into steganographic PNG shards.
- **`./crush-cli vault open <path>`**: Decrypts shards back into cleartext.

## 🛡️ The 2-of-2 Authorization Gate (Flush Gate)
No world-state change occurs without your physical `ACK`. When the system attempts to flush a transaction to **`Akashik.db`**, you will be presented with a high-fidelity "Black-Ice" Auth Pane.
- **`y` / `Enter`**: GRANTED — Commit the changes to the universal record.
- **`n` / `Esc`**: REJECTED — Rollback the transaction.

---
*Command and Control: 50V3R31GN-M4CH1N4 v3.0.0 Hardened.*
- **radar --public [on|off]**: Toggles the tactical heat radar visibility bit in Mmap.
