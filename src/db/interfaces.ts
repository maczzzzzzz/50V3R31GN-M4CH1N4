import type { z } from 'zod';
import type { NamespaceEnum, RagQueryResultSchema } from '../shared/schemas/index.js';

/** Configuration required to connect to Node A's PostgreSQL instance. */
export interface NitroDbConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  /** Connection timeout in milliseconds. */
  readonly connectionTimeoutMs: number;
  /** Query timeout in milliseconds. */
  readonly queryTimeoutMs: number;
  /** Maximum number of clients in the pool. */
  readonly maxPoolSize: number;
}

/** Structured log entry for observability. */
export interface LogEntry {
  readonly timestamp: string;
  readonly severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  readonly context: string;
  readonly traceId: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
}

/**
 * Logger interface for dependency injection.
 *
 * `traceId` is a required second parameter on every method so that TypeScript
 * enforces its presence at every call site. This ensures every log line carries
 * a traceable ID as required by CLAUDE.md §10. Pass `randomUUID()` at the top
 * of each operation; for constructor-time logs generate one inline.
 */
export interface ILogger {
  debug(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  info(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  warn(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
  error(context: string, traceId: string, message: string, data?: Record<string, unknown>): void;
}

/** Parameters for a namespace-filtered vector similarity search. */
export interface RagSearchParams {
  readonly query: string;
  readonly namespace: z.infer<typeof NamespaceEnum>;
  readonly topK: number;
  readonly similarityThreshold: number;
}

/** Health check result from the database. */
export interface HealthCheckResult {
  readonly connected: boolean;
  readonly latencyMs: number;
  readonly pgvectorInstalled: boolean;
  readonly timestamp: string;
}

/** Configuration for the SovereignNarrative embedding service on Node B. */
export interface EmbeddingServiceConfig {
  /** Base URL (e.g., http://localhost:8080/v1). */  readonly baseUrl: string;
  /** Model name as shown by `sovereignNarrative list` (e.g., nomic-embed-text). */
  readonly model: string;
  /** Request timeout in milliseconds. */
  readonly timeoutMs: number;
}

/** Contract for text-to-vector embedding generation. */
export interface IEmbeddingService {
  /** Convert a single text string into a float vector. */
  embed(text: string): Promise<number[]>;
  /** Convert multiple text strings into float vectors (batch). */
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Returns the dimensionality of the embedding model (e.g., 768). */
  getDimensions(): number | null;
}

/** Contract for the Nitro DB client. */
export interface INitroDbClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  ragSearch(params: RagSearchParams): Promise<z.infer<typeof RagQueryResultSchema>>;
  isConnected(): boolean;
}
