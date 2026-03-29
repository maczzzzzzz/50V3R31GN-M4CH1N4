import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import type { ILogger } from '../../../src/db/interfaces.js';
import type {
  IDocumentParser,
  IChunkInserter,
  RawChunk,
  PreparedChunk,
  UpsertStats,
  SeedReport,
} from '../../../src/db/seed/interfaces.js';
import { EMBED_BATCH_SIZE } from '../../../src/db/seed/interfaces.js';
import type { IEmbeddingService } from '../../../src/db/interfaces.js';
import type { Namespace } from '../../../src/shared/types/index.js';
import { SeedOrchestrator } from '../../../src/db/seed/seed-orchestrator.js';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function createMockLogger(): ILogger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockEmbeddingService(
  vectorFactory?: (text: string) => number[]
): IEmbeddingService {
  const factory = vectorFactory ?? (() => [0.1, 0.2, 0.3]);
  return {
    embed: vi.fn(async (text: string) => factory(text)),
    embedBatch: vi.fn(async (texts: string[]) => texts.map(t => factory(t))),
    getDimensions: vi.fn(() => 3),
  };
}

function createMockInserter(
  stats: UpsertStats = { inserted: 1, updated: 0 }
): IChunkInserter {
  return {
    upsertBatch: vi.fn(async (_chunks: PreparedChunk[]) => stats),
  };
}

function makeRawChunk(
  overrides: Partial<RawChunk> & { namespace?: Namespace } = {}
): RawChunk {
  return {
    sourceFile: 'core_rules/test.txt',
    sourceRef: 'CPRED-CRB-p1',
    namespace: 'core_rules',
    contextType: 'mechanic',
    capabilityReq: 'math_resolution',
    sectionHeading: 'Combat',
    pageStart: 0,
    pageEnd: 0,
    content: 'a'.repeat(100),
    ...overrides,
  };
}

function createMockParser(
  canParseResult: boolean,
  chunks: RawChunk[]
): IDocumentParser {
  return {
    canParse: vi.fn((_filePath: string) => canParseResult),
    parse: vi.fn(async (_filePath: string, _ns: Namespace) => chunks),
  };
}

// ── Temp-dir fixture ──────────────────────────────────────────────────────────

let tmpRoot: string;

beforeAll(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'seed-orch-test-'));

  // Create namespace subdirectories
  for (const ns of ['core_rules', 'campaign_ttta', 'entities_mooks']) {
    await fs.mkdir(path.join(tmpRoot, ns), { recursive: true });
  }
});

