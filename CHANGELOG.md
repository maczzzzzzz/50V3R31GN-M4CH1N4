# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-03-31

### Added
- **Faction Relationship Matrix** (`world.db`): `factions` table (relationship_score −10…+10, friction_pool 0…10) and `player_friends_enemies` table.
- **Cargo Manifest Generator** (`RedTradeService`): Reads raw TTTA/Mooks JSON data, classifies items into `data_runner`, `scarcity_goods`, `military_gear` categories with lore-accurate buyer/rival factions.
- **Friction Engine & Heat Clock** (`rollFriction`): 1d10 + friction → `bark` / `gate` / `ambush` outcome tiers; `red_trade_transit` inbound event wired into `HybridRoutingController`.
- **Red Trade One-Shot Arc** (`campaign-registry.ts`): `bootstrapRedTrade` / `createRedTradeInitialState` — 3-beat arc (Fixer Call → Transit → Handoff) with faction-gated delivery guard.
- **Pulse Engine & Cryotank Skip** (`PulseEngine`): `timeSkip(actorId, months)` — rent debt calculation, eviction to "street" tier, Punitive BD rolls (Humanity + Addiction) dispatched to Node A.
- **Player Housing Schema** (`world.db`): `player_housing` table (`housing_tier`, `monthly_rent_eb`, `eb_balance`) with full CRUD helpers on `UnifiedOracleClient`.

### Fixed
- `HybridRoutingController.applyWorldPulseGrounding`: replaced dead `!this.unifiedOracle` null-check with live `!this.unifiedOracle?.isConnected()` guard to prevent TypeError when Oracle is disconnected at prompt time.

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
