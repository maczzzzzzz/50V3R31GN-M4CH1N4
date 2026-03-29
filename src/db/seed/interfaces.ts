import type { Namespace } from '../../shared/types/index.js';

/**
 * A parsed text chunk before embedding is generated.
 * Produced by document parsers; consumed by the SeedOrchestrator.
 */
export interface RawChunk {
  readonly sourceFile: string;     // relative path from docs/raw_data/ root
  readonly sourceRef: string;      // canonical reference (e.g., "CPRED-CRB-p12")
  readonly namespace: Namespace;
  readonly contextType: 'mechanic' | 'lore';
  readonly capabilityReq: string;  // e.g., 'math_resolution'
  readonly sectionHeading: string;
  readonly pageStart: number;      // 0 for non-PDF documents
  readonly pageEnd: number;        // 0 for non-PDF documents
  readonly content: string;
}

/**
 * A chunk with chunkIndex and tokenEstimate assigned — ready for embedding.
 */
export interface IndexedChunk extends RawChunk {
  readonly chunkIndex: number;
  readonly tokenEstimate: number;
}

/**
 * An IndexedChunk with its embedding vector attached — ready for DB upsert.
 */
export interface PreparedChunk extends IndexedChunk {
  readonly embedding: number[];
}

/**
 * Contract for document parsers. Each parser handles one or more file types.
 */
export interface IDocumentParser {
  /** Returns true if this parser can handle the given file path. */
  canParse(filePath: string): boolean;
  /** Parses the file and returns raw text chunks (no embedding yet). */
  parse(filePath: string, namespace: Namespace): Promise<RawChunk[]>;
}

/**
 * Splits a single long text string into overlapping chunks.
 */
export interface IChunkTextSplitter {
  split(
    text: string,
    opts: {
      sourceFile: string;
      sourceRef: string;
      namespace: Namespace;
      contextType: 'mechanic' | 'lore';
      capabilityReq: string;
      sectionHeading: string;
      pageStart: number;
      pageEnd: number;
    }
  ): RawChunk[];
}

/**
 * Inserts/upserts a batch of prepared chunks into Node A's pgvector.
 */
export interface IChunkInserter {
  upsertBatch(chunks: PreparedChunk[]): Promise<UpsertStats>;
}

export interface UpsertStats {
  readonly inserted: number;
  readonly updated: number;
}

/**
 * Top-level seed orchestration result.
 */
export interface SeedReport {
  readonly filesProcessed: number;
  readonly chunksInserted: number;
  readonly chunksUpdated: number;
  readonly filesSkipped: number;
  readonly errors: ReadonlyArray<{ file: string; error: string }>;
  readonly durationMs: number;
}

/**
 * Contract for the seed orchestrator.
 */
export interface ISeedOrchestrator {
  run(rawDataRoot: string): Promise<SeedReport>;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Target chunk size in characters (~512 tokens at 4 chars/token). */
export const TARGET_CHUNK_CHARS = 2048;

/** Overlap between consecutive chunks in characters (~50 tokens). */
export const CHUNK_OVERLAP_CHARS = 200;

/** Number of chunks per embedding batch (controls Ollama batch request size). */
export const EMBED_BATCH_SIZE = 20;

/** File extensions supported for ingestion. */
export const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.json', '.txt']);

/** Namespace → directory name mapping. */
export const NAMESPACE_DIRS: Record<Namespace, string> = {
  core_rules: 'core_rules',
  campaign_ttta: 'campaign_ttta',
  entities_mooks: 'entities_mooks',
};
