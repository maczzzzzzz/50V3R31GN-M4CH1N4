# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
