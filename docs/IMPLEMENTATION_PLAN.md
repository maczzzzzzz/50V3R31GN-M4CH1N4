# ASP.GM-Agent: Master Implementation Execution Plan
**Version:** 0.8.1 (Red Trade Stable)
**Target:** Phase 5 (Advanced Mechanics & Red Trade)
**Architecture:** 100% Local Split-Node (Rust/ZeroClaw + Node.js/Mistral-Nemo)
**Hardware:** Node A (Nitro 5 | Rules) | Node B (Main Rig | Orchestrator)

## 🗂️ PHASE 0-4: Foundation & Infrastructure
**Status:** COMPLETE ✅ (Finalized in v0.8.1)
- **ZeroClaw (Rust)**: Native Rules Authority deployed to Node A. FTS5 indexing fixed and verified.
- **ClawLink**: Persistent SSH Socket Bridge established (<10ms latency).
- **Unified Oracle**: Triple-SQLite data plane (`data/world.db`, `data/crush.db`, `rules.db`) established.
- **Technical Purge**: Legacy Postgres stack and Docker container deleted.
- **VRAM Insurance**: FP8 KV Caching active and verified on Node B.

---
## 🚀 PHASE 5: Advanced Mechanics (Red Trade & Pulse)
**Goal:** Expand the world with dynamic simulation, contraband economy, and automated character onboarding.
**Version:** v0.8.1
**Status:** IN PROGRESS (ACTIVE)

**Detailed Roadmaps:** 
- [Red Trade & Faction Matrix](docs/plans/2026-03-31-red-trade-economy-implementation.md) [COMPLETE ✅]
- [Immersive Terminal (Discord & Vision)](docs/plans/2026-03-31-immersive-terminal-implementation.md) [ACTIVE ⏳]
- [Conversational Onboarding (Fixer Interview)](docs/plans/2026-03-31-conversational-onboarding-implementation.md) [ACTIVE ⏳]
- [Inventory Atomic Transfer](docs/plans/2026-03-31-inventory-atomic-transfer.md) [SLATED 📅]

**Design Specs:** 
- [Red Trade Spec](docs/specs/2026-03-31-red-trade-economy-spec.md)
- [Immersive Terminal Spec](docs/specs/2026-03-31-immersive-terminal-spec.md)
- [Conversational Onboarding Spec](docs/specs/2026-03-31-conversational-onboarding-spec.md)

**Execution Steps:**
1. **RKG Schema Expansion (Task 1):** Add `factions`, `player_friends_enemies`, and `player_housing` tables to `world.db`. [COMPLETE ✅]
2. **Red Trade Economy:** Implement the `RedTradeService` for cargo generation and smuggling loops. [COMPLETE ✅]
3. **Pulse Engine:** Implement the background simulation for faction turf shifts and world advancement. [COMPLETE ✅]
4. **Immersive Terminal (Phase 5.2):** Implement Discord Webhook and Playwright Vision Bridge. [ACTIVE ⏳]
5. **Conversational Onboarding:** Build the "Fixer Interview" character creation wizard. [SLATED 📅]
6. **Braindance Therapy:** Implement the humanity/addiction recovery mechanics. [SLATED 📅]

---

## 🏙️ PHASE 6: The Living City
**Goal:** Final immersion layer with dynamic turf wars and computer vision.
**Version:** v0.9.0
**Status:** SLATED

---

## 🛑 THE QUARANTINE ZONE (Scope Creep Enforcement)
- **Computer Vision:** Map/wall generation from images (Phase 6).
- **AR HUD Overlays:** Floating combat barks (Phase 6).
- **Simulacrum Deep Memory:** Long-term cross-session NPC growth (v1.0.0).
- **Headquarters:** Base upgrades and Morale Boost logic (v1.0.0).
