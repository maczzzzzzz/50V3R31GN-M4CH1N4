# User Guide: Mission Swarm Orchestration

**Version:** 1.2.0
**Role:** Procedural Mission Generation & Tactical Analysis

---

## 🌌 The Mission Swarm
The **Mission Swarm** is a concurrent reasoning engine designed to generate high-fidelity, rules-correct Cyberpunk RED missions on the fly. It fuses hard rules data, tactical analysis, and deep lore into a single "Mission Blueprint."

### 🌌 The Synthesis Process:
1.  **Rules Intel (Node A)**: ZeroClaw dispatches a swarm task to calculate the appropriate DVs and encounter tables for a specific district.
2.  **Tactical Analysis (Node B)**: Mistral-Nemo performs a semantic analysis of the mission objective and provides a narrative tactical overview.
3.  **Lore Anchor Fusion**: The engine queries **`crush.db`** for recent NPC messages and events, ensuring the mission feels grounded in your session history.

---

## ⚡ How to Trigger
Use the Crush CLI command:
```bash
/generate mission [District]
```
*Example:* `/generate mission Watson`

---

## 🛠️ Tactical Output
The Swarm will provide a blueprint containing:
- **Objective**: The primary narrative goal.
- **Rules Intel**: Exact DVs for common tasks (e.g., Security, Netrunning).
- **Lore Anchors**: NPCs and locations you've interacted with recently.
- **Atmosphere**: A lighting and CSS "glitch" configuration for the Neural Painter.

---
*Mission Swarm: Recursive Reasoning Online.*
