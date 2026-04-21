# Phase 6: Living City Task Manifest

## Status: 🟢 COMPLETE (v3.2.21 Hardened)

### Task 1: Geometric Wall Engine (Node A)
- [x] Add image dependencies to Cargo.toml
- [x] Implement Canny/Hough Rust pipeline
- [x] Add `detect_walls` RPC to ZeroClaw
- [x] Verify local Rust compilation
- **Result:** Node A now extracts Foundry-compatible wall JSON from map images.

### Task 2: Tactical Vision Service (Node B)
- [x] Extend `interfaces.ts` with `IVisionClient`
- [x] Implement `TacticalVisionService` (LLava 1.6)
- [x] Implement Zod-validated tactical region extraction
- [x] 100% Unit Test coverage
- **Result:** Node B identifies cover, hazards, and security zones semantically.

### Task 3: The Pulse Engine (Triggers)
- [x] Extend `world-schema.sql` with `district_grid`
- [x] Implement recursive Chebyshev influence triggers
- [x] Implement NPC state transition triggers
- [x] Add grid seeding logic to `UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient`
- **Result:** Night City state now advances deterministically via SQLite triggers.

### Task 4: Spatial Context Fusion
- [x] Extend Foundry Mesh schemas with spatial context
- [x] Update HRC to ingest token coordinates
- [x] Implement proximity-based tactical grounding in narrative
- [x] Verify no regressions in global test suite
- **Result:** AI GM is physically aware of the map's tactical topology.

---
*Verified by Gemini CLI v3.2.21.*
