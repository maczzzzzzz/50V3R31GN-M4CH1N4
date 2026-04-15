# User Guide: Crush CLI (The Control Plane)

**Version:** 3.2.6
**Role:** Primary Human Interface for 50V3R31GN-M4CH1N4

---

## 🏁 Overview
The **Crush CLI** is your physical cockpit. It provides direct, low-latency control over the Split-Node World Engine, allowing you to trigger rules resolutions, narrative shifts, and physical materializations.

## ⚡ Core Commands (Consolidated)

### 1. System Operations
- **`npm run boot`**: The primary ignition command (via Deck-Igniter). Starts all components including Foundry VTT and Obsidian.
- **`npm run hub`**: Launches the main Rust Sidecar EGUI (The Cyberdeck Hub) for tactical radar and hacking overlays.
- **`npm run terminal`**: Directly opens the interactive Node B narrative link for two-way AI communication.
- **`npm run harmonize`**: Synchronizes the Obsidian RKG vault with the SQLite Oracle.
- **`./crush-cli help`**: Displays the full available command set.

### 2. Intelligence Forge (Phase 52+)
- **`npm run forge:skills`**: Starts the **Skill Factory** to scan session logs for successful patterns and propose new `SKILL.md` shards.
- **`npm run forge:gepa`**: Triggers the **GEPA Optimizer** to programmatically evolve the "Sovereign Soul" based on high-signal trajectories.
- **`npm run pulse`**: Executes a one-time world heartbeat advance.

### 3. Physical Materialization (The Architect Pass)
- **`/onboard <name> <role>`**: (In-Game Chat) Triggers conversational characterization and materializes a token.
- **`/scan`**: (In-Game Chat) Triggers visual perception scan of the active scene.
- **`./crush-cli crop-scan <x> <y> <size>`**: Captures and analyzes a specific coordinate.

### 4. Vault Security
- **`./crush-cli vault seal <path>`**: Encrypts cleartext docs into steganographic PNG shards.
- **`./crush-cli vault open <path>`**: Decrypts shards back into cleartext.
- **`./crush-cli sovereign-mode [on|off]`**: Toggles God-Mode (Bypass Rules Oracle).

## 🛡️ The 2-of-2 Authorization Gate (Flush Gate)
No world-state change occurs without your physical `ACK`. When the system attempts to flush a transaction to **`Akashik.db`**, you will be presented with a high-fidelity "Black-Ice" Auth Pane.
- **`y` / `Enter`**: GRANTED — Commit the changes to the universal record.
- **`n` / `Esc`**: REJECTED — Rollback the transaction.

---
*Command and Control: 50V3R31GN-M4CH1N4 v3.2.6 Hardened.*
