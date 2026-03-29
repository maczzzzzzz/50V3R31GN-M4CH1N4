import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { NamespaceEnum, RagQueryResultSchema, RagMatchSchema } from '../shared/schemas/index.js';
import type {
  NitroDbConfig,
  ILogger,
  IEmbeddingService,
  INitroDbClient,
  RagSearchParams,
  HealthCheckResult,
} from './interfaces.js';

/** Zod schema for validating NitroDbConfig at construction time. */
const NitroDbConfigSchema = z.object({
  host: z.string().min(1, 'host must not be empty'),
  port: z.number().int().min(1).max(65535, 'port must be 1-65535'),
  database: z.string().min(1, 'database must not be empty'),
  user: z.string().min(1, 'user must not be empty'),
  password: z.string(),
  connectionTimeoutMs: z.number().int().min(1, 'connectionTimeoutMs must be >= 1'),
  queryTimeoutMs: z.number().int().min(1, 'queryTimeoutMs must be >= 1'),
  maxPoolSize: z.number().int().min(1, 'maxPoolSize must be >= 1'),
});

/** Zod schema for validating ragSearch input parameters. */
const RagSearchParamsSchema = z.object({
  query: z.string().min(1, 'query must not be empty'),
  namespace: NamespaceEnum,
  topK: z.number().int().min(1, 'topK must be >= 1'),
  similarityThreshold: z.number().min(0).max(1, 'similarityThreshold must be 0-1'),
});

/**
 * NitroDbClient — The Lore Bridge to Node A's pgvector database.
 *
 * Handles namespace-isolated RAG queries against the PostgreSQL/pgvector
 * instance running on the Nitro 5 (192.168.0.50:5432).
 *
 * All responses from Node A are treated as untrusted input and validated
 * through Zod schemas before returning to the caller (Zero-Trust AI Bridging).
 */
export class NitroDbClient implements INitroDbClient {
  private pool: pg.Pool | null = null;
  private readonly config: NitroDbConfig;
  private readonly logger: ILogger;
  private readonly embeddingService: IEmbeddingService;
  private connected = false;

  constructor(config: NitroDbConfig, logger: ILogger, embeddingService: IEmbeddingService) {
    const parsed = NitroDbConfigSchema.safeParse(config);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new Error(`NitroDbClient config validation failed: ${firstIssue?.message ?? 'unknown error'}`);
    }

    this.config = Object.freeze({ ...parsed.data }) as NitroDbConfig;
    this.logger = logger;
    this.embeddingService = embeddingService;

