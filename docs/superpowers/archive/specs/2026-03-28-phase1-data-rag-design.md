# Phase 1: Data & RAG (nitro-db) — Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Phase 4 MVP — No Creep Contract enforced
**Architecture:** Split-Node (Node A: Rules Authority | Node B: Orchestrator)

---

## Executive Summary

Build the full data ingestion pipeline and RAG query interface for the 50V3R31GN-M4CH1N4. Node B parses all seed data (5 PDFs, 478 JSON files, 136 text files), computes embeddings via Ollama (`nomic-embed-text`), and inserts chunks with vectors into Node A's PostgreSQL/pgvector database. The `nitro-db` MCP server exposes vector similarity search with namespace isolation for downstream consumers.

---

## 1. Technology Stack

| Tool | Version | Justification |
|------|---------|---------------|
| PostgreSQL | 16.x | Already installed on Node A (Nitro 5). |
| pgvector | 0.7+ | Vector similarity search extension for PostgreSQL. |
| pg (node-postgres) | ^8.x | Direct PostgreSQL client. No ORM — full pgvector control. |
| nomic-embed-text | latest | 768-dimension embedding model via Ollama on Node B. Small, fast, good retrieval quality. |
| pdf-parse | ^1.x | PDF text extraction. Lightweight, pure JS. |
| @modelcontextprotocol/sdk | ^1.x | MCP server framework (already installed in Phase 0). |

### Not included in Phase 1

- Prisma — pgvector support is experimental; raw `pg` gives full control.
- Worker threads — sequential ingestion is sufficient for a one-time 748-page pipeline.
- HTTP wrapper on Node A — direct PostgreSQL connection; `nitro-db` MCP server is the abstraction layer.

---

## 2. Artery of Truth Schema (Node A — PostgreSQL + pgvector)

Single table with namespace column for isolation:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id              SERIAL PRIMARY KEY,
  namespace       TEXT NOT NULL,
  source_file     TEXT NOT NULL,
  source_type     TEXT NOT NULL,
  section_heading TEXT NOT NULL,
  page_start      INTEGER,
  page_end        INTEGER,
  content         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL DEFAULT 0,
  token_estimate  INTEGER NOT NULL DEFAULT 0,
  embedding       vector(768) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_namespace ON chunks (namespace);

CREATE INDEX idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Design decisions

- **768 dimensions** — `nomic-embed-text` output size.
- **HNSW index** over IVFFlat — better recall at our data scale (thousands of chunks), no need to retrain after inserts.
- **`source_type` column** — values: `pdf`, `journal`, `actor`, `item`, `scene`, `roll_table`, `text`. Enables filtering queries by document type.
- **`namespace` column** — values: `core_rules`, `campaign_ttta`, `entities_mooks`. Isolation via WHERE clause, not separate tables.
- **Nullable `page_start`/`page_end`** — only meaningful for PDF-sourced chunks.

### Authorized namespaces (from CLAUDE.md Section 14)

| Namespace | Ingestion source | Usage |
|-----------|-----------------|-------|
| `core_rules` | `docs/raw_data/core_rules/*.pdf` | Foundational mechanics, combat math, skills |
| `campaign_ttta` | `docs/raw_data/campaign_ttta/**` (journals, items, scenes, roll tables, text) | Narrative campaign content, TttA house rules, locations |
| `entities_mooks` | `docs/raw_data/entities_mooks/**` (actor JSONs) | NPC/mook stat blocks for combat encounters |

---

## 3. Ingestion Pipeline (Node B)

Runs as a CLI script: `npm run ingest`

Three sequential stages:

### Stage 1: PDF Ingestion (5 PDFs → `core_rules`)

- Extract text page by page via `pdf-parse`
- Detect section headings from text structure (all-caps lines, known heading patterns from the coverage map)
- Chunk by section with ~500 token target size and ~50 token overlap for context continuity
- Validate every chunk through `PdfChunkSchema` (defined in Phase 0)
- Generate coverage report confirming all 748 pages are represented

### Stage 2: JSON Document Ingestion (478 JSON + 136 TXT → `campaign_ttta` + `entities_mooks`)

