import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { ILogger, IEmbeddingService } from '../interfaces.js';
import type {
  IDocumentParser,
  IChunkInserter,
  ISeedOrchestrator,
  RawChunk,
  IndexedChunk,
  PreparedChunk,
  SeedReport,
} from './interfaces.js';
import {
  EMBED_BATCH_SIZE,
  NAMESPACE_DIRS,
  SUPPORTED_EXTENSIONS,
} from './interfaces.js';
import type { Namespace } from '../../shared/types/index.js';

const CONTEXT = 'SeedOrchestrator';

/**
 * SeedOrchestrator — top-level pipeline coordinator for the data ingestion flow.
 *
 * Pipeline:
 *   1. Scan each namespace directory under rawDataRoot for supported file types
 *   2. Dispatch to the first matching IDocumentParser → RawChunk[]
 *   3. Assign chunkIndex (0-based per source file) + tokenEstimate (chars / 4)
 *   4. Embed in batches of EMBED_BATCH_SIZE via IEmbeddingService.embedBatch()
 *   5. Assemble PreparedChunk[] and call IChunkInserter.upsertBatch()
 *   6. Return SeedReport with totals
 */
export class SeedOrchestrator implements ISeedOrchestrator {
  private readonly logger: ILogger;
  private readonly embeddingService: IEmbeddingService;
  private readonly inserter: IChunkInserter;
  private readonly parsers: IDocumentParser[];

  constructor(
    logger: ILogger,
    embeddingService: IEmbeddingService,
    inserter: IChunkInserter,
    parsers: IDocumentParser[],
  ) {
    this.logger = logger;
    this.embeddingService = embeddingService;
    this.inserter = inserter;
    this.parsers = parsers;
  }

