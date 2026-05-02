import Database from 'better-sqlite3';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { WorldCommandSchema, type WorldCommand } from '../shared/schemas/world-commands.schema.js';
import type { RagSearchParams, HealthCheckResult, ILogger } from './interfaces.js';
import { RagQueryResultSchema } from '../shared/schemas/index.js';
import { z } from 'zod';

export interface UnifiedOracleConfig {
  worldDbPath: string;
  crushDbPath: string;
}

/**
 * ◈ UNIFIED_ORACLE_CLIENT : Clean BASE
 *
 * Core state persistence for the Sovereign OS.
 * Manages the Artery of Truth (Triplets, RKG, State).
 */
export class UnifiedOracleClient {
  private _dbInternal: Database.Database | null = null;
  private get db(): Database.Database {
    if (!this._dbInternal) throw new Error('Database not connected');
    return this._dbInternal;
  }
  private readonly config: UnifiedOracleConfig;
  private readonly logger?: ILogger | undefined;
  private connected = false;

  public getRawDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Authorization Gate Callback.
   * If provided, executeTransaction will pause and wait for this to resolve.
   */
  public onAuthorize?: (commands: WorldCommand[]) => Promise<boolean>;

  constructor(config: UnifiedOracleConfig, logger?: ILogger) {
    this.config = config;
    this.logger = logger;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    const traceId = randomUUID();

    try {
      this._dbInternal = new Database(this.config.worldDbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('recursive_triggers = ON');
      
      // Attach crush db if it exists
      if (fs.existsSync(this.config.crushDbPath)) {
        this.db.prepare('ATTACH DATABASE ? AS session_memory').run(this.config.crushDbPath);
      }
      
      this.connected = true;
      await this.initSchema();
      this.logger?.info('UnifiedOracleClient', traceId, 'Connected to core world and session memory');
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, 'Failed to connect to databases', {
        error: (err as Error).message,
      });
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    const traceId = randomUUID();
    this._dbInternal?.close();
    this._dbInternal = null;
    this.connected = false;
    this.logger?.info('UnifiedOracleClient', traceId, 'Disconnected from databases');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      this.db.prepare('SELECT 1').get();
      return {
        connected: true,
        latencyMs: Math.round(performance.now() - start),
        pgvectorInstalled: false,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return {
        connected: false,
        latencyMs: Math.round(performance.now() - start),
        pgvectorInstalled: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async ragSearch(params: RagSearchParams): Promise<z.infer<typeof RagQueryResultSchema>> {
    const traceId = randomUUID();
    const { query, topK } = params;
    
    try {
      const results = this.db.prepare(`
        SELECT subject_id, predicate, object_literal
        FROM triplets_fts
        WHERE triplets_fts MATCH ?
        LIMIT ?
      `).all(query, topK) as any[];

      const matches = results.map((r) => ({
        content: `${r.subject_id} ${r.predicate}: ${r.object_literal}`,
        namespace: params.namespace,
        contextType: 'lore' as const,
        capabilityReq: 'none',
        sourceFile: 'unified-oracle',
        sourceRef: `triplet:${r.subject_id}`,
        sectionHeading: r.predicate,
        score: 1.0, // FTS5 score mock
        pageStart: 0,
        pageEnd: 0,
      }));

      return { query, matches };
    } catch (err) {
      this.logger?.warn('UnifiedOracleClient', traceId, 'RAG search failed or schema not initialized', {
        error: (err as Error).message,
        query,
      });
      return { query, matches: [] };
    }
  }

  private schemaInitialized = false;

  async initSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    this.schemaInitialized = true;
    const traceId = randomUUID();
    
    try {
      const schema = fs.readFileSync('packages/hermes-core/src/db/world-schema.sql', 'utf8');
      this.db.exec(schema);

      // ── Phase 34 Migration: Memory Palace ────────────────────────────────────
      const palaceSchema = fs.readFileSync('packages/hermes-core/src/db/palace-schema.sql', 'utf8');
      this.db.exec(palaceSchema);

      // ── Clean BASE Migration: Core Columns ───────────────────────────────────
      const coreColumns: { table: string; column: string }[] = [
        { table: 'locations',       column: 'district_id' },
        { table: 'triplets',        column: 'district_id' },
        { table: 'chronicle_seeds', column: 'district_id' },
      ];
      for (const { table, column } of coreColumns) {
        try {
          const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
          if (!cols.some(c => c.name === column)) {
            this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
          }
        } catch { /* table may not exist yet */ }
      }

      this.logger?.info('UnifiedOracleClient', traceId, 'Database schemas initialized successfully');
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, 'Failed to initialize database schemas', {
        error: (err as Error).message,
      });
      throw err;
    }
  }

  query<T = any>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  execute(sql: string, params: any[] = []): Database.RunResult {
    return this.db.prepare(sql).run(...params);
  }

  // ── Phase 19: Latent Seeding (R00TS) ─────────────────────────────────────

  upsertSeed(seed: {
    id: string;
    word: string;
    weight: number;
    category: 'mood' | 'faction' | 'event';
    district: string | null;
    vectorJson?: string;
  }): void {
    this.db.prepare(`
      INSERT INTO conceptual_seeds (id, word, weight, category, district, vector_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        word        = excluded.word,
        weight      = excluded.weight,
        category    = excluded.category,
        district    = excluded.district,
        vector_json = excluded.vector_json,
        updated_at  = CURRENT_TIMESTAMP
    `).run(
      seed.id,
      seed.word,
      seed.weight,
      seed.category,
      seed.district ?? null,
      seed.vectorJson ?? null,
    );
  }

  getSeedsForDistrict(
    district: string | null,
    limit = 10,
  ): Array<{ id: string; word: string; weight: number; category: string }> {
    if (district === null) {
      return this.db.prepare(`
        SELECT id, word, weight, category
        FROM conceptual_seeds
        WHERE district IS NULL
        ORDER BY weight DESC
        LIMIT ?
      `).all(limit) as Array<{ id: string; word: string; weight: number; category: string }>;
    }
    return this.db.prepare(`
      SELECT id, word, weight, category
      FROM conceptual_seeds
      WHERE district = ? OR district IS NULL
      ORDER BY weight DESC
      LIMIT ?
    `).all(district, limit) as Array<{ id: string; word: string; weight: number; category: string }>;
  }

  /**
   * Execute multiple commands within an atomic IMMEDIATE transaction.
   */
  async executeTransaction(commands: WorldCommand[]): Promise<void> {
    const traceId = randomUUID();

    if (this.onAuthorize) {
      const authorized = await this.onAuthorize(commands);
      if (!authorized) {
        this.logger?.warn('UnifiedOracleClient', traceId, 'Transaction REJECTED by human supervisor');
        return;
      }
    }

    const start = Date.now();
    const transaction = this.db.transaction((cmds: WorldCommand[]) => {
      for (const cmd of cmds) {
        this.applyCommandSync(cmd);
      }
    });

    try {
      transaction(commands);
      const duration = Date.now() - start;
      this.logger?.info('UnifiedOracleClient', traceId, 'Transaction committed', {
        commandCount: commands.length,
        durationMs: duration,
      });
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, 'Transaction failed, rolling back', {
        error: (err as Error).message,
      });
      throw err;
    }
  }

  async executeCommand(command: WorldCommand): Promise<void> {
    this.applyCommandSync(command);
  }

  private applyCommandSync(command: WorldCommand): void {
    const validated = WorldCommandSchema.parse(command);

    switch (validated.action) {
      case 'ADD_LORE': {
        const { subject, predicate, object } = validated;
        this.db.prepare('INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)')
          .run(subject, predicate, object);
        break;
      }
      // Note: UPDATE_NPC and TRANSFER_ITEM are handled by the RED Plugin sidecar.
    }
  }
}
