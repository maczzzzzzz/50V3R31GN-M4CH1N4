# User Guide: Crush CLI (The Control Plane)

**Version:** 3.2.9
**Role:** Primary Human Interface for 50V3R31GN-M4CH1N4

---

## 🏁 Overview
The **Crush CLI** is your physical cockpit. While the **Nucleus Web Deck** provides high-fidelity visualization, the CLI provides the underlying Artery and surgical command tools for world-state shifts and physical materializations.

## ⚡ Core Operations

### 1. The Nucleus Artery
- **`npm run crush nucleus`**: Starts the Protobuf-over-WebSocket bridge. This is the MANDATORY first step for every session.
- **`http://localhost:3030`**: The URL for the WebGL Command Deck.

### 2. Sidecar Management (Headless)
As of Phase 50, sidecars are typically run as headless daemons supervised by the Nucleus Artery:
- **`npm run hub:headless`**: Starts the Cyberdeck HUD in the background.
- **`npm run atlas:headless`**: Starts the Atlas Radar in the background.

### 3. Intelligence Forge (Phase 52+)
- **`npm run forge:skills`**: Starts the **Skill Factory** to scan session logs for successful patterns and propose new `SKILL.md` shards.
- **`npm run harmonize`**: (High Performance) Uses `fast-reconstruct.py` to synchronize 20k+ Obsidian files in <5 seconds.
- **`npm run pulse`**: Executes a one-time world heartbeat advance.

### 4. Vault Security
- **`./crush-cli vault seal <path>`**: Encrypts cleartext docs into steganographic PNG shards.
- **`./crush-cli vault open <path>`**: Decrypts shards back into cleartext.
- **`./crush-cli sovereign-mode [on|off]`**: Toggles God-Mode (Bypass Rules Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle).

## 🛡️ The 2-of-2 Authorization Gate (Flush Gate)
No world-state change occurs without your physical `ACK`. You can approve transactions via the **Nucleus Deck UI** or the CLI Auth Pane.
- **`[ACKNOWLEDGE]`** / **`y`**: GRANTED — Commit the changes to the universal record.
- **`[VETO]`** / **`n`**: REJECTED — Rollback the transaction.

---
*Command and Control: 50V3R31GN-M4CH1N4 v3.2.21 Hardened.*
