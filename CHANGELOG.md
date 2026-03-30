# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-03-29

### Added

- `src/shared/schemas/foundry-bridge.schema.ts` — Full Zod contract for the Phase 3 Foundry VTT bridge: 5 command schemas (`chat_message`, `read_actor`, `simple_phone`, `dice_roll`, `scene_activate`), `BridgeCommand` / `BridgeResponse` discriminated unions, and `FoundryEvent` schemas for inbound Foundry → Node B events.
- `src/api/foundry-adapter.ts` — `FoundryAdapter` class: Node B WebSocket server (Palantiri-style reverse proxy). Accepts outbound connections from the Foundry bridge module, dispatches commands with `requestId` correlation, enforces `commandTimeoutMs`, Zod-validates all frames. `IFoundryAdapter` interface exported.
- `src/core/ollama-client.ts` — `OllamaClient` class: OpenAI-compatible HTTP client targeting Mistral-Nemo 12B via Ollama (`http://localhost:11434/v1`). `generateNarrative(prompt, context)` injects a GM system prompt and optional rules context. Zod response validation, configurable timeout with AbortController. `IOllamaClient` / `OllamaConfig` interfaces added to `src/core/interfaces.ts`.
- `src/core/hybrid-routing-controller.ts` — `HybridRoutingController` class: Phase 3 orchestration loop. Routes `resolve_attack` / `calculate_dv` / `oracle_roll` events to `NitroLogicClient` (Node A) then `OllamaClient` (Node B narrative), pushes result to Foundry chat via `FoundryAdapter`. Graceful Ollama fallback: if narrative synthesis fails, a plain-text math summary is pushed instead (Immersion Mandate).
- `foundry-module/module.json` — Foundry VTT v12 module manifest for `foundry-api-bridge`.
- `foundry-module/foundry-api-bridge.js` — ~170-line Foundry JS client: connects outbound to Node B, dispatches 5 MVP commands via `ChatMessage.create()`, `game.actors.get()`, `Roll.evaluate()`, `scene.activate()`. Includes exponential backoff reconnect logic and GM-only guard.
- `ws@^8.18.0` added to dependencies; `@types/ws@^8.5.0` added to devDependencies.
- TDD tests: `tests/api/foundry-adapter.test.ts` (lifecycle, 5 commands, requestId, timeout), `tests/core/ollama-client.test.ts` (config validation, isHealthy, generateNarrative — success/error/timeout/schema paths), `tests/core/hybrid-routing-controller.test.ts` (math routing, narrative routing, Ollama fallback, read_actor, unknown event).

## [0.3.2] - 2026-03-29

### Added

- `src/core/interfaces.ts` — Full type contracts for Phase 2: `NitroLogicConfig`, `INitroLogicClient`, `AttackResult`, `DvResult`, `OracleResult`, and all input param types.
- `src/core/nitro-logic-client.ts` — `NitroLogicClient` implementation: OpenAI-compatible HTTP bridge to Node A's llama.cpp. Enforces `temperature:0.0`, `top_k:1`, `seed:42`, `response_format:{type:"json_object"}`. Includes CoT system prompts with few-shot Cyberpunk RED exemplars for all three tools. Full Zod Zero-Trust response validation.
- `tests/core/nitro-logic-client.test.ts` — 23 TDD tests covering config validation, all three tools (hit/miss/error paths), Zod failure propagation, network errors, and request body assertions.
- `src/core/index.ts` — Public exports for all Phase 2 types and `NitroLogicClient`.

### Changed

- `src/mcp/nitro-logic/index.ts` — Replaced Phase 2 stubs with real `NitroLogicClient` calls. Added ANSI/Markdown result formatters (`formatAttackResult`, `formatDvResult`, `formatOracleResult`) for Crush CLI rendering. Added startup health check against Node A.

### Fixed

- Corrected `exactOptionalPropertyTypes` call-site errors for optional `rangeBand` and `context` parameters.

## [0.3.1] - 2026-03-29

### Added

