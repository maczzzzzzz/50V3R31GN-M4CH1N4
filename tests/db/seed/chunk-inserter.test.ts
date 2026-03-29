import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ILogger } from '../../../src/db/interfaces.js';
import type { PreparedChunk, UpsertStats } from '../../../src/db/seed/interfaces.js';
import { ChunkInserter } from '../../../src/db/seed/chunk-inserter.js';
import { EMBED_BATCH_SIZE } from '../../../src/db/seed/interfaces.js';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function createMockLogger(): ILogger & {
  calls: Array<{ severity: string; context: string; traceId: string; message: string; data?: Record<string, unknown> }>;
} {
  const calls: Array<{ severity: string; context: string; traceId: string; message: string; data?: Record<string, unknown> }> = [];
  return {
    calls,
    debug(ctx, traceId, msg, data) { calls.push({ severity: 'DEBUG', context: ctx, traceId, message: msg, data }); },
    info(ctx, traceId, msg, data) { calls.push({ severity: 'INFO', context: ctx, traceId, message: msg, data }); },
    warn(ctx, traceId, msg, data) { calls.push({ severity: 'WARN', context: ctx, traceId, message: msg, data }); },
    error(ctx, traceId, msg, data) { calls.push({ severity: 'ERROR', context: ctx, traceId, message: msg, data }); },
  };
}

/**
 * Builds a mock pg.Pool. The mockClient.query fn is pre-configured:
 * - BEGIN / COMMIT / ROLLBACK → { rows: [] }
 * - INSERT queries consume xmaxRows one entry at a time (one row per INSERT call).
 *
 * Each INSERT call returns a single row whose xmax is the next value from xmaxRows.
 * This matches the ChunkInserter implementation which issues one INSERT per chunk.
 */
function makeMockPool(xmaxRows: string[]) {
  let insertCallCount = 0;
  const mockClient = {
    query: vi.fn().mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      const xmax = xmaxRows[insertCallCount] ?? '0';
      insertCallCount++;
      return { rows: [{ xmax }] };
    }),
    release: vi.fn(),
  };
  return {
    connect: vi.fn().mockResolvedValue(mockClient),
    mockClient,
  };
}

/**
 * Builds a mock pool whose INSERT calls consume xmaxSequence (flat array) one at a time.
 * Each new pool.connect() returns a fresh client that continues the sequence.
 * Used for multi-transaction (batch split) tests.
 */
function makeMockPoolMultiBatch(xmaxSequence: string[]) {
  let insertCallCount = 0;
  // We track connect calls so we can return a fresh mock client each time
  // but share the same insertCallCount across all clients (same sequence).
  const makeClient = () => ({
    query: vi.fn().mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
      const xmax = xmaxSequence[insertCallCount] ?? '0';
      insertCallCount++;
      return { rows: [{ xmax }] };
    }),
    release: vi.fn(),
  });
  const clients: ReturnType<typeof makeClient>[] = [];
  return {
    connect: vi.fn().mockImplementation(async () => {
      const client = makeClient();
      clients.push(client);
      return client;
    }),
    get clients() { return clients; },
  };
}

// ── Fixture builders ──────────────────────────────────────────────────────────

