import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

import { NitroDbClient } from '../db/nitro-db-client.js';
import { OllamaEmbeddingService } from '../db/ollama-embedding-service.js';
import { ChunkInserter } from '../db/seed/chunk-inserter.js';
import { PdfFileParser } from '../db/seed/pdf-file-parser.js';
import { FoundryJsonParser } from '../db/seed/foundry-json-parser.js';
import { TxtFileParser } from '../db/seed/txt-file-parser.js';
import { SeedOrchestrator } from '../db/seed/seed-orchestrator.js';
import type { ILogger, IEmbeddingService } from '../db/interfaces.js';
import type { SeedReport } from '../db/seed/interfaces.js';

// ── Structured JSON logger ────────────────────────────────────────────────────

const logger: ILogger = {
  debug(context, traceId, message, data) {
    process.stdout.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'DEBUG',
        context,
        traceId,
        message,
        ...(data ? { data } : {}),
      }) + '\n',
    );
  },
  info(context, traceId, message, data) {
    process.stdout.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        context,
        traceId,
        message,
        ...(data ? { data } : {}),
      }) + '\n',
    );
  },
  warn(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'WARN',
        context,
        traceId,
        message,
        ...(data ? { data } : {}),
      }) + '\n',
    );
  },
  error(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context,
        traceId,
        message,
        ...(data ? { data } : {}),
      }) + '\n',
    );
  },
};

// ── Throttled Embedding Service ───────────────────────────────────────────────

/**
 * Wraps IEmbeddingService to insert a configurable delay after each
 * embedBatch() call. Protects Node B's Ollama/Mistral-Nemo VRAM during long
 * seeding sessions (per 2026-03-29_Phase-1-2-Execution-Roadmap.md §3).
 */
class ThrottledEmbeddingService implements IEmbeddingService {
  private readonly inner: IEmbeddingService;
  private readonly batchDelayMs: number;

  constructor(inner: IEmbeddingService, batchDelayMs: number) {
    this.inner = inner;
    this.batchDelayMs = batchDelayMs;
  }

  embed(text: string): Promise<number[]> {
    return this.inner.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const result = await this.inner.embedBatch(texts);
    await new Promise<void>(resolve => setTimeout(resolve, this.batchDelayMs));
    return result;
  }

  getDimensions(): number | null {
    return this.inner.getDimensions();
  }
}

// ── Schema Initialisation ─────────────────────────────────────────────────────

/**
 * nomic-embed-text produces 768-dimensional vectors.
 * This constant must match the Ollama embedding model configured at runtime.
 */
const EMBEDDING_DIMENSIONS = 768;

const INIT_SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pdf_chunks (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  source_file    TEXT        NOT NULL,
  source_ref     TEXT        NOT NULL,
  namespace      TEXT        NOT NULL,
  context_type   TEXT        NOT NULL,
  capability_req TEXT        NOT NULL DEFAULT 'none',
  section_heading TEXT       NOT NULL,
  page_start     INTEGER     NOT NULL,
  page_end       INTEGER     NOT NULL,
  content        TEXT        NOT NULL,
  chunk_index    INTEGER     NOT NULL,
  token_estimate INTEGER     NOT NULL,
  embedding      vector(${EMBEDDING_DIMENSIONS}),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT pdf_chunks_pkey
    PRIMARY KEY (id),

  CONSTRAINT pdf_chunks_source_chunk_uniq
    UNIQUE (source_file, chunk_index),

  CONSTRAINT pdf_chunks_namespace_check
    CHECK (namespace IN ('core_rules', 'campaign_ttta', 'entities_mooks')),

  CONSTRAINT pdf_chunks_context_type_check
    CHECK (context_type IN ('mechanic', 'lore'))
);

CREATE INDEX IF NOT EXISTS pdf_chunks_namespace_idx ON pdf_chunks (namespace);

CREATE INDEX IF NOT EXISTS pdf_chunks_embedding_hnsw_idx
  ON pdf_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