| Source | Count | Strategy | Namespace |
|--------|-------|----------|-----------|
| Journals | 42 entries (179 pages) | Extract `text.content`, strip HTML, chunk long pages | `campaign_ttta` |
| Actors | 155 | Serialize key fields (name, stats, role, description, items) → one chunk per actor | `entities_mooks` |
| Items | 191 | Serialize name, type, description, price, stats → one chunk per item | By source directory |
| Scenes | 41 | Extract name, description, token list → one chunk per scene | `campaign_ttta` |
| Roll Tables | 49 | Serialize formula + results as readable text → one chunk per table | `campaign_ttta` |
| Pre-extracted text | 136 | Already clean text from journals — chunk directly | `campaign_ttta` |

### Stage 3: Embedding + Insert

- Batch chunks (50 at a time) to Ollama `/api/embeddings` with `nomic-embed-text`
- Insert `[content, embedding, metadata]` into Node A's PostgreSQL via `pg` client
- Log structured progress: `[namespace] Inserted 150/748 chunks...`

### Error handling

- Ollama unreachable → fail fast with clear message
- PostgreSQL unreachable → fail fast
- Single PDF page parse failure → log warning, continue
- **Idempotent:** Script truncates by namespace before inserting. Safe to re-run.

---

## 4. nitro-db MCP Server (Query Interface)

### MCP Tools

**`query_lore`** — Primary vector similarity search
- Params: `{ query: string, namespace: NamespaceEnum, limit?: number (default 5), threshold?: number (default 0.7) }`
- Flow: Embed query via Ollama → cosine similarity search with namespace filter → validate through `RagQueryResultSchema` → return matches
- SQL: `SELECT *, 1 - (embedding <=> $1) AS score FROM chunks WHERE namespace = $2 ORDER BY embedding <=> $1 LIMIT $3`

**`query_multi_namespace`** — Cross-namespace search
- Params: `{ query: string, namespaces: NamespaceEnum[], limit?: number }`
- Use case: search both `core_rules` and `campaign_ttta` simultaneously

**`get_chunk_by_id`** — Direct chunk retrieval
- Params: `{ id: number }`
- Use case: follow-up retrieval for full context around a previous match

### Zero-trust validation (CLAUDE.md Section 9)

All query results validated through `RagQueryResultSchema` / `RagMatchSchema` before being passed to consumers. The contract is the contract, even for our own database.

### Connection flow

- MCP server instantiates `pg` client from `src/db/client.ts`
- Embeds query text via same Ollama embedder (reused from ingestion pipeline)
- Returns validated `RagQueryResult` objects

---

## 5. Project Structure

```
src/db/
├── index.ts                    # Barrel
├── migrate.ts                  # Runs CREATE TABLE / CREATE INDEX SQL
├── client.ts                   # pg Pool wrapper class targeting 192.168.0.50:5432
├── ingest/
│   ├── index.ts                # Main CLI entry — orchestrates stages 1-3
│   ├── pdf-parser.ts           # PDF text extraction + section detection
│   ├── json-serializer.ts      # Converts Foundry JSON docs to ingestible text
│   ├── chunker.ts              # Text → sized chunks with overlap
│   └── embedder.ts             # Ollama embedding client (batched)

src/mcp/
├── index.ts                    # Barrel
├── nitro-db/
│   ├── index.ts                # MCP server entry point
│   ├── server.ts               # MCP server class with tool registrations
│   └── handlers.ts             # Tool handler implementations

tests/
├── db/
│   ├── chunker.test.ts         # Chunk sizing, overlap, edge cases
│   ├── json-serializer.test.ts # Foundry doc serialization against real seed data
│   └── embedder.test.ts        # Batching logic, output shape (integration)
├── mcp/
│   └── nitro-db.test.ts        # Full round-trip insert → query (integration)
```

### Scripts added to `package.json`

```json
"ingest": "tsx src/db/ingest/index.ts",
"migrate": "tsx src/db/migrate.ts",
"test:integration": "vitest run --testPathPattern=integration"
```

---

## 6. Testing Strategy

### Unit tests (no external dependencies)

| Test file | What it validates | Source data |
|-----------|-------------------|-------------|
| `chunker.test.ts` | Chunk sizing (~500 tokens), overlap (~50 tokens), edge cases (short/empty pages) | Synthetic strings |
| `json-serializer.test.ts` | Each Foundry document type serializes to readable text | Real seed data files |

