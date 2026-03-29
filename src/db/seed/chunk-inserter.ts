import pg from 'pg';
import { randomUUID } from 'node:crypto';
import type { ILogger } from '../interfaces.js';
import type { IChunkInserter, PreparedChunk, UpsertStats } from './interfaces.js';
import { EMBED_BATCH_SIZE } from './interfaces.js';

const UPSERT_SQL = `
INSERT INTO pdf_chunks (
  source_file, source_ref, namespace, context_type, capability_req,
  section_heading, page_start, page_end, content, chunk_index,
  token_estimate, embedding
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::vector)
ON CONFLICT (source_file, chunk_index) DO UPDATE SET
  source_ref      = EXCLUDED.source_ref,
  namespace       = EXCLUDED.namespace,
  context_type    = EXCLUDED.context_type,
  capability_req  = EXCLUDED.capability_req,
  section_heading = EXCLUDED.section_heading,
  page_start      = EXCLUDED.page_start,
  page_end        = EXCLUDED.page_end,
  content         = EXCLUDED.content,
  token_estimate  = EXCLUDED.token_estimate,
  embedding       = EXCLUDED.embedding
RETURNING xmax
`.trim();

/**
 * ChunkInserter — Upserts batches of PreparedChunk into Node A's pgvector table.
 *
 * - Receives an already-connected pg.Pool via constructor (does NOT own lifecycle).
 * - Processes chunks in batches of up to EMBED_BATCH_SIZE per transaction.
 * - Returns UpsertStats counting inserted (xmax=0) vs updated (xmax!=0) rows.
 * - On pg error: rolls back, logs with traceId, and re-throws.
 */
export class ChunkInserter implements IChunkInserter {
  private readonly pool: pg.Pool;
  private readonly logger: ILogger;

  constructor(pool: pg.Pool, logger: ILogger) {
    this.pool = pool;
    this.logger = logger;
  }

  async upsertBatch(chunks: PreparedChunk[]): Promise<UpsertStats> {
    if (chunks.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    const traceId = randomUUID();
    let inserted = 0;
    let updated = 0;

    this.logger.info('ChunkInserter', traceId, `Starting upsert of ${chunks.length} chunks`, {
      chunkCount: chunks.length,
      batchSize: EMBED_BATCH_SIZE,
    });

    // Split into batches of up to EMBED_BATCH_SIZE
    for (let batchStart = 0; batchStart < chunks.length; batchStart += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(batchStart, batchStart + EMBED_BATCH_SIZE);
      const batchStats = await this.upsertSingleBatch(batch, traceId);
      inserted += batchStats.inserted;
      updated += batchStats.updated;
    }

    this.logger.info('ChunkInserter', traceId, `Upsert complete: ${inserted} inserted, ${updated} updated`, {
      inserted,
      updated,
    });

    return { inserted, updated };
  }

  private async upsertSingleBatch(
    batch: PreparedChunk[],
    traceId: string,
  ): Promise<UpsertStats> {
    let client: pg.PoolClient | undefined;

    try {
      client = await this.pool.connect();
      await client.query('BEGIN');

      let inserted = 0;
      let updated = 0;

      for (const chunk of batch) {
        const embeddingStr = '[' + chunk.embedding.join(',') + ']';
        const params: unknown[] = [
          chunk.sourceFile,
          chunk.sourceRef,
          chunk.namespace,
          chunk.contextType,
          chunk.capabilityReq,
          chunk.sectionHeading,
          chunk.pageStart,
          chunk.pageEnd,
          chunk.content,
          chunk.chunkIndex,
          chunk.tokenEstimate,
          embeddingStr,
        ];

        const result = await client.query<{ xmax: string }>(UPSERT_SQL, params);

        for (const row of result.rows) {
          if (row.xmax === '0') {
            inserted++;
          } else {
            updated++;
          }
        }
      }

      await client.query('COMMIT');

      this.logger.debug('ChunkInserter', traceId, `Batch committed: ${inserted} inserted, ${updated} updated`, {
        batchSize: batch.length,
        inserted,
        updated,
      });

      return { inserted, updated };
    } catch (err) {
      try {
        await client?.query('ROLLBACK');
      } catch {
        // ignore: rollback failure must not mask the original error
      }

      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('ChunkInserter', traceId, `Batch upsert failed, rolled back: ${message}`, {
        stack: err instanceof Error ? err.stack : undefined,
        batchSize: batch.length,
        firstSourceFile: batch[0]?.sourceFile,
        firstChunkIndex: batch[0]?.chunkIndex,
      });

      throw err;
    } finally {
      client?.release();
    }
  }
}
