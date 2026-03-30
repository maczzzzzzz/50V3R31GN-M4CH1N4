/**
 * tests/db/postgres-exporter.test.ts
 *
 * TDD tests for the PostgresExporter — Phase 1 of Project Black-Ice.
 * Verifies the migration logic that reads from Postgres pdf_chunks and
 * serializes it into ZeroClaw's SQLite-Vec import format.
 */

import { describe, it, expect, vi } from 'vitest';
import pg from 'pg';
import { PostgresExporter } from '../../src/db/postgres-exporter.js';
import { ZerocrawlExportSchema } from '../../src/shared/schemas/zeroclaw-export.schema.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const sampleConfig = {
  host: '192.168.0.50',
  port: 5432,
  database: 'nitro_db',
  user: 'nitro_admin',
  password: 'test-password',
};

/** Build a mock pg.Pool that returns the given rows on query(). */
function makeMockPool(rows: Record<string, unknown>[]): pg.Pool {
  return {
    query: vi.fn().mockResolvedValue({ rows }),
    end: vi.fn().mockResolvedValue(undefined),
  } as unknown as pg.Pool;
}

/** Build a minimal sample row matching the pdf_chunks schema. */
function makeSampleRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    source_file: 'core_rules/cpred.pdf',
    source_ref: 'CPRED-CRB-P1',
    namespace: 'core_rules',
    context_type: 'mechanic',
    capability_req: 'none',
    section_heading: 'Introduction',
    page_start: 0,
    page_end: 0,
    content: 'Sample mechanic rule content.',
    chunk_index: 0,
    token_estimate: 6,
    // 768-dim zero vector in pgvector text format
    embedding: '[' + new Array(768).fill('0.001').join(',') + ']',
    ...overrides,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('PostgresExporter', () => {

  // ── serializeVector ─────────────────────────────────────────────────────────

  describe('serializeVector', () => {
    it('encodes float32 values as little-endian binary, base64-encoded', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const b64 = exporter.serializeVector([1.0, 0.5, -0.25]);

      const buf = Buffer.from(b64, 'base64');
      expect(buf.length).toBe(12); // 3 floats × 4 bytes
      expect(buf.readFloatLE(0)).toBeCloseTo(1.0, 5);
      expect(buf.readFloatLE(4)).toBeCloseTo(0.5, 5);
      expect(buf.readFloatLE(8)).toBeCloseTo(-0.25, 5);
    });

    it('produces a buffer of exactly dimensions × 4 bytes', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const vector = new Array(768).fill(0.001);
      const b64 = exporter.serializeVector(vector);
      const buf = Buffer.from(b64, 'base64');
      expect(buf.length).toBe(768 * 4);
    });

    it('handles a zero vector', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const b64 = exporter.serializeVector([0.0, 0.0]);
      const buf = Buffer.from(b64, 'base64');
      expect(buf.readFloatLE(0)).toBe(0.0);
      expect(buf.readFloatLE(4)).toBe(0.0);
    });
  });

  // ── parseVectorString ───────────────────────────────────────────────────────

  describe('parseVectorString', () => {
    it('parses pgvector square-bracket format', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const result = exporter.parseVectorString('[0.1,0.5,-0.25]');
      expect(result).toHaveLength(3);
      expect(result[0]).toBeCloseTo(0.1);
      expect(result[1]).toBeCloseTo(0.5);
      expect(result[2]).toBeCloseTo(-0.25);
    });

    it('handles a 768-dim pgvector string', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const raw = '[' + new Array(768).fill('0.001').join(',') + ']';
      const result = exporter.parseVectorString(raw);
      expect(result).toHaveLength(768);
      expect(result[0]).toBeCloseTo(0.001);
    });

    it('handles negative values correctly', () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([]));
      const result = exporter.parseVectorString('[-1.0,0.0,1.0]');
      expect(result[0]).toBeCloseTo(-1.0);
      expect(result[1]).toBeCloseTo(0.0);
      expect(result[2]).toBeCloseTo(1.0);
    });
  });

  // ── buildExport ─────────────────────────────────────────────────────────────

  describe('buildExport', () => {
    it('returns version:1, vector_dimensions:768, and correct chunk_count', async () => {
      const row = makeSampleRow();
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([row]));

      const result = await exporter.buildExport();

      expect(result.version).toBe(1);
      expect(result.vector_dimensions).toBe(768);
      expect(result.chunk_count).toBe(1);
    });

    it('maps all pdf_chunks columns into the export structure', async () => {
      const row = makeSampleRow();
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([row]));

      const result = await exporter.buildExport();
      const chunk = result.chunks[0]!;

      expect(chunk.id).toBe(row.id);
      expect(chunk.source_file).toBe(row.source_file);
      expect(chunk.source_ref).toBe(row.source_ref);
      expect(chunk.namespace).toBe(row.namespace);
      expect(chunk.context_type).toBe(row.context_type);
      expect(chunk.capability_req).toBe(row.capability_req);
      expect(chunk.section_heading).toBe(row.section_heading);
      expect(chunk.content).toBe(row.content);
      expect(chunk.chunk_index).toBe(row.chunk_index);
      expect(chunk.token_estimate).toBe(row.token_estimate);
    });

    it('serializes the embedding as a non-empty base64 string', async () => {
      const row = makeSampleRow();
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([row]));

      const result = await exporter.buildExport();
      const chunk = result.chunks[0]!;

      expect(typeof chunk.vector_b64).toBe('string');
      expect(chunk.vector_b64.length).toBeGreaterThan(0);
      // 768 floats × 4 bytes = 3072 bytes → base64 length ≈ 4096 chars
      const decoded = Buffer.from(chunk.vector_b64, 'base64');
      expect(decoded.length).toBe(768 * 4);
    });

    it('sets exported_at as a valid ISO 8601 timestamp', async () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([makeSampleRow()]));
      const result = await exporter.buildExport();
      expect(() => new Date(result.exported_at)).not.toThrow();
      expect(new Date(result.exported_at).toISOString()).toBe(result.exported_at);
    });

    it('handles multiple rows and sets chunk_count correctly', async () => {
      const rows = [
        makeSampleRow({ chunk_index: 0 }),
        makeSampleRow({ id: '550e8400-e29b-41d4-a716-446655440001', chunk_index: 1 }),
        makeSampleRow({ id: '550e8400-e29b-41d4-a716-446655440002', chunk_index: 2 }),
      ];
      const exporter = new PostgresExporter(sampleConfig, makeMockPool(rows));

      const result = await exporter.buildExport();
      expect(result.chunk_count).toBe(3);
      expect(result.chunks).toHaveLength(3);
    });

    it('passes ZerocrawlExportSchema Zod validation', async () => {
      const exporter = new PostgresExporter(sampleConfig, makeMockPool([makeSampleRow()]));
      const result = await exporter.buildExport();
      expect(() => ZerocrawlExportSchema.parse(result)).not.toThrow();
    });

    it('queries the correct SQL (namespace-ordered by chunk_index)', async () => {
      const mockPool = makeMockPool([makeSampleRow()]);
      const exporter = new PostgresExporter(sampleConfig, mockPool);

      await exporter.buildExport();

      const queryCalls = vi.mocked(mockPool.query as ReturnType<typeof vi.fn>).mock.calls;
      expect(queryCalls).toHaveLength(1);
      const sql = String(queryCalls[0]![0]);
      expect(sql).toContain('pdf_chunks');
      expect(sql).toContain('chunk_index');
      expect(sql).toContain('embedding');
    });
  });
});