### Integration tests (require Ollama + PostgreSQL)

| Test file | What it validates |
|-----------|-------------------|
| `embedder.test.ts` | Batching logic, output is `number[]` of length 768 |
| `nitro-db.test.ts` | Full round-trip: insert test chunks → query via MCP → verify namespace isolation and correct matches |

### Coverage report test

After full ingest, verify every page of every PDF is represented — no gaps in the 748-page coverage map.

### Success criteria

- `npm run migrate` creates schema on Node A without errors
- `npm run ingest` processes all 5 PDFs + all JSON/TXT files, zero gaps
- `npm run test` passes all unit tests
- `npm run test:integration` passes with live Ollama + PostgreSQL
- `nitro-db` MCP server returns relevant matches for known queries with correct namespace filtering

---

## 7. Dependencies (new in Phase 1)

| Package | Type | Purpose |
|---------|------|---------|
| `pg` | production | PostgreSQL client |
| `@types/pg` | dev | TypeScript types for pg |
| `pdf-parse` | production | PDF text extraction |

### Environment variables (added to `.env`)

```env
# Node A PostgreSQL (Phase 1)
PGHOST=192.168.0.50
PGPORT=5432
PGUSER=asp_gm
PGPASSWORD=<set locally>
PGDATABASE=asp_gm_agent

# Ollama Embedding (Phase 1)
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### Not adding

- `pgvector` npm package — raw SQL with `vector` type casting is sufficient
- `cheerio` / `jsdom` — simple regex HTML stripping is adequate for journal content
- `tiktoken` — token estimation via `content.length / 4` approximation is sufficient for chunking

---

## 8. Decisions Log

| Decision | Rationale | Alternatives rejected |
|----------|-----------|----------------------|
| Raw `pg` over Prisma | Prisma's pgvector support is experimental. We'd write raw SQL for vector ops anyway. | Prisma (ORM overhead, pgvector friction) |
| Embeddings on Node B | Nitro 5 (4GB VRAM) already committed to llama-server. Node B has headroom. | Embeddings on Node A (VRAM pressure) |
| Direct PostgreSQL connection | Node A already runs 2 services. Adding an HTTP wrapper increases operational complexity. nitro-db MCP server is the abstraction layer. | REST wrapper on Node A (complexity) |
| HNSW over IVFFlat | Better recall at our scale (thousands of chunks). No retraining needed after inserts. | IVFFlat (requires training step, lower recall) |
| Sequential ingestion | One-time operation on powerful hardware. Parallel workers add debugging complexity for minimal gain. | Worker threads (overkill) |
| Truncate + re-insert | Simplest idempotency. Safe to re-run pipeline. No upsert complexity. | Upsert on content hash (complex, unnecessary) |
| `nomic-embed-text` (768d) | Small model, fast inference, good retrieval quality. Available via Ollama. | `all-minilm` (384d, lower quality), `mxbai-embed-large` (1024d, overkill) |

---

## 9. Scope Boundaries (No Creep)

Phase 1 produces ONLY:
- Artery of Truth migration script and schema
- Ingestion pipeline (PDF + JSON + TXT)
- Embedder client (Ollama)
- `nitro-db` MCP server with 3 tools
- Unit and integration tests
- Coverage report

Phase 1 does NOT produce:
- `nitro-logic` MCP server (Phase 2)
- Foundry VTT bridge module (Phase 3)
- Business logic, routing controllers, or narrative generation
- DI composition root (deferred — manual constructor injection continues)
- ESLint / Prettier (deferred)

---

## 10. Open Items for Future Phases

| Item | Phase | Notes |
|------|-------|-------|
| Tighten weapon/cyberware/armor item schemas | Phase 2 | Replace `.passthrough()` as those subtypes are consumed |
| DI composition root | Phase 2 | Wire service instantiation when real services exist |
| `nitro-logic` MCP server | Phase 2 | HTTP client for llama-server + CoT prompt injection |
| Custom Foundry VTT v12 bridge module | Phase 3 | Option C — minimal custom module (decision logged 2026-03-28) |


---
**LINKS:** [[OS_CORE]]
