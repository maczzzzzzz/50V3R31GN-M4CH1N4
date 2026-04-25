# Design Specification: Phase 8 — Synthetic Sovereignty (v3.8.0)
**Subject:** The Night City Dashboard (Foundry Sidebar) & Autonomous World Engine
**Status:** DESIGN FINALIZED (Brainstorm Hardened)

## 1. Executive Summary
Phase 8 introduces the first dedicated UI for the 50V3R31GN-M4CH1N4 inside Foundry VTT: the **Night City Dashboard**. This sidebar bridges the visual gap between the Crush CLI and the virtual tabletop, providing a high-density "Terminal" view of actor vitality, faction territory, and system control. Simultaneously, the "Synthetic Sovereignty" engine is activated, giving NPCs autonomous movement and agenda-driven behavior in the background.

## 2. Technical Architecture: The Dashboard Sidebar
The Dashboard is implemented as a custom `SidebarTab` within the Foundry Mesh Module.

### 2.1 Aesthetic Invariants (The Terminal Feel)
- **Theme:** Afterlife / Crush CLI Resemblance.
- **Visuals:** `#050505` background, Neon Green (`#39ff14`) and Alert Red (`#e64539`) accents.
- **UI Elements:** ASCII health bars, flickering armor icons, and scanline overlays.
- **Persistence:** Tab is registered globally and remains active during scene transitions.

### 2.2 Functional Zones
1. **Bio-Monitor (Top):** Real-time PC/NPC stats (HP, SP, Humanity).
2. **Pulse Monitor (Middle):** 10x10 CSS Grid heat-map of faction influence.
3. **Fixer Console (Bottom):** One-click terminal prompts for `/scan`, `/pulse`, and `/onboard`.

## 3. The Sovereignty Engine (Background Logic)
- **Autonomous Schedule Drift:** A background loop on Node B that triggers periodic NPC coordinate updates in `world.db` based on their faction goals (e.g. "Patrol", "Heist", "Hide").
- **Real-time Screamsheet Broadcasting:** Automated Discord Chronicler posts triggered by significant `district_grid` shifts.

## 4. Communication Protocol
- **Dashboard Sync Frame:** A new binary frame type `{ type: 'dashboard_sync', payload: { actors, factions, systemStatus } }`.
- **Latency Target:** Dashboard updates must complete in `<100ms` after any `world.db` mutation.


---
**LINKS:** [[OS_CORE]]