afterAll(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function writeTmpFile(nsDir: string, filename: string, content = 'hello'): Promise<string> {
  const filePath = path.join(tmpRoot, nsDir, filename);
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

async function cleanNsDir(nsDir: string): Promise<void> {
  const dir = path.join(tmpRoot, nsDir);
  const entries = await fs.readdir(dir);
  await Promise.all(entries.map(e => fs.unlink(path.join(dir, e))));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SeedOrchestrator', () => {
  let logger: ILogger;
  let embeddingService: IEmbeddingService;
  let inserter: IChunkInserter;

  beforeEach(async () => {
    logger = createMockLogger();
    embeddingService = createMockEmbeddingService();
    inserter = createMockInserter();

    // Clean all namespace dirs between tests
    for (const ns of ['core_rules', 'campaign_ttta', 'entities_mooks']) {
      await cleanNsDir(ns);
    }
  });

  // ── 1. Empty namespace dirs → all-zero report ─────────────────────────────

  describe('empty namespace directories', () => {
    it('returns a SeedReport with all zeros when all namespace dirs are empty', async () => {
      const parser = createMockParser(true, []);
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [parser]);

      const report = await orchestrator.run(tmpRoot);

      expect(report.filesProcessed).toBe(0);
      expect(report.filesSkipped).toBe(0);
      expect(report.chunksInserted).toBe(0);
      expect(report.chunksUpdated).toBe(0);
      expect(report.errors).toHaveLength(0);
    });
  });

  // ── 2. Unsupported extension silently skipped ─────────────────────────────

  describe('unsupported file extension', () => {
    it('silently skips .webp files — not counted in errors, not in filesSkipped', async () => {
      await writeTmpFile('core_rules', 'image.webp');

      const parser = createMockParser(false, []);
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [parser]);

      const report = await orchestrator.run(tmpRoot);

      expect(report.filesSkipped).toBe(0);
      expect(report.errors).toHaveLength(0);
      expect(report.filesProcessed).toBe(0);
    });

    it('silently skips .png files — not counted in errors', async () => {
      await writeTmpFile('core_rules', 'photo.png');
      await writeTmpFile('core_rules', 'doc.txt', 'content');

      const txtChunk = makeRawChunk({ sourceFile: path.join(tmpRoot, 'core_rules', 'doc.txt') });
      const parser = createMockParser(true, [txtChunk]);

      // Parser only handles .txt
      const selectiveParser: IDocumentParser = {
        canParse: vi.fn((fp: string) => fp.endsWith('.txt')),
        parse: vi.fn(async () => [txtChunk]),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [selectiveParser]);
      const report = await orchestrator.run(tmpRoot);

      expect(report.filesProcessed).toBe(1);
      expect(report.filesSkipped).toBe(0); // .png silently ignored, not skipped
      expect(report.errors).toHaveLength(0);
    });
  });

  // ── 3. Parser throws → file in errors, filesSkipped incremented ──────────

  describe('parser throws', () => {
    it('increments filesSkipped and adds to errors when parser throws', async () => {
      await writeTmpFile('core_rules', 'bad.txt', 'unparseable content');

      const throwingParser: IDocumentParser = {
        canParse: vi.fn((_fp: string) => true),
        parse: vi.fn(async () => { throw new Error('parse failed'); }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [throwingParser]);
      const report = await orchestrator.run(tmpRoot);

      expect(report.filesSkipped).toBe(1);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0]?.error).toContain('parse failed');
      expect(report.filesProcessed).toBe(0);
    });

    it('continues processing other files after a parser error', async () => {
      await writeTmpFile('core_rules', 'bad.txt', 'bad');
      await writeTmpFile('core_rules', 'good.txt', 'good');

      const goodChunk = makeRawChunk({ sourceFile: path.join(tmpRoot, 'core_rules', 'good.txt') });
      let callCount = 0;
      const mixedParser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async (fp: string) => {
          callCount++;
          if (fp.endsWith('bad.txt')) throw new Error('parse error');
          return [goodChunk];
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [mixedParser]);
      const report = await orchestrator.run(tmpRoot);

      expect(callCount).toBe(2);
      expect(report.filesSkipped).toBe(1);
      expect(report.filesProcessed).toBe(1);
      expect(report.errors).toHaveLength(1);
    });

    it('logs a warning (not error) when parser throws for a file', async () => {
      await writeTmpFile('core_rules', 'warn.txt', 'bad');

      const throwingParser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async () => { throw new Error('boom'); }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [throwingParser]);
      await orchestrator.run(tmpRoot);

      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ── 4. Happy path: 1 file → 1 chunk → embedded → inserted ───────────────

  describe('happy path — single file, single chunk', () => {
    it('returns correct SeedReport for a single file producing one chunk', async () => {
      const filePath = await writeTmpFile('core_rules', 'rules.txt', 'Rule content here.');
      const rawChunk = makeRawChunk({ sourceFile: filePath });

      const parser = createMockParser(true, [rawChunk]);
      const inserterWithStats = createMockInserter({ inserted: 1, updated: 0 });
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserterWithStats, [parser]);

      const report = await orchestrator.run(tmpRoot);

      expect(report.filesProcessed).toBe(1);
      expect(report.filesSkipped).toBe(0);
      expect(report.chunksInserted).toBe(1);
      expect(report.chunksUpdated).toBe(0);
      expect(report.errors).toHaveLength(0);
    });

    it('calls embedBatch with the chunk content', async () => {
      const filePath = await writeTmpFile('core_rules', 'embed.txt', 'content to embed');
      const rawChunk = makeRawChunk({ sourceFile: filePath, content: 'content to embed' });

      const parser = createMockParser(true, [rawChunk]);
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [parser]);

      await orchestrator.run(tmpRoot);

      expect(embeddingService.embedBatch).toHaveBeenCalled();
      const calls = vi.mocked(embeddingService.embedBatch).mock.calls;
      const allTexts = calls.flatMap(c => c[0]);
      expect(allTexts).toContain('content to embed');
    });

    it('calls upsertBatch with PreparedChunks that have correct chunkIndex and tokenEstimate', async () => {
      const content = 'a'.repeat(400); // tokenEstimate = ceil(400/4) = 100
      const filePath = await writeTmpFile('core_rules', 'indexed.txt', content);
      const rawChunk = makeRawChunk({ sourceFile: filePath, content });

      const parser = createMockParser(true, [rawChunk]);
      const capturingInserter: IChunkInserter = {
        upsertBatch: vi.fn(async (chunks) => {
          expect(chunks[0]?.chunkIndex).toBe(0);
          expect(chunks[0]?.tokenEstimate).toBe(100);
          return { inserted: 1, updated: 0 };
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, capturingInserter, [parser]);
      await orchestrator.run(tmpRoot);

      expect(capturingInserter.upsertBatch).toHaveBeenCalled();
    });
  });

  // ── 5. filesProcessed counts only files producing ≥1 chunk ───────────────

  describe('filesProcessed counting', () => {
    it('does not count files that produce zero chunks as filesProcessed', async () => {
      await writeTmpFile('core_rules', 'empty-parsed.txt', 'content');

      const emptyParser = createMockParser(true, []); // produces 0 chunks
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [emptyParser]);

      const report = await orchestrator.run(tmpRoot);

      expect(report.filesProcessed).toBe(0);
      expect(report.filesSkipped).toBe(0); // zero chunks is NOT a skip, just no contribution
    });

    it('counts files producing ≥1 chunk as filesProcessed', async () => {
      const fp1 = await writeTmpFile('core_rules', 'one.txt', 'content1');
      const fp2 = await writeTmpFile('core_rules', 'two.txt', 'content2');

      const inserterStats = createMockInserter({ inserted: 2, updated: 0 });
      const parser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async (fp: string) => [makeRawChunk({ sourceFile: fp })]),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserterStats, [parser]);
      const report = await orchestrator.run(tmpRoot);

      // Both files are in core_rules only; campaign_ttta and entities_mooks are empty
      expect(report.filesProcessed).toBe(2);
    });
  });

  // ── 6. durationMs is positive and numeric ────────────────────────────────

  describe('durationMs', () => {
    it('returns a positive numeric durationMs', async () => {
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, []);
      const report = await orchestrator.run(tmpRoot);

      expect(typeof report.durationMs).toBe('number');
      // durationMs may be 0 on very fast test runs; contract is non-negative
      expect(report.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 7. Multiple namespaces processed ─────────────────────────────────────

  describe('multiple namespaces', () => {
    it('processes files across all three namespace directories', async () => {
      const fp1 = await writeTmpFile('core_rules', 'cr.txt', 'cr content');
      const fp2 = await writeTmpFile('campaign_ttta', 'ttta.json', '{}');
      const fp3 = await writeTmpFile('entities_mooks', 'mooks.txt', 'mooks content');

      const inserterStats = createMockInserter({ inserted: 3, updated: 0 });
      const parser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async (fp: string, ns: Namespace) => [
          makeRawChunk({ sourceFile: fp, namespace: ns }),
        ]),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserterStats, [parser]);
      const report = await orchestrator.run(tmpRoot);

      expect(report.filesProcessed).toBe(3);
      expect(report.errors).toHaveLength(0);
    });

    it('passes the correct namespace to each parser.parse() call', async () => {
      const fp1 = await writeTmpFile('core_rules', 'cr2.txt', 'content');
      const fp2 = await writeTmpFile('campaign_ttta', 'ttta2.txt', 'content');

      const namespaceSeen: Namespace[] = [];
      const parser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async (_fp: string, ns: Namespace) => {
          namespaceSeen.push(ns);
          return [makeRawChunk({ namespace: ns })];
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [parser]);
      await orchestrator.run(tmpRoot);

      expect(namespaceSeen).toContain('core_rules');
      expect(namespaceSeen).toContain('campaign_ttta');
    });
  });

  // ── 8. Embedding batch respects EMBED_BATCH_SIZE ─────────────────────────

  describe('embedding batch size', () => {
    it(`calls embedBatch in groups of at most ${EMBED_BATCH_SIZE}`, async () => {
      const totalChunks = EMBED_BATCH_SIZE + 5;
      const chunks: RawChunk[] = Array.from({ length: totalChunks }, (_, i) =>
        makeRawChunk({ sourceFile: `core_rules/file${i}.txt`, content: `chunk ${i}` })
      );

      const batchSizesSeen: number[] = [];
      const batchEmbeddingService: IEmbeddingService = {
        embed: vi.fn(),
        embedBatch: vi.fn(async (texts: string[]) => {
          batchSizesSeen.push(texts.length);
          return texts.map(() => [0.1, 0.2, 0.3]);
        }),
        getDimensions: vi.fn(() => 3),
      };

      await writeTmpFile('core_rules', 'big.txt', 'content');
      const parser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async () => chunks),
      };

      const orchestrator = new SeedOrchestrator(logger, batchEmbeddingService, inserter, [parser]);
      await orchestrator.run(tmpRoot);

      // Every batch call must be ≤ EMBED_BATCH_SIZE
      for (const batchSize of batchSizesSeen) {
        expect(batchSize).toBeLessThanOrEqual(EMBED_BATCH_SIZE);
      }
      // At least 2 calls since totalChunks > EMBED_BATCH_SIZE
      expect(batchSizesSeen.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 9. chunksInserted + chunksUpdated match UpsertStats ──────────────────

  describe('UpsertStats totals', () => {
    it('sums chunksInserted and chunksUpdated from UpsertStats', async () => {
      const fp = await writeTmpFile('core_rules', 'stats.txt', 'content');
      const rawChunk = makeRawChunk({ sourceFile: fp });

      const parser = createMockParser(true, [rawChunk]);
      const inserterWithMixed = createMockInserter({ inserted: 3, updated: 7 });
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserterWithMixed, [parser]);

      const report = await orchestrator.run(tmpRoot);

      expect(report.chunksInserted).toBe(3);
      expect(report.chunksUpdated).toBe(7);
    });

    it('reflects UpsertStats from the single upsertBatch call correctly', async () => {
      // Two files in different namespace dirs will produce separate or combined batches
      const fp1 = await writeTmpFile('core_rules', 'a.txt', 'content');
      const fp2 = await writeTmpFile('campaign_ttta', 'b.txt', 'content');

      const parser: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async (fp: string) => [makeRawChunk({ sourceFile: fp })]),
      };

      let callCount = 0;
      const multiCallInserter: IChunkInserter = {
        upsertBatch: vi.fn(async (_chunks: PreparedChunk[]) => {
          callCount++;
          return { inserted: 2, updated: 1 };
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, multiCallInserter, [parser]);
      const report = await orchestrator.run(tmpRoot);

      // Single upsertBatch call returns combined stats; verify they are reported correctly
      expect(report.chunksInserted).toBe(2 * callCount);
      expect(report.chunksUpdated).toBe(1 * callCount);
    });
  });

  // ── 10. Embedding failure handling ───────────────────────────────────────

  describe('embedding failure', () => {
    it('logs an error and adds to errors when embedBatch throws, but continues', async () => {
      const fp = await writeTmpFile('core_rules', 'embed-fail.txt', 'content');
      const rawChunk = makeRawChunk({ sourceFile: fp });

      const parser = createMockParser(true, [rawChunk]);
      const failingEmbeddingService: IEmbeddingService = {
        embed: vi.fn(),
        embedBatch: vi.fn(async () => { throw new Error('ollama down'); }),
        getDimensions: vi.fn(() => 3),
      };

      const orchestrator = new SeedOrchestrator(logger, failingEmbeddingService, inserter, [parser]);
      const report = await orchestrator.run(tmpRoot);

      expect(logger.error).toHaveBeenCalled();
      expect(report.errors.length).toBeGreaterThan(0);
      // Run should not throw
    });
  });

  // ── 11. upsertBatch failure handling ─────────────────────────────────────

  describe('upsertBatch failure', () => {
    it('adds to errors and continues when upsertBatch throws', async () => {
      const fp = await writeTmpFile('core_rules', 'upsert-fail.txt', 'some content');
      const rawChunk = makeRawChunk({ sourceFile: fp });

      const parser = createMockParser(true, [rawChunk]);
      const failingInserter: IChunkInserter = {
        upsertBatch: vi.fn(async () => { throw new Error('DB down'); }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, failingInserter, [parser]);
      const report = await orchestrator.run(tmpRoot);

      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors.some(e => e.error.includes('DB down'))).toBe(true);
    });
  });

  // ── 12. Structured logging context and traceId ────────────────────────────

  describe('structured logging', () => {
    it("logs with context='SeedOrchestrator' and a non-empty traceId", async () => {
      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, []);
      await orchestrator.run(tmpRoot);

      // Check all logger methods
      const allCalls = [
        ...vi.mocked(logger.debug).mock.calls,
        ...vi.mocked(logger.info).mock.calls,
        ...vi.mocked(logger.warn).mock.calls,
        ...vi.mocked(logger.error).mock.calls,
      ];

      const seedOrchestratorCalls = allCalls.filter(c => c[0] === 'SeedOrchestrator');
      expect(seedOrchestratorCalls.length).toBeGreaterThan(0);

      for (const call of seedOrchestratorCalls) {
        expect(call[1]).toBeTruthy();           // traceId is non-empty
        expect(call[1].length).toBeGreaterThan(0);
      }
    });
  });

  // ── 13. chunkIndex assigned 0-based per source file ──────────────────────

  describe('chunkIndex assignment', () => {
    it('assigns chunkIndex 0, 1, 2 to 3 chunks from the same source file', async () => {
      const fp = await writeTmpFile('core_rules', 'multi-chunk.txt', 'content');
      const rawChunks: RawChunk[] = [0, 1, 2].map(i =>
        makeRawChunk({ sourceFile: fp, content: `chunk content ${i}` })
      );

      const parser = createMockParser(true, rawChunks);
      const capturedChunks: PreparedChunk[] = [];
      const capturingInserter: IChunkInserter = {
        upsertBatch: vi.fn(async (chunks) => {
          capturedChunks.push(...chunks);
          return { inserted: chunks.length, updated: 0 };
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, capturingInserter, [parser]);
      await orchestrator.run(tmpRoot);

      const indices = capturedChunks.map(c => c.chunkIndex).sort((a, b) => a - b);
      expect(indices).toEqual([0, 1, 2]);
    });
  });

  // ── 14. First matching parser wins (multiple parsers) ────────────────────

  describe('parser selection', () => {
    it('uses the first parser that canParse returns true', async () => {
      const fp = await writeTmpFile('core_rules', 'select.txt', 'content');
      const chunk1 = makeRawChunk({ sourceFile: fp, content: 'from parser 1' });
      const chunk2 = makeRawChunk({ sourceFile: fp, content: 'from parser 2' });

      const parser1: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async () => [chunk1]),
      };
      const parser2: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async () => [chunk2]),
      };

      const capturedChunks: PreparedChunk[] = [];
      const capturingInserter: IChunkInserter = {
        upsertBatch: vi.fn(async (chunks) => {
          capturedChunks.push(...chunks);
          return { inserted: chunks.length, updated: 0 };
        }),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, capturingInserter, [parser1, parser2]);
      await orchestrator.run(tmpRoot);

      // Only parser1.parse should have been called, not parser2.parse
      expect(parser1.parse).toHaveBeenCalled();
      expect(parser2.parse).not.toHaveBeenCalled();
    });

    it('falls through to second parser when first returns canParse=false', async () => {
      const fp = await writeTmpFile('core_rules', 'fallthrough.txt', 'content');
      const chunk2 = makeRawChunk({ sourceFile: fp, content: 'from parser 2' });

      const parser1: IDocumentParser = {
        canParse: vi.fn(() => false),
        parse: vi.fn(async () => []),
      };
      const parser2: IDocumentParser = {
        canParse: vi.fn(() => true),
        parse: vi.fn(async () => [chunk2]),
      };

      const orchestrator = new SeedOrchestrator(logger, embeddingService, inserter, [parser1, parser2]);
      const report = await orchestrator.run(tmpRoot);

      expect(parser1.parse).not.toHaveBeenCalled();
      expect(parser2.parse).toHaveBeenCalled();
      expect(report.filesProcessed).toBe(1);
    });
  });
});
