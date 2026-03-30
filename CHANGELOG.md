# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-03-30

### Added
- **Node A Remediation**: Restored Dockerized PostgreSQL connectivity, initialized pgvector schema, and enabled `vector`/`pgcrypto` extensions.
- **Rules Ingestion**: Successfully seeded 1,437 rule and lore chunks from Node B to Node A.
- **Node A Source Sync**: Synchronized `src/` to Node A, enabling remote execution of Rules Authority logic.
- **Zero-Trust Hardening**: Implemented manual Zod validation in `nitro-db` MCP server to ensure protocol integrity.
- **Phase 4 Pre-flight Audit**: Stabilized `phase4-preflight.ts` with local transport and better error handling; achieved 🟢 100% success rate.

### Changed
- Updated `HybridRoutingController` to orchestrate Phase 4 loops (Buys, Beats, Approvals).
- Standardized environment variables across all scripts via `dotenv`.

## [0.4.0] - 2026-03-29

### Added
- `src/shared/schemas/story.schema.ts` — Zod schema for tracking narrative state (Arc, Beat, Event, worldState, eagleBalance).
- `src/core/story-engine.ts` — Deterministic state machine controller for narrative transitions based on mechanical events.
- `src/core/gm-approval-queue.ts` — Human-in-the-loop interceptor for critical state changes (Node B -> Foundry -> GM UI -> Node B).
- `src/core/night-market-service.ts` — RAG-powered vendor inventory generator with Ticket to the Afterlife "Eagle" pricing logic.
- Expanded `src/shared/schemas/foundry-bridge.schema.ts` with Phase 4 protocol: `buy_item`, `approval_response` (Events), and `update_actor`, `queue_approval` (Commands).
- `updateActor` implementation in `FoundryAdapter` and `foundry-api-bridge.js`.
- GM Approval Dialog UI in `foundry-api-bridge.js`.
- TDD suites for all Phase 4 components: `story.schema.test.ts`, `gm-approval-queue.test.ts`, `story-engine.test.ts`, `night-market-service.test.ts`, and expanded `hybrid-routing-controller.test.ts`.

## [0.3.2] - 2026-03-29

### Added
- `src/shared/schemas/foundry-bridge.schema.ts` — Full Zod contract for the Phase 3 Foundry VTT bridge.
- `src/api/foundry-adapter.ts` — `FoundryAdapter` class (Palantiri-style reverse proxy).
- `src/core/ollama-client.ts` — Narrative Synthesis Client for Mistral-Nemo 12B.
- `src/core/hybrid-routing-controller.ts` — Orchestration loop for math and narrative routing.
- `foundry-module/` — Foundry VTT v12 module for the bridge.

## [0.3.1] - 2026-03-29

### Added
- `src/core/nitro-logic-client.ts` — OpenAI-compatible bridge to Node A rules engine.
- TDD tests for Rules Authority logic.

## [0.3.0] - 2026-03-29

### Added
- MCP Servers for `nitro-db` and `nitro-logic`.
- `SeedOrchestrator` for population of Node A pgvector database.
- `OllamaEmbeddingService` for Node B local vector generation.

## [0.2.0] - 2026-03-28

### Added
- Zod schemas for all Foundry VTT document types (Actor, Item, Scene, Journal, RollTable).
- TypeScript project scaffolding and Vitest configuration.

## [0.1.0] - 2026-03-28

### Added
- Initial repository with Split-Node Architecture blueprints (CLAUDE.md, KNOWLEDGE_BASE.md).
- Campaign seed data (Ticket to the Afterlife).
