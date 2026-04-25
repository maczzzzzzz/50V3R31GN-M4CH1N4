# Phase 3: Unified Strategic Oracle Implementation Plan (v3.8.0)
**Goal:** Consolidate world state and history into a queryable SQLite data plane.
**Status:** ACTIVE

## Task 3.1: UnifiedStrategic OracleClient Scaffolding
- **Objective:** Create `src/db/unified-oracle-client.ts` implementing the new `ATTACH DATABASE` logic.
- **TDD:** Write unit tests to verify that `ATTACH` correctly links `world.db` and a mock `crush.db`.
- **Success:** Queries can successfully JOIN tables across both files.

## Task 3.2: Hybrid RKG Schema
- **Objective:** Implement the dual-layer schema (Structured + Dynamic) in `src/db/world-schema.sql`.
- **TDD:** Verify idempotent initialization and FTS5 indexing for the `triplets` table.
- **Success:** CRUD operations work for both high-frequency NPC stats and dynamic lore triplets.

## Task 3.3: Validated World Commands
- **Objective:** Create `src/shared/schemas/world-commands.schema.ts`. Implement the Zod-based dispatcher for AI-initiated state changes.
- **TDD:** Pass 50 malformed JSON commands to the dispatcher; verify 100% rejection rate for invalid data types or non-existent entities.
- **Success:** Backend correctly rejects "Hallucinated" updates.

## Task 3.4: "World Pulse" Grounding Integration
- **Objective:** Update `HybridRoutingController` to execute the pre-response grounding flow.
- **TDD:** Verify that the system prompt correctly includes the most up-to-date stats for NPCs mentioned in the user message.
- **Success:** Zero narrative drift in simulated chat sessions.

## Task 3.5: Legacy Purge (Phase B) & Refactoring
- **Objective:** Delete `NitroDbClient` and refactor all consumers (`NightMarketService`, `MCP:nitro-db`) to use the `UnifiedStrategic OracleClient`.
- **Cleanup:** Remove the last remaining references to `pg` or `pgvector`.
- **Success:** 274/274 baseline tests passing with the new backend.


---
**LINKS:** [[OS_CORE]]
