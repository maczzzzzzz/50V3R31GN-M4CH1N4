# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-03-30

### Added
- **Story Engine Core**: Implemented a deterministic state machine on Node B for tracking narrative state (Arc, Beat, Event) based on the `kingbootoshi/story-engine` pattern.
- **Afterlife Night Market**: Implemented the `NightMarketService` on Node B with RAG-driven inventory querying from the `campaign_ttta` namespace.
- **Eagle Economy**: Added the "Eagle" conversion logic (100eb=0.5, 500eb=3, 1000eb=7.5) as defined in the TTTA spec.
- **GM Approval Queue**: Implemented a human-in-the-loop interceptor in `src/core/gm-approval-queue.ts` that pauses state mutations for GM confirmation.
- **Interactive Foundry UI**: Expanded `foundry-api-bridge.js` with native `Dialog` components for the Night Market storefront and the GM Approval flow.
- **Bridge Protocol Expansion**: Added `buy_item`, `approval_response`, `update_actor`, `queue_approval`, and `open_night_market` commands/events to the bridge protocol with strict Zod validation.
- **Campaign Registry**: `src/core/campaign-registry.ts` — `bootstrapTttaPart1()` registers the TttA Part 1 narrative beats (The Afterlife Meeting → The First Gig → The Job) and their deterministic Transition Guards into the StoryEngine.
- **E2E Session Loop Verification**: `tests/core/world-test-simulation.test.ts` — Full Phase Gate simulation covering Fixer gig dispatch, attack resolution (Beat 1→2 transition), Night Market purchase (Beat 2→3 transition), and all state assertions.
- **TDD Rigor**: Achieved 237 passing tests with new suites for all Phase 4 components.

### Changed
- Refactored `HybridRoutingController` to orchestrate the new E2E simulation loop (Gig -> Roll -> Trade -> Beat).
- Updated `FoundryAdapter` with `updateActor` and `openNightMarket` methods.

## [0.5.0] - 2026-03-30

### Added
- **Node A Remediation**: Restored Dockerized PostgreSQL connectivity, initialized pgvector schema, and enabled `vector`/`pgcrypto` extensions.
- **Rules Ingestion**: Successfully seeded 1,437 rule and lore chunks from Node B to Node A.
- **Node A Source Sync**: Synchronized `src/` to Node A, enabling remote execution of Rules Authority logic.
- **Zero-Trust Hardening**: Implemented manual Zod validation in `nitro-db` MCP server to ensure protocol integrity.
- **Phase 4 Pre-flight Audit**: Stabilized `phase4-preflight.ts` with local transport and better error handling; achieved 🟢 100% success rate.

### Changed
- Standardized environment variables across all scripts via `dotenv`.

## [0.4.0] - 2026-03-29

### Added
- `src/shared/schemas/story.schema.ts` — Zod schema for tracking narrative state.
- `src/core/story-engine.ts` — State machine scaffolding.
- `src/core/gm-approval-queue.ts` — Approval logic scaffolding.
- `src/core/night-market-service.ts` — Night Market logic scaffolding.

## [0.3.2] - 2026-03-29

### Added
- `src/shared/schemas/foundry-bridge.schema.ts` — Full Zod contract for the Phase 3 Foundry VTT bridge.
- `src/api/foundry-adapter.ts` — `FoundryAdapter` class.
- `src/core/ollama-client.ts` — Narrative Synthesis Client for Mistral-Nemo 12B.
- `src/core/hybrid-routing-controller.ts` — Orchestration loop for math and narrative routing.
- `foundry-module/` — Foundry VTT v12 module for the bridge.

## [0.1.0] - 2026-03-28

### Added
- Initial repository with Split-Node Architecture blueprints.
- Campaign seed data (Ticket to the Afterlife).