  async run(rawDataRoot: string): Promise<SeedReport> {
    const traceId = randomUUID();
    const startMs = Date.now();

    this.logger.info(CONTEXT, traceId, 'SeedOrchestrator run started', { rawDataRoot });

    let filesProcessed = 0;
    let filesSkipped = 0;
    let chunksInserted = 0;
    let chunksUpdated = 0;
    const errors: Array<{ file: string; error: string }> = [];

    // Collect all raw chunks from all namespaces
    const allRawChunks: RawChunk[] = [];

    for (const [namespace, dirName] of Object.entries(NAMESPACE_DIRS) as Array<[Namespace, string]>) {
      const nsDir = path.join(rawDataRoot, dirName);

      this.logger.debug(CONTEXT, traceId, `Scanning namespace directory`, { namespace, nsDir });

      let entries: string[];
      try {
        entries = await fs.readdir(nsDir);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(CONTEXT, traceId, `Could not read namespace directory, skipping`, {
          namespace,
          nsDir,
          error: message,
        });
        continue;
      }

      for (const entry of entries) {
        const filePath = path.join(nsDir, entry);
        const ext = path.extname(entry).toLowerCase();

        // Silently skip unsupported extensions
        if (!SUPPORTED_EXTENSIONS.has(ext)) {
          this.logger.debug(CONTEXT, traceId, `Skipping unsupported extension`, { filePath, ext });
          continue;
        }

        // Find first matching parser
        const parser = this.parsers.find(p => p.canParse(filePath));
        if (parser === undefined) {
          this.logger.debug(CONTEXT, traceId, `No parser found for file, skipping silently`, { filePath });
          continue;
        }

        // Parse the file
        let rawChunks: RawChunk[];
        try {
          rawChunks = await parser.parse(filePath, namespace);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(CONTEXT, traceId, `Parser threw for file, skipping`, {
            filePath,
            error: message,
          });
          filesSkipped++;
          errors.push({ file: filePath, error: message });
          continue;
        }

        if (rawChunks.length === 0) {
          this.logger.debug(CONTEXT, traceId, `Parser produced 0 chunks for file`, { filePath });
          continue;
        }

        filesProcessed++;
        allRawChunks.push(...rawChunks);

        this.logger.debug(CONTEXT, traceId, `Parsed file successfully`, {
          filePath,
          chunkCount: rawChunks.length,
        });
      }
    }

    this.logger.info(CONTEXT, traceId, `Scan complete`, {
      filesProcessed,
      filesSkipped,
      totalRawChunks: allRawChunks.length,
    });

    if (allRawChunks.length === 0) {
      const durationMs = Date.now() - startMs;
      this.logger.info(CONTEXT, traceId, 'No chunks to embed or insert', { durationMs });
      return {
        filesProcessed,
        chunksInserted,
        chunksUpdated,
        filesSkipped,
        errors,
        durationMs,
      };
    }

    // Assign chunkIndex and tokenEstimate per source file
    const indexedChunks = this.assignIndices(allRawChunks);

    // Embed in batches and assemble PreparedChunks
    const preparedChunks: PreparedChunk[] = [];

    for (let batchStart = 0; batchStart < indexedChunks.length; batchStart += EMBED_BATCH_SIZE) {
      const batch = indexedChunks.slice(batchStart, batchStart + EMBED_BATCH_SIZE);
      const texts = batch.map(c => c.content);

      let embeddings: number[][];
      try {
        embeddings = await this.embeddingService.embedBatch(texts);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(CONTEXT, traceId, `embedBatch failed for batch, skipping batch`, {
          batchStart,
          batchSize: batch.length,
          error: message,
        });

        // Add each chunk's source file to errors
        for (const chunk of batch) {
          errors.push({ file: chunk.sourceFile, error: message });
        }
        continue;
      }

      for (let i = 0; i < batch.length; i++) {
        const chunk = batch[i];
        const embedding = embeddings[i];
        if (chunk === undefined || embedding === undefined) continue;

        preparedChunks.push({ ...chunk, embedding });
      }
    }

    this.logger.info(CONTEXT, traceId, `Embedding complete`, {
      preparedChunks: preparedChunks.length,
    });

    // Upsert all prepared chunks
    if (preparedChunks.length > 0) {
      try {
        const stats = await this.inserter.upsertBatch(preparedChunks);
        chunksInserted += stats.inserted;
        chunksUpdated += stats.updated;

        this.logger.info(CONTEXT, traceId, `Upsert complete`, {
          inserted: stats.inserted,
          updated: stats.updated,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(CONTEXT, traceId, `upsertBatch failed`, { error: message });
        for (const chunk of preparedChunks) {
          errors.push({ file: chunk.sourceFile, error: message });
        }
      }
    }

    const durationMs = Date.now() - startMs;

    this.logger.info(CONTEXT, traceId, 'SeedOrchestrator run complete', {
      filesProcessed,
      filesSkipped,
      chunksInserted,
      chunksUpdated,
      errorCount: errors.length,
      durationMs,
    });

    return {
      filesProcessed,
      chunksInserted,
      chunksUpdated,
      filesSkipped,
      errors,
      durationMs,
    };
  }

  /**
   * Groups RawChunks by sourceFile and assigns 0-based chunkIndex
   * and tokenEstimate (ceil(content.length / 4)) to each chunk.
   */
  private assignIndices(rawChunks: RawChunk[]): IndexedChunk[] {
    // Invariant: each IDocumentParser.parse() call yields all chunks for a single
    // sourceFile in one synchronous return. This means chunks for any given file
    // are already contiguous in rawChunks, so re-grouping here is order-preserving.
    // If a future parser violates this (yields chunks for multiple files), the
    // chunkIndex assignment will still be correct — but embedding order may differ
    // from parse order.
    const byFile = new Map<string, RawChunk[]>();

    for (const chunk of rawChunks) {
      const arr = byFile.get(chunk.sourceFile) ?? [];
      arr.push(chunk);
      byFile.set(chunk.sourceFile, arr);
    }

    const indexedChunks: IndexedChunk[] = [];
    for (const chunks of byFile.values()) {
      chunks.forEach((chunk, i) => {
        indexedChunks.push({
          ...chunk,
          chunkIndex: i,
          tokenEstimate: Math.ceil(chunk.content.length / 4),
        });
      });
    }

    return indexedChunks;
  }
}
