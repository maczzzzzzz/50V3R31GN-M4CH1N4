# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-04-02
### Added
- **Black-Ice CSS Layer (Phase 8.1)**: Established a new `black-ice` CSS @layer for Foundry VTT v12. Redefined signature Cyberpunk RED palette (Cyan #00f3ff, Deep Void #050505) and applied tactical text glows to character names and headers.

Co-authored-by: Gemini CLI <gemini-cli@google.com>
Co-authored-by: maczzzzzzz <https://github.com/maczzzzzzz>

## [1.0.0] - 2026-04-02
### Added
- **The Swarm Oracle**: Refactored Node A (Rust) to handle concurrent, isolated math resolution tasks using `tokio::spawn`.
- **Rules Constitution**: Implemented `RED_RULES.md` as a global physics invariant injected into the Rules Oracle prompt.
- **Search-and-Extract Context**: New `RulesGrepService` for precision rulebook lookups, replacing broad vector RAG for mechanical grounding.
- **The Flush Gate**: Implemented atomic `IMMEDIATE` transactions in the Unified Oracle for crash-safe world-state persistence.
- **Dice So Nice Sync**: Fully synchronized 3D dice visuals in Foundry VTT for all AI GM rolls.

## [0.9.2] - 2026-04-01
### Added
- **Project "Eyes-On" (Phase 6)**: Dual-node computer vision pipeline (Rust geometric pass + TS semantic pass).
- **Pulse Engine (Deterministic Simulation)**: Recursive SQLite triggers for faction influence propagation.
- **VRAM Hardening**: Optimized Node B for 32k context window on 16GB hardware.
- **Binary Transport**: Persistent TCP sockets (ClawLink) replacing legacy HTTP/SSH transport.

## [0.8.3] - 2026-03-31

### Added
- **Conversational Onboarding (Phase 5.3)**: Fixer Interview system for character creation.
  - `OnboardingController`: 6-state machine (INITIAL→VIBE_CHECK→LIFEPATH→STATS→REVIEW→FINALIZED). Lifepath tables rolled via nitro-logic `oracleRoll("1d10")` on Node A; Mistral-Nemo generates in-character interview dialogue on Node B.
  - RKG persistence: Lifepath-discovered NPCs (friend + enemy) written to `world.db` (`npcs` → `player_friends_enemies`) with FK ordering guaranteed.
  - `create_actor` Foundry bridge command: `CreateActorPayload` (name, role, stats, bio, seedItems); Foundry-side `Actor.create()` with Cyberpunk RED stat mapping, bio journal entry, and world-item seeding.
  - `HybridRoutingController.handleOnboard()`: Full pipeline dispatcher — interview → Lifepath rolls → stat distribution → `createActor` → Discord Screamsheet bark.
  - Character builds: Standard (62-point) and Major League (80-point) stat distributions.

## [0.8.2] - 2026-03-31

### Added
- **Discord Chronicler (Phase 5.2)**: New `discord-chronicler` MCP server exposing `screamsheet_post` tool. Broadcasts state-mutation events (purchases, friction escalations, story transitions) to Discord via webhook with persona routing (NCPD Scanner / Street Rumor / Netwatch Alerts).
- **Optical Bridge (Phase 5.2)**: `SpatialVisionService` connects to Chrome via Playwright CDP, captures the Foundry VTT `#canvas`, and pipes the screenshot to Node B's Llava 7B model for tactical map analysis. Returns a structured `VisualTacticalContext`.
- **`/scan` Command (Phase 5.2)**: `HybridRoutingController.handleScan()` orchestrates the full Playwright → Llava → RKG Grounding → Foundry chat pipeline for real-time spatial awareness.
- **`playwright-core` dependency**: Added to support the Optical Bridge CDP browser connection.

## [0.8.1] - 2026-03-31

### Added
- **Red Trade Economy (Phase 5.1)**: Implemented the smuggling engine with lore-accurate cargo generation from TTTA and Mook Pack datasets.
- **Faction Relationship Matrix**: Added dynamic relationship tracking (-10 to +10) and Friction Pool logic to `world.db`.
- **Pulse Engine**: Background simulation loop for faction turf shifts and world state advancement.
- **Housing System**: Implemented housing tiers (Street to Luxury) with automated rent deduction and eviction logic.
- **Cryotank Skip**: Narrative and mechanical "jail" consequence using Punitive BD checks on Node A.

### Fixed
- **FTS5 Index Sync (Node A)**: Resolved critical issue where ZeroClaw search returned empty results by manually syncing the FTS5 index during import.
- **FTS5 Sync Triggers (Node B)**: Added automatic synchronization triggers to `world-schema.sql` to ensure lore triplets are immediately searchable via FTS5.
- **Persistence Architecture**: Established canonical `./data/` directory for SQLite databases and updated `nitro-db` defaults.
- **Grounding Safety**: Hardened `HybridRoutingController` to prevent crashes when the Unified Oracle is uninitialized.
- **Version Synchronization**: Unified all manifests and documentation to v0.8.1 (Red Trade Stable).

## [0.8.0] - 2026-03-31

### Added
- **Unified Oracle (Phase 3)**: Consolidated narrative truth and history onto Node B using a "Triple-SQLite" stack (`world.db`, `crush.db`, `rules.db`).
- **Hybrid RKG**: Implemented a Relational Knowledge Graph with structured NPC/Location stats and dynamic Triplet lore storage.
- **World Pulse Grounding**: Automated pre-response context injection that identifies entity mentions and prepends grounded truth (stats + history) to AI prompts.
- **Validated Command Pattern**: Zod-gated world state updates from AI to prevent narrative drift and state corruption.

### Changed
- **Infrastructure Finalization**: Completed the migration to Rust-native **ZeroClaw** on Node A and **ClawLink** persistent SSH bridge.
- **Legacy Purge**: Physically deleted all PostgreSQL/pgvector remnants, including `NitroDbClient`, `PostgresExporter`, and 1,100+ lines of legacy code.
- **Sub-10ms Latency**: Verified high-performance tool execution across the network bridge.

## [0.7.1] - 2026-03-30

### Added
- **ClawLink Bridge**: Persistent Socket-over-SSH transport layer targeting <10ms round-trip latency.
- **ZeroClaw RPC**: JSON-RPC 2.0 protocol implementation in Rust for high-speed mechanical resolution.
- **Project Black-Ice Scaffolding**: Rust-native rules authority with `sqlite-vec` support.

## [0.6.1] - 2026-03-30

### Added
- **Phase Gate E2E Simulation**: Full session loop verification (Fixer Gig -> Attack Resolution -> Story Advance -> Night Market Trade).
- **Campaign Registry**: Bootstrap logic for "Ticket to the Afterlife Part 1".

## [0.6.0] - 2026-03-30

### Added
- **Story Engine Core**: Deterministic state machine for tracking narrative state (Arc, Beat, Event).
- **Afterlife Night Market**: RAG-driven inventory querying and "Eagle" economy pricing logic.
- **Interactive Foundry UI**: Native Dialog components for Night Market and GM Approval flows.

## [0.5.0] - 2026-03-30

### Added
- **Node A Remediation**: Restored connectivity and initialized pgvector schema.
- **Rules Ingestion**: Seeded 1,437 rule and lore chunks to Node A.

## [0.1.0] - 2026-03-28

### Added
- Initial repository with Split-Node Architecture blueprints.
- Campaign seed data (Ticket to the Afterlife).
