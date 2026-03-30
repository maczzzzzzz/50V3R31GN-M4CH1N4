/**
 * src/db/postgres-exporter.ts
 *
 * PostgresExporter — Phase 1 of Project Black-Ice (v0.7.0).
 *
 * Reads the complete pdf_chunks dataset from Node A's Postgres/pgvector
 * instance and serialises it to the ZeroClaw JSON import format. The output
 * JSON is then consumed by the `zeroclaw import` Rust subcommand to populate
 * rules.db on Node A.
 *
 * Migration flow:
 *   Node B (this class) → reads Postgres → writes .zeroclaw.json
 *   Node A (zeroclaw binary) → reads .zeroclaw.json → writes rules.db (SQLite-Vec)
 *
 * Vector serialisation:
 *   Postgres pgvector returns embeddings as text: "[0.1,0.2,...]"
 *   parseVectorString() converts this to number[]
 *   serializeVector() converts number[] to little-endian float32 binary, base64-encoded
 *   This is the native format for sqlite-vec's vec0 virtual table: float[768]
 */

import pg from 'pg';
import { writeFile } from 'node:fs/promises';
import { ZerocrawlExportSchema, type ZerocrawlExport } from '../shared/schemas/zeroclaw-export.schema.js';

// ── Configuration ─────────────────────────────────────────────────────────────

export interface PostgresExporterConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
}

// ── Internal row type ─────────────────────────────────────────────────────────

interface PdfChunkRow {
  id: string;
  source_file: string;
  source_ref: string;
  namespace: string;
  context_type: string;
  capability_req: string;
  section_heading: string;
  page_start: number;
  page_end: number;
  content: string;
  chunk_index: number;
  token_estimate: number;
  /** pgvector text format: "[0.123,0.456,...]" */
  embedding: string;
}

// ── SELECT query ──────────────────────────────────────────────────────────────

const EXPORT_SQL = `
SELECT
  id,
  source_file,
  source_ref,
  namespace,
  context_type,
  capability_req,
  section_heading,
  page_start,
  page_end,
  content,
  chunk_index,
  token_estimate,
  embedding::text AS embedding
FROM pdf_chunks
ORDER BY chunk_index ASC
`.trim();

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * PostgresExporter reads all pdf_chunks from Postgres and writes a ZeroClaw
 * JSON import file ready for `zeroclaw import <path>` on Node A.
 *
 * The pool is injected via the constructor to enable TDD without a live DB.
 */
export class PostgresExporter {
  private readonly pool: pg.Pool;

  constructor(config: PostgresExporterConfig, pool?: pg.Pool) {
    this.pool = pool ?? new pg.Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 1, // Single-connection pool — migration is sequential
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Query all chunks from Postgres, serialise vectors, and return the export
   * envelope. Validates against ZerocrawlExportSchema before returning.
   */
  async buildExport(): Promise<ZerocrawlExport> {
    const result = await this.pool.query<PdfChunkRow>(EXPORT_SQL);

    const chunks = result.rows.map((row) => ({
      id: row.id,
      source_file: row.source_file,
      source_ref: row.source_ref,
      namespace: row.namespace as 'core_rules' | 'campaign_ttta' | 'entities_mooks',
      context_type: row.context_type as 'mechanic' | 'lore',
      capability_req: row.capability_req,
      section_heading: row.section_heading,
      page_start: row.page_start,
      page_end: row.page_end,
      content: row.content,
      chunk_index: row.chunk_index,
      token_estimate: row.token_estimate,
      vector_b64: this.serializeVector(this.parseVectorString(row.embedding)),
    }));

    const data: ZerocrawlExport = {
      version: 1,
      exported_at: new Date().toISOString(),
      chunk_count: chunks.length,
      vector_dimensions: 768,
      chunks,
    };

    // Zero-trust: validate before returning (catches schema regressions)
    return ZerocrawlExportSchema.parse(data);
  }

  /**
   * Build the export and write it to disk as JSON.
   * Returns the number of chunks written.
   */
  async writeExport(outputPath: string): Promise<number> {
    const data = await this.buildExport();
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    return data.chunk_count;
  }

  /** Release the connection pool. */
  async dispose(): Promise<void> {
    await this.pool.end();
  }

  // ── Vector serialisation ────────────────────────────────────────────────────

  /**
   * Serialise a float32 vector array to a little-endian binary blob,
   * base64-encoded. This is the exact format expected by sqlite-vec's
   * vec0 virtual table when inserting via `vec_to_json()`.
   */
  serializeVector(vector: number[]): string {
    const buffer = Buffer.allocUnsafe(vector.length * 4);
    for (let i = 0; i < vector.length; i++) {
      buffer.writeFloatLE(vector[i]!, i * 4);
    }
    return buffer.toString('base64');
  }

  /**
   * Parse the pgvector text representation "[0.1,0.2,...]" into a number array.
   * pgvector always uses square brackets and comma-separated decimal values.
   */
  parseVectorString(raw: string): number[] {
    // Trim the outer "[" and "]" brackets, split on comma, parse each float
    return raw.slice(1, -1).split(',').map(Number);
  }
}
