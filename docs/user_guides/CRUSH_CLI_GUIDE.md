# User Guide: Crush CLI (The Control Plane)

**Version:** 1.2.0
**Role:** Primary Human Interface for ASP-GM-Agent

---

## 🏁 Overview
The **Crush CLI** is your physical cockpit. It provides direct, low-latency control over the Split-Node World Engine, allowing you to trigger rules resolutions, narrative shifts, and physical materializations.

## ⚡ Core Commands

### 1. General Control
- **`help`**: Displays the available command set.
- **`status`**: Checks the health of Node A (Rules Vault) and Node B (Director).
- **`clear`**: Clears the current session buffer.

### 2. Physical Materialization (The Architect Pass)
- **`/onboard [actor_id]`**: Triggers a conversational characterization for a new NPC and materializes their token in Foundry.
- **`/pulse`**: Advances the world clock by one "beat," triggering economic shifts and faction influence propagation.

### 3. Procedural Mission Engine (The Infinite Night)
- **`/generate mission [district_name]`**: Dispatches the **Mission Swarm** to synthesize a rules-correct mission blueprint, complete with tactical DVs and lore-anchored NPCs.

## 🛡️ The 2-of-2 Authorization Gate (Flush Gate)
No world-state change occurs without your physical `ACK`. When the system attempts to flush a transaction to **`Akashik.db`**, you will be presented with a summary.
- **`y`**: Commit the changes to the universal record.
- **`n`**: Reject and rollback the transaction.

---
*Command and Control: ASP-GM-Agent v1.2.0 Hardened.*
