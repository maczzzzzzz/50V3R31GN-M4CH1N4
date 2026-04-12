# Deep Research Analysis: Phase 5 (Red Trade) & Phase 6 (Living City)
**Date:** Sunday, March 29, 2026
**Subject:** Advanced Simulation Hardening & Open-World Persistence

## 1. Executive Summary
This research synthesizes architectural lessons from the deprecated `openclaw-cpr` repo with new 2026 technical data to blueprint the final phases of the 50V3R31GN-M4CH1N4. Phase 5 (Red Trade) focuses on a persistent, algorithmic economy, while Phase 6 (Living City) implements a faction-driven territory and reputation system.

## 2. Phase 5: Red Trade (The Persistent Economy)
Unlike the monolithic predecessor which used ephemeral JSON objects, Phase 5 will implement a **Tap-Sink Algorithmic Economy** managed by Node B and validated by Node A.

### 2.1 The "Tap-Sink" Market Model
- **Taps (Input):** Mission rewards, scavenged contraband, and weekly vendor restocks (Sunday Reset).
- **Sinks (Output):** Living expenses, ammo consumption, and Afterlife service fees.
- **Persistence:** Market inventory is stored in the local Crush SQLite session. If a unique item is purchased, it is removed globally from that vendor's state.

### 2.2 Dynamic Pricing Logic
We will adopt a **Supply-Demand Discovery algorithm** for Phase 5:
- **Algorithm:** $Price = Base \times (1 + k \cdot \frac{Demand - Supply}{Supply})$.
- **Node Interaction:** Node B tracks transaction volume (Demand); Node A executes the math to return the new price during the Sunday Reset.
- **Contraband:** Items tagged as `Illegal` carry a "Heat Multiplier" that increases the chance of Bounty Hunter events (see Phase 4 Blueprint).

---

## 3. Phase 6: Living City (The Pulse Engine)
Phase 6 replaces the old repo's random table rolls with a **Temporal State Machine** that simulates active faction warfare and territory shifts.

### 3.1 Faction Standing (Reputation 2.0)
We will move beyond global Reputation to a granular **Faction Standing (1–10)** system:
- **Recognition Roll:** Encountering an NPC triggers a Node A roll (`1d10 <= Standing`).
- **Mechanical Effects:** High Standing (7+) grants "Backup" (Lawman-style) and access to Faction-exclusive Night Markets. Negative Standing triggers hostile ambushes.

### 3.2 Dynamic Turf (Foundry Scene Regions)
Phase 6 leverages the **Foundry VTT v12 Scene Regions API** for territory management:
- **Turf Ownership:** Scenes are mapped with "Region Documents" flagged with `ownerFaction`.
- **The Pulse:** Every Sunday Reset, Node B simulates a "Faction Move" (e.g., Arasaka invades Maelstrom turf in Westbrook).
- **Automation:** Entering a rival faction's "Turf Region" triggers a `tokenEnter` hook that alerts Node B to potentially spawn hostile guards from the `entities_mooks` namespace.

---

## 4. Integration & Technical Constraints
- **Hardware Split:** All simulation "Cycles" (Economy restocks, Faction moves) run on Node B's workstation to preserve Node A's VRAM for active gameplay math.
- **Zod Enforcement:** All economy and faction updates are validated via Zod before committing to the local SQLite state.
- **Crush Integration:** Faction Standing and Market Inventory are mapped to the Crush `session_metadata` to ensure multi-agent consistency.

## 5. Conclusion
Phases 5 and 6 shift the project from a "Game Assistant" to a "World Simulator." By grounding the economy in Tap-Sink math and the city in Scene Regions, we fulfill the **Immersion Mandate** while maintaining 100% local stability.

**Quarantine Status:** These systems remain quarantined. Implementation starts only after Phase 4 MVP Sign-off.
