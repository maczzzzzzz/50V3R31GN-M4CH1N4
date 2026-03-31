# ASP.GM-Agent: Master Implementation Execution Plan
**Version:** 0.8.3 (Phase 5 Complete)
**Target:** Phase 6 (The Living City)
**Architecture:** 100% Local Split-Node (Rust/ZeroClaw + Node.js/Mistral-Nemo)
**Hardware:** Node A (Nitro 5 | Rules) | Node B (Main Rig | Orchestrator)

## 🗂️ PHASE 0-5: Foundation & Advanced Mechanics
**Status:** COMPLETE ✅ (Finalized in v0.8.3)
- **ZeroClaw (Rust)**: Native Rules Authority deployed to Node A.
- **ClawLink**: Persistent SSH Socket Bridge established (<10ms latency).
- **Unified Oracle**: Triple-SQLite data plane (`data/world.db`, `data/crush.db`, `rules.db`) established.
- **Red Trade**: Smuggling economy and Faction Matrix implemented.
- **Terminal**: Immersive vision-aware solo interface active.
- **Onboarding**: Conversational "Fixer Interview" character creation active.

---

## 🏙️ PHASE 6: The Living City
**Goal:** Final immersion layer with dynamic turf wars and computer vision.
**Version:** v0.9.0
**Status:** IN PROGRESS (ACTIVE)

**Detailed Roadmap:** [docs/plans/2026-03-31-living-city-implementation.md](docs/plans/2026-03-31-living-city-implementation.md)
**Design Spec:** [docs/specs/2026-03-31-living-city-spec.md](docs/specs/2026-03-31-living-city-spec.md)

**Execution Steps:**
1. **Geometric Wall Engine (Task 1):** Implement Rust-native Canny edge detection on Node A.
2. **Tactical Region Intelligence:** Implement LLava-based semantic object identification on Node B.
3. **The Pulse Engine:** Background world state simulation (Faction turf shifts).
4. **Spatial Grounding:** AI awareness of battle map Scene Regions.