- `src/scripts/run-seed.ts` entry point with throttled embedding (200ms batch delay).
- `nitro-db` MCP server with ANSI/Markdown formatting for Crush CLI.
- `nitro-logic` MCP server scaffolding with Phase 2 tool schemas (Zod validated).
- `.crush.json` official configuration for Charmbracelet Crush CLI.

### Changed

- Synchronized `run-seed.ts` schema initialisation with `schema.sql` (UUID keys, HNSW indexes).
- Verified 100% pass rate for the complete Phase 1 test suite (151 tests).

## [0.3.0] - 2026-03-29

### Added

- `src/scripts/run-seed.ts` — CLI entry point that wires all dependencies and executes `SeedOrchestrator` to populate Node A's pgvector database. Includes schema initialisation (`CREATE TABLE IF NOT EXISTS pdf_chunks`), health check gate, `ThrottledEmbeddingService` (200ms inter-batch delay), and structured JSON logging.
- `src/mcp/nitro-db/index.ts` — `nitro-db` MCP server (stdio transport). Exposes `rag_query` tool with namespace isolation; returns ANSI/Markdown-styled results for Crush CLI Glamour rendering.
- `src/mcp/nitro-logic/index.ts` — `nitro-logic` MCP server (stdio transport, Phase 2 stub). Full tool schemas defined for `resolve_attack`, `calculate_dv`, and `oracle_roll`. Returns informative Phase 2 stub responses until `NitroLogicClient` is implemented.
- `.crush.json` — Crush CLI project config wiring both MCP servers (`nitro-db`, `nitro-logic`) via stdio and declaring the Ollama Node B provider block.
- `npm run seed` and `npm run health-check` scripts in `package.json`.

## [0.3.0] - 2026-03-29

### Added

- Implementation of `NitroDbClient` for Node A pgvector connectivity.
- `OllamaEmbeddingService` for Node B local vector generation.
- `FoundryJsonParser` and `TxtFileParser` for Phase 1 data ingestion.
- `src/scripts/health-check.ts` for end-to-end split-node handshake verification.
- Research logs for Crush/Catwalk MCP integration and Phase 1/2 roadmap.
- Architectural audit reports for verified Phase 0/1 progress.
- Formal collaborative authorship documentation in README and package.json.

### Changed

- Refactored `pdf_chunks` schema to include mandatory Metadata Mandate fields (`source_ref`, `context_type`, `capability_req`).
- Updated all parsers and DB search logic to enforce metadata isolation.
- Mandated `Co-Authored-By` trailers in Git protocol (`CLAUDE.md`).
- Uniformized project-wide documentation formatting.

## [0.2.0] - 2026-03-28

### Added

- TypeScript project configuration (ES2022, Node16, strict mode)
- Vitest test harness configuration
- Source tree scaffolding (src/api, src/core, src/db, src/mcp, src/shared)
- Zod schemas for all Foundry VTT document types:
  - Actor (character/mook stats, derived stats, wound states, role info)
  - Item (gear, skill, with extensible base for weapon/cyberware/armor)
  - Scene (maps with walls, lights, tiles, tokens, environment, fog)
  - JournalEntry (multi-page HTML content)
  - RollTable (formula, weighted results with ranges)
- Common Foundry sub-schemas (_stats, flags, ownership, source, base document)
- PDF chunk schema for Phase 1 ingestion pipeline contract
- Node A response schemas for zero-trust validation (roll results, RAG queries, errors)
- Inferred TypeScript types from all Zod schemas
- 24 tests validating schemas against real seed data from docs/raw_data/

## [0.1.0] - 2026-03-28

### Added

- Initial repository with project documentation
- CLAUDE.md — master architecture directives (Split-Node Local Architecture v4.0)
- KNOWLEDGE_BASE.md — dependency registry and core system rules
- Campaign seed data (Ticket to the Afterlife) — items, journals, entities
- Core rules reference data (PDFs, JSON)
- .gitignore for Node.js/TypeScript project