`.trim();

async function initSchema(pool: pg.Pool, traceId: string): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info('run-seed', traceId, 'Initialising database schema on Node A');
    await client.query(INIT_SCHEMA_SQL);
    logger.info('run-seed', traceId, 'Schema initialised successfully', {
      embeddingDimensions: EMBEDDING_DIMENSIONS,
    });
  } finally {
    client.release();
  }
}

// ── Human-Readable Report ─────────────────────────────────────────────────────

function printReport(report: SeedReport): void {
  const divider = '─'.repeat(52);
  const status = report.errors.length === 0 ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ERRORS';

  console.log(`\n${divider}`);
  console.log('  ASP.GM-Agent — Seed Run Report');
  console.log(divider);
  console.log(`  Status           : ${status}`);
  console.log(`  Files processed  : ${report.filesProcessed}`);
  console.log(`  Files skipped    : ${report.filesSkipped}`);
  console.log(`  Chunks inserted  : ${report.chunksInserted}`);
  console.log(`  Chunks updated   : ${report.chunksUpdated}`);
  console.log(`  Errors           : ${report.errors.length}`);
  console.log(`  Duration         : ${(report.durationMs / 1000).toFixed(2)}s`);

  if (report.errors.length > 0) {
    console.log(`\n  Error Details:`);
    for (const e of report.errors) {
      console.log(`    • ${e.file}`);
      console.log(`      ${e.error}`);
    }
  }

  console.log(`${divider}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const traceId = randomUUID();

  // Resolve rawDataRoot relative to this file (src/scripts/ → docs/raw_data/)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rawDataRoot = path.resolve(__dirname, '../../docs/raw_data');

  logger.info('run-seed', traceId, 'ASP.GM-Agent seed run starting', { rawDataRoot });

  // ── Configuration (env vars override defaults) ────────────────────────────
  const dbConfig = {
    host: process.env.NODE_A_HOST ?? '192.168.0.50',
    port: parseInt(process.env.NODE_A_PORT ?? '5432', 10),
    database: process.env.NODE_A_DB ?? 'nitro_db',
    user: process.env.NODE_A_USER ?? 'nitro_admin',
    password: process.env.NODE_A_PASSWORD ?? '',
    connectionTimeoutMs: 10_000,
    queryTimeoutMs: 30_000,
    maxPoolSize: 3,
  };

  const embeddingConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    model: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
    timeoutMs: 60_000,
  };

  // ── Dependency wiring ─────────────────────────────────────────────────────
  // rawEmbeddingService → NitroDbClient (used for single-embed RAG queries)
  // throttledEmbeddingService → SeedOrchestrator (200ms inter-batch delay)
  const rawEmbeddingService = new OllamaEmbeddingService(embeddingConfig, logger);
  const throttledEmbeddingService = new ThrottledEmbeddingService(rawEmbeddingService, 200);
  const dbClient = new NitroDbClient(dbConfig, logger, rawEmbeddingService);

  try {
    // ── Connect to Node A ─────────────────────────────────────────────────
    logger.info('run-seed', traceId, `Connecting to Node A`, {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
    });
    await dbClient.connect();

    // ── Health check ──────────────────────────────────────────────────────
    const health = await dbClient.healthCheck();
    if (!health.connected || !health.pgvectorInstalled) {
      throw new Error(
        `Node A health check failed — connected=${health.connected}, pgvector=${health.pgvectorInstalled}`,
      );
    }
    logger.info('run-seed', traceId, 'Node A health check passed', {
      latencyMs: health.latencyMs,
    });

    // ── Ensure pdf_chunks table exists ────────────────────────────────────
    await initSchema(dbClient.getPool(), traceId);

    // ── Wire seed pipeline ────────────────────────────────────────────────
    const inserter = new ChunkInserter(dbClient.getPool(), logger);
    const parsers = [
      new PdfFileParser(),
      new TxtFileParser(),
      new FoundryJsonParser(),
    ];
    const orchestrator = new SeedOrchestrator(
      logger,
      throttledEmbeddingService,
      inserter,
      parsers,
    );

    // ── Execute seed ──────────────────────────────────────────────────────
    logger.info('run-seed', traceId, 'Launching SeedOrchestrator');
    const report = await orchestrator.run(rawDataRoot);

    // ── Print human-readable report ───────────────────────────────────────
    printReport(report);

    if (report.errors.length > 0) {
      logger.warn('run-seed', traceId, `Seed completed with ${report.errors.length} file errors`, {
        errorCount: report.errors.length,
      });
      process.exitCode = 1;
    } else {
      logger.info('run-seed', traceId, 'Seed completed successfully — Node A vector store populated');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('run-seed', traceId, `Seed run FAILED: ${message}`, {
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exitCode = 1;
  } finally {
    if (dbClient.isConnected()) {
      await dbClient.disconnect().catch(disconnectErr => {
        const message = disconnectErr instanceof Error ? disconnectErr.message : String(disconnectErr);
        logger.error('run-seed', traceId, `Disconnect failed: ${message}`);
      });
    }
  }
}

main().catch(err => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
