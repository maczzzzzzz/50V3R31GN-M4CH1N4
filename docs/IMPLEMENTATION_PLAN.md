# ASP.GM-Agent: Master Implementation Execution Plan
**Version:** 0.8.0 (Living City Simulation)
**Target:** Phase 5 (Advanced Mechanics & Red Trade)
**Architecture:** 100% Local Split-Node (Rust/ZeroClaw + Node.js/Mistral-Nemo)
**Hardware:** Node A (Nitro 5 | Rules) | Node B (Main Rig | Orchestrator)

## 🗂️ PHASE 0-4: Foundation & Infrastructure
**Status:** COMPLETE ✅ (Finalized in v0.7.2)
- ZeroClaw (Rust) deployed to Node A.
- ClawLink (Persistent SSH Bridge) established.
- Unified Oracle (SQLite RKG) implemented on Node B.
- Data Migration (1,437 vectors) verified.
- Legacy Postgres/Docker stack purged.

---

## 🚀 PHASE 5: Advanced Mechanics (Red Trade & Pulse)
**Goal:** Expand the world with dynamic simulation, contraband economy, and automated character onboarding.
**Version:** v0.8.0
**Status:** IN PROGRESS (ACTIVE)

**Execution Steps:**
1. **Red Trade Economy:** Implement the "Street Economy" engine. Track contraband inventory, heat levels, and fixers across the RKG.
2. **Pulse Engine:** Implement the background simulation loop that advances world state (faction turf shifts, NPC movements) while the player is idle.
3. **Conversational Onboarding:** Build the "Fixer Interview" wizard for automated Character Creation and Lifepath mapping.
4. **Braindance Therapy:** Implement the humanity/empathy recovery loop and trauma tracking.

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
