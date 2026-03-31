# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-03-31

### Added
- **Red Trade Economy (Phase 5.1)**: Implemented the smuggling engine with lore-accurate cargo generation from TTTA and Mook Pack datasets.
- **Faction Relationship Matrix**: Added dynamic relationship tracking (-10 to +10) and Friction Pool logic to `world.db`.
- **Pulse Engine**: Background simulation loop for faction turf shifts and world state advancement.
- **Housing System**: Implemented housing tiers (Street to Luxury) with automated rent deduction and eviction logic.
- **Cryotank Skip**: Narrative and mechanical "jail" consequence using Punitive BD checks on Node A.

### Fixed
- **FTS5 Index Sync**: Resolved critical issue where ZeroClaw search returned empty results by manually syncing the FTS5 index during import.
- **Grounding Safety**: Hardened `HybridRoutingController` to prevent crashes when the Unified Oracle is uninitialized.

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
