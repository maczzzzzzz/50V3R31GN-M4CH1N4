/**
 * src/shared/schemas/zeroclaw-export.schema.ts
 *
 * Zod contracts for the ZeroClaw SQLite-Vec import format.
 *
 * The PostgresExporter (Phase 1 of Project Black-Ice) reads the 1,437
 * pdf_chunks rows from Node A's Postgres instance and serialises them into
 * this schema. The ZeroClaw Rust binary then ingests this JSON to populate
 * rules.db on Node A via the `zeroclaw import` subcommand.
 *
 * Vector encoding: each 768-dim float32 vector is stored as a little-endian
 * binary blob, base64-encoded. This is the native format expected by
 * sqlite-vec's vec0 virtual table (float[768]).
 */

import { z } from 'zod';

// ── Chunk record ──────────────────────────────────────────────────────────────

/**
 * A single chunk row migrated from Postgres pdf_chunks.
 * All fields mirror the Postgres schema exactly.
 */
export const ZerocrawlChunkSchema = z.object({
  /** UUID primary key from Postgres gen_random_uuid(). */
  id: z.string().uuid(),
  /** Relative path within docs/raw_data/ (e.g. "core_rules/cpred.pdf"). */
  source_file: z.string().min(1),
  /** Canonical reference string (e.g. "CPRED-CRB-P1"). */
  source_ref: z.string().min(1),
  /** Namespace isolation: 'core_rules' | 'campaign_ttta' | 'entities_mooks'. */
  namespace: z.enum(['core_rules', 'campaign_ttta', 'entities_mooks']),
  /** Semantic type of the chunk. */
  context_type: z.enum(['mechanic', 'lore']),
  /** Required capability for resolution (default: 'none'). */
  capability_req: z.string(),
  /** Inferred heading for the chunk. */
  section_heading: z.string(),
  /** First page this chunk was extracted from (0 for JSON sources). */
  page_start: z.number().int().nonnegative(),
  /** Last page this chunk was extracted from (0 for JSON sources). */
  page_end: z.number().int().nonnegative(),
  /** Raw text content of the chunk. */
  content: z.string().min(1),
  /** Zero-based index within the source file. */
  chunk_index: z.number().int().nonnegative(),
  /** Rough token count estimate (content.length / 4). */
  token_estimate: z.number().int().nonnegative(),
  /**
   * The 768-dim float32 embedding vector, serialised as a base64-encoded
   * little-endian binary blob (768 × 4 bytes = 3072 bytes → ~4096 chars).
   */
  vector_b64: z.string().min(1),
});

// ── Export envelope ───────────────────────────────────────────────────────────

/**
 * The full ZeroClaw import file envelope.
 * Written by PostgresExporter.writeExport() and consumed by `zeroclaw import`.
 */
export const ZerocrawlExportSchema = z.object({
  /** Schema version — always 1 for this migration format. */
  version: z.literal(1),
  /** ISO 8601 timestamp of when the export was generated. */
  exported_at: z.string(),
  /** Total number of chunks in this export. Must equal chunks.length. */
  chunk_count: z.number().int().nonnegative(),
  /** Embedding dimensionality — must be 768 (nomic-embed-text). */
  vector_dimensions: z.literal(768),
  /** The full array of migrated chunk records. */
  chunks: z.array(ZerocrawlChunkSchema),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ZerocrawlChunk = z.infer<typeof ZerocrawlChunkSchema>;
export type ZerocrawlExport = z.infer<typeof ZerocrawlExportSchema>;