    const initTraceId = randomUUID();
    this.logger.info('NitroDbClient', initTraceId, `Initialized for ${this.config.host}:${this.config.port}/${this.config.database}`, {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      maxPoolSize: this.config.maxPoolSize,
    });
  }

  /**
   * Establishes the connection pool to Node A's PostgreSQL instance.
   * Verifies connectivity with a test query.
   */
  async connect(): Promise<void> {
    const traceId = randomUUID();

    if (this.connected) {
      this.logger.warn('NitroDbClient', traceId, 'connect() called while already connected');
      return;
    }

    this.logger.info('NitroDbClient', traceId, 'Establishing connection pool to Node A', {
      host: this.config.host,
      port: this.config.port,
    });

    try {
      this.pool = new pg.Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        max: this.config.maxPoolSize,
        connectionTimeoutMillis: this.config.connectionTimeoutMs,
        statement_timeout: this.config.queryTimeoutMs,
      });

      // Verify connectivity
      const testClient = await this.pool.connect();
      await testClient.query('SELECT 1');
      testClient.release();

      this.connected = true;
      this.logger.info('NitroDbClient', traceId, 'Connection pool established successfully');
    } catch (err) {
      this.connected = false;
      this.pool = null;

      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('NitroDbClient', traceId, `Failed to connect to Node A: ${message}`, {
        host: this.config.host,
        port: this.config.port,
        stack: err instanceof Error ? err.stack : undefined,
      });

      throw new Error(`NitroDbClient connection failed: ${message}`);
    }
  }

  /**
   * Drains the connection pool and disconnects from Node A.
   * Always resets internal state even if pool.end() throws.
   */
  async disconnect(): Promise<void> {
    const traceId = randomUUID();

    if (!this.connected || !this.pool) {
      throw new Error('NitroDbClient is not connected');
    }

    this.logger.info('NitroDbClient', traceId, 'Draining connection pool');

    try {
      await this.pool.end();
      this.logger.info('NitroDbClient', traceId, 'Disconnected from Node A');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('NitroDbClient', traceId, `Error during disconnect: ${message}`, {
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    } finally {
      // Always reset state regardless of pool.end() outcome (#10)
      this.pool = null;
      this.connected = false;
    }
  }

  /**
   * Returns current connection state.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Returns the underlying pg.Pool for use by components that need direct
   * pool access (e.g., ChunkInserter during seeding).
   *
   * @throws Error if connect() has not been called yet.
   */
  getPool(): pg.Pool {
    if (this.pool === null) {
      throw new Error('NitroDbClient is not connected — call connect() first');
    }
    return this.pool;
  }

  /**
   * Performs a health check against Node A: connectivity + pgvector extension.
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const traceId = randomUUID();
    const start = performance.now();

    if (!this.connected || !this.pool) {
      return {
        connected: false,
        latencyMs: 0,
        pgvectorInstalled: false,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const client = await this.pool.connect();

      try {
        await client.query('SELECT 1');
        const extResult = await client.query<{ extname: string }>(
          "SELECT extname FROM pg_extension WHERE extname = 'vector'"
        );

        const latencyMs = Math.round(performance.now() - start);
        const pgvectorInstalled = extResult.rows.length > 0;

        this.logger.info('NitroDbClient', traceId, 'Health check passed', {
          latencyMs,
          pgvectorInstalled,
        });

        return {
          connected: true,
          latencyMs,
          pgvectorInstalled,
          timestamp: new Date().toISOString(),
        };
      } finally {
        client.release();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('NitroDbClient', traceId, `Health check failed: ${message}`);

      return {
        connected: false,
        latencyMs: Math.round(performance.now() - start),
        pgvectorInstalled: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Executes a namespace-isolated vector similarity search against Node A's
   * pgvector database. All responses are validated through Zod (Zero-Trust).
   *
   * Embedding failures (Node B/Ollama unavailable) propagate immediately.
   * Only Node A SQL failures are caught for graceful degradation.
   *
   * @param params - Search parameters including query, namespace, topK, and threshold.
   * @returns Validated RagQueryResult with matched chunks.
   * @throws On invalid params, missing connection, or Ollama embedding failure.
   */
  async ragSearch(params: RagSearchParams): Promise<z.infer<typeof RagQueryResultSchema>> {
    const traceId = randomUUID();

    // Validate input parameters
    const parsedParams = RagSearchParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      const firstIssue = parsedParams.error.issues[0];
      const field = firstIssue?.path[0] ?? 'unknown';
      throw new Error(`ragSearch validation failed on '${String(field)}': ${firstIssue?.message ?? 'unknown error'}`);
    }

    if (!this.connected || !this.pool) {
      throw new Error('NitroDbClient is not connected — call connect() first');
    }

    const { query, namespace, topK, similarityThreshold } = parsedParams.data;

    this.logger.info('NitroDbClient', traceId, `RAG search: namespace=${namespace}, topK=${topK}`, {
      query: query.substring(0, 100),
      namespace,
      topK,
      similarityThreshold,
    });

    // Step 1: Vectorize query via Node B's Ollama — intentionally OUTSIDE the SQL
    // try/catch so embedding failures propagate immediately rather than silently
    // returning an empty result set (#1).
    this.logger.info('NitroDbClient', traceId, 'Generating query embedding via Ollama');
    const queryVector = await this.embeddingService.embed(query);
    const vectorLiteral = `[${queryVector.join(',')}]`;

    // Step 2: Execute cosine similarity search against Node A's pgvector.
    // Only this block is subject to graceful degradation (Node A unreachable).
    try {
      const client = await this.pool.connect();

      try {
        // CAST AS FLOAT8 ensures node-postgres parses similarity as a JS number
        // rather than a string. Without this, pgvector returns the computed
        // expression as text and RagMatchSchema's z.number() rejects it (#2).
        //
        // Subquery pattern computes the similarity expression once rather than
        // twice (avoids duplicate operator cost in WHERE + ORDER BY) (#5).
        const result = await client.query<{
          content: string;
          namespace: string;
          context_type: 'mechanic' | 'lore';
          capability_req: string;
          source_file: string;
          source_ref: string;
          section_heading: string;
          similarity: number;
          page_start: number;
          page_end: number;
        }>(
          `SELECT content, namespace, context_type, capability_req, source_file, source_ref, section_heading,
                  similarity, page_start, page_end
           FROM (
             SELECT content, namespace, context_type, capability_req, source_file, source_ref, section_heading,
                    CAST(1 - (embedding <=> $1::vector) AS FLOAT8) AS similarity,
                    page_start, page_end
             FROM pdf_chunks
             WHERE namespace = $2
           ) sub
           WHERE similarity >= $3
           ORDER BY similarity DESC
           LIMIT $4`,
          [vectorLiteral, namespace, similarityThreshold, topK]
        );

        // Zero-Trust: validate each row from Node A through Zod
        const matches = result.rows.map((row, index) => {
          const matchData = {
            content: row.content,
            namespace: row.namespace,
            contextType: row.context_type,
            capabilityReq: row.capability_req,
            sourceFile: row.source_file,
            sourceRef: row.source_ref,
            sectionHeading: row.section_heading,
            score: row.similarity,
            pageStart: row.page_start,
            pageEnd: row.page_end,
          };

          const parsed = RagMatchSchema.safeParse(matchData);
          if (!parsed.success) {
            this.logger.warn('NitroDbClient', traceId, `Row ${index} failed Zod validation, skipping`, {
              errors: parsed.error.issues.map(i => i.message),
              rawRow: matchData,
            });
            return null;
          }

          return parsed.data;
        }).filter((m): m is z.infer<typeof RagMatchSchema> => m !== null);

        const response = { query, matches };

        // Final envelope validation
        const validatedResponse = RagQueryResultSchema.safeParse(response);
        if (!validatedResponse.success) {
          this.logger.error('NitroDbClient', traceId, 'Final response envelope failed Zod validation', {
            errors: validatedResponse.error.issues.map(i => i.message),
          });
          throw new Error('Node A returned data that failed schema validation');
        }

        this.logger.info('NitroDbClient', traceId, `RAG search returned ${matches.length} matches`, {
          matchCount: matches.length,
          namespace,
        });

        return validatedResponse.data;
      } finally {
        client.release();
      }
    } catch (err) {
      // Re-throw data integrity failures — these are not Node A availability issues
      if (err instanceof Error && err.message.includes('schema validation')) {
        throw err;
      }

      // Graceful degradation: Node A SQL/network failure returns empty result
      // rather than crashing Node B. Embedding failures above DO propagate.
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('NitroDbClient', traceId, `RAG search (SQL) failed: ${message}`, {
        namespace,
        query: query.substring(0, 100),
        stack: err instanceof Error ? err.stack : undefined,
      });

      return { query, matches: [] };
    }
  }
}
