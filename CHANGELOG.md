# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.2] - 2026-03-30 — Project Black-Ice: Phase A Legacy Purge

### Removed
- **`src/db/schema.sql`** — Postgres DDL artifact. Replaced by `zeroclaw/src/db/schema.rs`.
- **`src/db/seed/`** — Entire Postgres ingestion pipeline (7 files: ChunkInserter, ChunkTextSplitter, PdfFileParser, TxtFileParser, FoundryJsonParser, SeedOrchestrator, interfaces). Superseded by `zeroclaw import`.
- **`tests/db/seed/`** — 5 corresponding test files (92 tests removed).
- **`src/scripts/run-seed.ts`** — Postgres seed entry point. Migration path is now `port-to-zeroclaw.ts`.
- **`src/scripts/health-check.ts`** — Postgres health-check script. Replaced by `ClawLinkClient.isHealthy()`.
- **Test count:** 274 → 182 (delta = deleted seed tests only, zero regressions).

### Note
Phase B gate pending: `port-to-zeroclaw.ts` execution + `zeroclaw import` on Node A confirmation before removing `pg`/`pgvector`/`NitroDbClient`.

## [0.7.1] - 2026-03-30 — Project Black-Ice: Phase 2 ClawLink SSH Bridge

### Added
- **ClawLink TCP Server** (`zeroclaw/src/server/`): Rust tokio TCP server binding to `127.0.0.1:{port}` (default 7878). Accessible only via SSH tunnel. Handles one client (Node B) with a persistent connection.
  - `rpc.rs`: `RpcRequest` / `RpcResponse` newline-delimited JSON types. `RpcResponse::ok` / `::err` constructors that use `skip_serializing_if` to omit absent fields. 6 `#[test]` functions.
  - `handler.rs`: Routes `ping`, `hybrid_search`, `resolve_attack`, `resolve_damage` to ZeroClaw subsystems. Guard-validates empty inputs. 8 `#[test]` functions.
  - `mod.rs`: TCP accept loop, per-connection thread, `dispatch()` with structured error logging. 4 `#[test]` functions.
- **`zeroclaw serve` subcommand**: `--db` + `--port` flags. Opens rules.db, wraps Connection in `Arc<Mutex>`, starts ClawLink server.
- **`ClawLinkClient`** (`src/api/clawlink-client.ts`): SSH tunnel + JSON-RPC client. Ed25519 key auth, `directTcpip` channel forwarding, pending-request correlation by UUID, chunked data reassembly, per-request timeout, `SshClientFactory` injection for testability.
- **`IClawLinkClient` interface**: `connect`, `disconnect`, `isHealthy`, `hybridSearch`, `resolveAttack`, `resolveDamage`.
- **Zero-Trust schemas** (`src/shared/schemas/clawlink.schema.ts`): `ClawLinkConfigSchema`, `ClawLinkRpcResponseSchema`, `ClawLinkSearchResultSchema`, `ClawLinkAttackResultSchema`, `ClawLinkDamageResultSchema` — all Node A responses validated before use.
- **`ssh2` dependency**: `ssh2@^1.0.0` + `@types/ssh2` added for persistent SSH tunneling.
- **TDD**: 274 passing TypeScript tests (+24 ClawLink). Rust server carries 18 inline `#[test]` assertions.

## [0.7.0] - 2026-03-30 — Project Black-Ice: Phase 1 ZeroClaw Core

### Added
- **ZeroClaw Rust Project** (`zeroclaw/`): Rust-native Rules Authority binary targeting Node A. Release profile: `opt-level="z"`, `lto=true`, `strip=true` for <5MB footprint.
- **vec0 Schema** (`zeroclaw/src/db/schema.rs`): `chunks` metadata table + `chunks_embedding` vec0 virtual table (float[768]) + `chunks_fts` FTS5 index + namespace/chunk_index indexes. Idempotent `init()`.
- **Import Pipeline** (`zeroclaw/src/db/import.rs`): `run(conn, path)` reads `.zeroclaw.json` exports, validates version/dimensions/chunk_count, upserts to both `chunks` and `chunks_embedding` via shared rowid. Idempotent ON CONFLICT UPDATE.
- **Hybrid Search** (`zeroclaw/src/db/search.rs`): `hybrid_search(conn, query, namespace, top_k)` fuses FTS5 BM25 candidate recall (50 candidates) with vec0 cosine similarity. Score: `0.4×norm_bm25 + 0.6×cosine`. Zero-Trust namespace isolation at SQL level.
- **Interlock Math Engine** (`zeroclaw/src/math/interlock.rs`): Pure deterministic Cyberpunk RED Interlock System — `resolve_roll` (d10 + crit chain), `resolve_attack` (roll+stat+skill vs. DV), `resolve_damage` (dice+bonus−SP), `ranged_dv` table. 15 `#[test]` functions.
- **ZeroClaw Export Schema** (`src/shared/schemas/zeroclaw-export.schema.ts`): Zod contracts for the `.zeroclaw.json` format (`ZerocrawlChunkSchema`, `ZerocrawlExportSchema`). Exported from shared schema index.
- **PostgresExporter** (`src/db/postgres-exporter.ts`): DI-injectable exporter. `serializeVector` (LE float32 → base64), `parseVectorString` (pgvector text format), `buildExport` (queries `pdf_chunks`, validates via Zod), `writeExport` (writes JSON). 13 Vitest tests.
- **Migration Entry Point** (`src/scripts/port-to-zeroclaw.ts`): CLI script — reads `DATABASE_URL`, calls `PostgresExporter.writeExport()`, reports count. Idempotent re-run safe.
- **TDD Rigor**: 250 passing TypeScript tests. Rust modules carry inline `#[test]` suites (schema: 4, import: 4, search: 6, interlock: 15).

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