function makeChunk(overrides: Partial<PreparedChunk> = {}): PreparedChunk {
  return {
    sourceFile: 'core_rules/test.pdf',
    sourceRef: 'CPRED-CRB-p1',
    namespace: 'core_rules',
    contextType: 'mechanic',
    capabilityReq: 'math_resolution',
    sectionHeading: 'Combat',
    pageStart: 1,
    pageEnd: 2,
    content: 'Test content.',
    chunkIndex: 0,
    tokenEstimate: 10,
    embedding: [0.1, 0.2, 0.3],
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChunkInserter', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
  });

  // ── 1. Empty array fast-path ───────────────────────────────────────────────

  describe('empty array fast-path', () => {
    it('returns { inserted: 0, updated: 0 } immediately without touching the pool', async () => {
      const pool = makeMockPool([]);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const stats = await inserter.upsertBatch([]);

      expect(stats).toEqual<UpsertStats>({ inserted: 0, updated: 0 });
      expect(pool.connect).not.toHaveBeenCalled();
    });
  });

  // ── 2. Single chunk inserted (xmax='0') ────────────────────────────────────

  describe('single chunk inserted', () => {
    it("returns { inserted: 1, updated: 0 } when xmax='0'", async () => {
      const pool = makeMockPool(['0']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const stats = await inserter.upsertBatch([makeChunk()]);

      expect(stats).toEqual<UpsertStats>({ inserted: 1, updated: 0 });
    });
  });

  // ── 3. Single chunk updated (xmax != '0') ─────────────────────────────────

  describe('single chunk updated', () => {
    it("returns { inserted: 0, updated: 1 } when xmax='5'", async () => {
      const pool = makeMockPool(['5']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const stats = await inserter.upsertBatch([makeChunk()]);

      expect(stats).toEqual<UpsertStats>({ inserted: 0, updated: 1 });
    });
  });

  // ── 4. Mixed batch ─────────────────────────────────────────────────────────

  describe('mixed batch (some inserted, some updated)', () => {
    it('correctly tallies inserted and updated from a mixed xmax result set', async () => {
      // xmax: '0'=inserted, '7'=updated, '0'=inserted, '3'=updated
      const pool = makeMockPool(['0', '7', '0', '3']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const chunks = [
        makeChunk({ chunkIndex: 0 }),
        makeChunk({ chunkIndex: 1 }),
        makeChunk({ chunkIndex: 2 }),
        makeChunk({ chunkIndex: 3 }),
      ];
      const stats = await inserter.upsertBatch(chunks);

      expect(stats).toEqual<UpsertStats>({ inserted: 2, updated: 2 });
    });
  });

  // ── 5. Batch > EMBED_BATCH_SIZE splits into multiple transactions ──────────

  describe('batch splitting', () => {
    it(`splits ${EMBED_BATCH_SIZE + 1} chunks into two separate transactions`, async () => {
      // EMBED_BATCH_SIZE chunks all inserted (xmax='0'), then 1 updated (xmax='5')
      const xmaxSequence = [
        ...Array.from({ length: EMBED_BATCH_SIZE }, () => '0'),
        '5',
      ];
      const pool = makeMockPoolMultiBatch(xmaxSequence);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const chunks = Array.from({ length: EMBED_BATCH_SIZE + 1 }, (_, i) =>
        makeChunk({ chunkIndex: i })
      );
      const stats = await inserter.upsertBatch(chunks);

      expect(stats).toEqual<UpsertStats>({ inserted: EMBED_BATCH_SIZE, updated: 1 });
      // Two separate pool.connect() calls (one per transaction)
      expect(pool.connect).toHaveBeenCalledTimes(2);
    });
  });

  // ── 6. Transaction wrapping: BEGIN before INSERT, COMMIT after ─────────────

  describe('transaction wrapping', () => {
    it('calls BEGIN before the INSERT and COMMIT after', async () => {
      const pool = makeMockPool(['0']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      await inserter.upsertBatch([makeChunk()]);

      const queryCalls = pool.mockClient.query.mock.calls.map((c: unknown[]) => c[0] as string);
      const beginIdx = queryCalls.indexOf('BEGIN');
      const commitIdx = queryCalls.indexOf('COMMIT');
      const insertIdx = queryCalls.findIndex((q: string) => q.includes('INSERT'));

      expect(beginIdx).toBeGreaterThanOrEqual(0);
      expect(commitIdx).toBeGreaterThanOrEqual(0);
      expect(insertIdx).toBeGreaterThanOrEqual(0);
      expect(beginIdx).toBeLessThan(insertIdx);
      expect(insertIdx).toBeLessThan(commitIdx);
    });

    it('releases the client after each transaction', async () => {
      const pool = makeMockPool(['0']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      await inserter.upsertBatch([makeChunk()]);

      expect(pool.mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // ── 7. Error handling: ROLLBACK + re-throw ─────────────────────────────────

  describe('error handling', () => {
    it('calls ROLLBACK and re-throws on pg query error', async () => {
      const pgError = new Error('connection refused');
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string) => {
          if (sql === 'BEGIN') return { rows: [] };
          if (sql === 'ROLLBACK') return { rows: [] };
          throw pgError;
        }),
        release: vi.fn(),
      };
      const pool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        mockClient,
      };

      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      await expect(inserter.upsertBatch([makeChunk()])).rejects.toThrow('connection refused');

      const queryCalls = mockClient.query.mock.calls.map((c: unknown[]) => c[0] as string);
      expect(queryCalls).toContain('ROLLBACK');
    });

    it('logs an error with traceId and ChunkInserter context on failure', async () => {
      const pgError = new Error('disk full');
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string) => {
          if (sql === 'BEGIN') return { rows: [] };
          if (sql === 'ROLLBACK') return { rows: [] };
          throw pgError;
        }),
        release: vi.fn(),
      };
      const pool = {
        connect: vi.fn().mockResolvedValue(mockClient),
      };

      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      await expect(inserter.upsertBatch([makeChunk()])).rejects.toThrow();

      const errorLogs = logger.calls.filter(c => c.severity === 'ERROR');
      expect(errorLogs.length).toBeGreaterThan(0);
      const errLog = errorLogs[0]!;
      expect(errLog.context).toBe('ChunkInserter');
      expect(errLog.traceId).toBeTruthy();
      expect(errLog.message).toContain('disk full');
    });

    it('still releases the client after ROLLBACK', async () => {
      const pgError = new Error('oops');
      const mockClient = {
        query: vi.fn().mockImplementation(async (sql: string) => {
          if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
          throw pgError;
        }),
        release: vi.fn(),
      };
      const pool = { connect: vi.fn().mockResolvedValue(mockClient) };

      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);
      await expect(inserter.upsertBatch([makeChunk()])).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // ── 8. pool.connect() failure propagates cleanly ──────────────────────────

  describe('pool.connect() failure', () => {
    it('propagates pool.connect() rejection without crashing', async () => {
      const pool = { connect: vi.fn().mockRejectedValue(new Error('pool exhausted')) };
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);
      await expect(inserter.upsertBatch([makeChunk()])).rejects.toThrow('pool exhausted');
    });
  });

  // ── 10. Embedding formatted as vector string '[n1,n2,...]' ─────────────────

  describe('embedding vector formatting', () => {
    it("passes embedding as '[n1,n2,n3]' string in query params", async () => {
      const pool = makeMockPool(['0']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      const chunk = makeChunk({ embedding: [0.1, 0.2, 0.3] });
      await inserter.upsertBatch([chunk]);

      // Find the INSERT call — it's not BEGIN/COMMIT/ROLLBACK
      const insertCall = pool.mockClient.query.mock.calls.find(
        (c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('INSERT')
      ) as [string, unknown[]] | undefined;

      expect(insertCall).toBeDefined();
      const params = insertCall![1] as unknown[];
      // $12 is the last param (index 11) — the vector string
      expect(params[11]).toBe('[0.1,0.2,0.3]');
    });
  });

  // ── 11. Logger called with traceId and 'ChunkInserter' context ────────────

  describe('structured logging', () => {
    it("logs with context='ChunkInserter' and a non-empty traceId on success", async () => {
      const pool = makeMockPool(['0']);
      const inserter = new ChunkInserter(pool as unknown as import('pg').Pool, logger);

      await inserter.upsertBatch([makeChunk()]);

      const loggedByInserter = logger.calls.filter(c => c.context === 'ChunkInserter');
      expect(loggedByInserter.length).toBeGreaterThan(0);
      for (const entry of loggedByInserter) {
        expect(entry.traceId).toBeTruthy();
        expect(entry.traceId.length).toBeGreaterThan(0);
      }
    });
  });
});
