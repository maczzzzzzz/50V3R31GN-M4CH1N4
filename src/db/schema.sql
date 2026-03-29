-- ASP.GM-Agent: Node A pgvector Schema
-- Target: PostgreSQL + pgvector on 192.168.0.50:5432
-- Run once on Node A to initialize the database.
--
-- Idempotent: all statements use IF NOT EXISTS / ON CONFLICT so this
-- file can be re-executed safely after partial failures.

-- ─── Extensions ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

-- ─── Core Table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pdf_chunks (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  source_file    TEXT        NOT NULL,  -- relative path within docs/raw_data/
  source_ref     TEXT        NOT NULL,  -- canonical reference (e.g., "CPRED-CRB-p12")
  namespace      TEXT        NOT NULL,  -- 'core_rules' | 'campaign_ttta' | 'entities_mooks'
  context_type   TEXT        NOT NULL,  -- 'mechanic' | 'lore'
  capability_req TEXT        NOT NULL DEFAULT 'none', -- e.g., 'math_resolution'
  section_heading TEXT       NOT NULL,  -- inferred heading for the chunk
  page_start     INTEGER     NOT NULL,  -- 0 for JSON documents
  page_end       INTEGER     NOT NULL,  -- 0 for JSON documents
  content        TEXT        NOT NULL,  -- raw text of the chunk
  chunk_index    INTEGER     NOT NULL,  -- 0-based index within the source file
  token_estimate INTEGER     NOT NULL,  -- rough estimate: content.length / 4
  embedding      vector(768),           -- nomic-embed-text 768-dim L2-normalized
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pdf_chunks_pkey
    PRIMARY KEY (id),

  -- Idempotency key: re-seeding the same file produces an UPDATE, not a duplicate.
  CONSTRAINT pdf_chunks_source_chunk_uniq
    UNIQUE (source_file, chunk_index),

  -- Namespace guard: hard constraint mirrors the application-level NamespaceEnum.
  CONSTRAINT pdf_chunks_namespace_check
    CHECK (namespace IN ('core_rules', 'campaign_ttta', 'entities_mooks')),

  -- Context type guard.
  CONSTRAINT pdf_chunks_context_type_check
    CHECK (context_type IN ('mechanic', 'lore'))
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

-- Namespace filter index: every RAG query WHERE-filters on namespace first.
CREATE INDEX IF NOT EXISTS pdf_chunks_namespace_idx
  ON pdf_chunks (namespace);

-- HNSW index for cosine similarity search (<=> operator).
-- m=16, ef_construction=64 are conservative defaults suitable for the
-- GTX 1050 Ti's 4GB VRAM budget and an estimated ~10k chunk dataset.
-- Increase ef_construction to 128 if recall quality is insufficient.
CREATE INDEX IF NOT EXISTS pdf_chunks_embedding_hnsw_idx
  ON pdf_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── Migration Safety Comment ────────────────────────────────────────────────
-- To drop and recreate (destructive, use only during initial setup):
--   DROP TABLE IF EXISTS pdf_chunks CASCADE;
--   Then re-run this file.
