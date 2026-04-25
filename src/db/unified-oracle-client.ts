import Database from 'better-sqlite3';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { WorldCommandSchema, type WorldCommand } from '../shared/schemas/world-commands.schema.js';
import type { RagSearchParams, HealthCheckResult, ILogger } from './interfaces.js';
import { RagQueryResultSchema } from '../shared/schemas/index.js';
import { z } from 'zod';

export interface PlayerHousing {
  actor_id: string;
  housing_tier: 'street' | 'coffin' | 'apartment' | 'luxury';
  monthly_rent_eb: number;
  eb_balance: number;
}

export interface PlayerHousingUpdate {
  housing_tier?: PlayerHousing['housing_tier'];
  monthly_rent_eb?: number;
  eb_balance?: number;
}

export interface UnifiedOracleConfig {
  worldDbPath: string;
  crushDbPath: string;
}

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
      this.logger?.info('UnifiedOracleClient', traceId, 'Connected to world and crush databases', {
        worldDbPath: this.config.worldDbPath,
        crushDbPath: this.config.crushDbPath,
      });
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, 'Failed to connect to databases', {
        error: (err as Error).message,
        config: this.config,
      });
      throw err;
    }
  }

  /**
   * Initializes a 10x10 grid for a faction to enable influence propagation.
   * Required for the Phase 6 Pulse Engine.
   */
  async seedDistrictGrid(factionName: string): Promise<void> {
    const traceId = randomUUID();
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO district_grid (x, y, faction_name, strength) VALUES (?, ?, ?, 0)'
    );
    const transaction = this.db.transaction(() => {
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          stmt.run(x, y, factionName);
        }
      }
    });
    
    try {
      transaction();
      this.logger?.info('UnifiedOracleClient', traceId, `Seeded district grid for faction: ${factionName}`);
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, `Failed to seed district grid for faction: ${factionName}`, {
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
        pgvectorInstalled: false, // SQLite doesn't use pgvector
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
        score: r.distance !== undefined ? 1.0 - r.distance : 0.0,
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
      const schema = fs.readFileSync('src/db/world-schema.sql', 'utf8');
      this.db.exec(schema);

      // ── Phase 34 Migration: Memory Palace ────────────────────────────────────
      const palaceSchema = fs.readFileSync('src/db/palace-schema.sql', 'utf8');
      this.db.exec(palaceSchema);

      // ── Phase 47 Migration: district_id columns ──────────────────────────────
      const phase47Columns: { table: string; column: string }[] = [
        { table: 'npcs',            column: 'district_id' },
        { table: 'factions',        column: 'district_id' },
        { table: 'locations',       column: 'district_id' },
        { table: 'triplets',        column: 'district_id' },
        { table: 'chronicle_seeds', column: 'district_id' },
      ];
      for (const { table, column } of phase47Columns) {
        try {
          const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
          if (!cols.some(c => c.name === column)) {
            this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
          }
        } catch { /* table may not exist yet — world-schema.sql will create it */ }
      }

      // ── Phase 46 Migration: Governance Duel History ──────────────────────────
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS duel_history (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            document_type TEXT NOT NULL,
            document_id   TEXT NOT NULL,
            document_name TEXT,
            faction       TEXT,
            result        TEXT NOT NULL CHECK (result IN ('VETO', 'DEFER', 'PASS', 'FAIL_LOCKED')),
            initiator     TEXT NOT NULL DEFAULT 'HUMAN' CHECK (initiator IN ('HUMAN', 'MACHINA')),
            occurred_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO system_state (key, value) VALUES ('sovereignty_depth', '0.5');
      `);

      // ── Phase 21 Migration: NPC Life-Path Logs ────────────────────────────────
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS npc_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            npc_id      TEXT NOT NULL,
            summary     TEXT NOT NULL,
            log_type    TEXT NOT NULL DEFAULT 'action' CHECK (log_type IN ('action', 'interaction', 'observation')),
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_npc_logs_npc_id ON npc_logs (npc_id, created_at DESC);
      `);
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

  getPlayerHousing(actorId: string): PlayerHousing | null {
    const row = this.db.prepare(
      'SELECT actor_id, housing_tier, monthly_rent_eb, eb_balance FROM player_housing WHERE actor_id = ?'
    ).get(actorId) as PlayerHousing | undefined;
    return row ?? null;
  }

  setPlayerHousing(actorId: string, data: PlayerHousingUpdate & { housing_tier: PlayerHousing['housing_tier']; monthly_rent_eb: number; eb_balance: number }): void {
    this.db.prepare(
      `INSERT INTO player_housing (actor_id, housing_tier, monthly_rent_eb, eb_balance)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(actor_id) DO UPDATE SET
         housing_tier = excluded.housing_tier,
         monthly_rent_eb = excluded.monthly_rent_eb,
         eb_balance = excluded.eb_balance`
    ).run(actorId, data.housing_tier, data.monthly_rent_eb, data.eb_balance);
  }

  updatePlayerHousing(actorId: string, data: PlayerHousingUpdate): void {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return;
    const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
    const params = entries.map(([, v]) => v);
    params.push(actorId);
    this.db.prepare(`UPDATE player_housing SET ${setClause} WHERE actor_id = ?`).run(...params);
  }

  /**
   * Retrieves the current friction pool for a specific faction.
   * Defaults to 0 if the faction is not tracked or has no data.
   */
  async getFactionFriction(factionName: string): Promise<number> {
    const row = this.db.prepare('SELECT friction_pool FROM factions WHERE name = ?').get(factionName) as { friction_pool: number } | undefined;
    return row?.friction_pool ?? 0;
  }

  /**
   * Enforces Cyberpunk RED coupling rules (e.g. EMP = floor(Humanity/10)).
   * Automatically called after NPC state mutations.
   */
  private recalculateDerivedStats(actorId: string): void {
    const npc = this.db.prepare('SELECT humanity FROM npcs WHERE id = ?').get(actorId) as { humanity: number } | undefined;
    if (!npc) return;

    const newEmp = Math.max(0, Math.floor(npc.humanity / 10));
    this.db.prepare('UPDATE npcs SET emp = ? WHERE id = ?').run(newEmp, actorId);
  }

  // ── Phase 19: Latent Seeding (R00TS) ─────────────────────────────────────

  /**
   * Upsert a conceptual seed for a district.
   */
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

  /**
   * Return seeds for a district, sorted by weight descending.
   */
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
   * "The Flush Gate" pattern: Ensures world state consistency under load.
   */
  async executeTransaction(commands: WorldCommand[]): Promise<void> {
    const traceId = randomUUID();

    // ── Vitalik's 2-of-2 Authorization Model (v3.6.4) ───────────────────────
    if (this.onAuthorize) {
      const authorized = await this.onAuthorize(commands);
      if (!authorized) {
        this.logger?.warn('UnifiedOracleClient', traceId, 'Transaction REJECTED by human supervisor', { commands });
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
      if (duration > 100) {
        this.logger?.warn('UnifiedOracleClient', traceId, 'Flush Gate slowdown detected', { durationMs: duration });
      }
    } catch (err) {
      this.logger?.error('UnifiedOracleClient', traceId, 'Transaction failed, rolling back', {
        error: (err as Error).message,
        commands,
      });
      throw err;
    }
  }

  async executeCommand(command: WorldCommand): Promise<void> {
    this.applyCommandSync(command);
  }

  /**
   * Synchronous version of applyCommand for use within transactions.
   */
  private applyCommandSync(command: WorldCommand): void {
    const validated = WorldCommandSchema.parse(command);

    switch (validated.action) {
      case 'UPDATE_NPC': {
        const { target, data } = validated;
        const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
        if (entries.length === 0) return;

        if ('disposition' in data && typeof data.disposition === 'string') {
          data.disposition = data.disposition.toLowerCase() as 'friendly' | 'neutral' | 'hostile';
        }

        const setClause = entries.map(([k, _]) => `${k} = ?`).join(', ');
        const params: any[] = entries.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
        params.push(target);

        this.db.prepare(`UPDATE npcs SET ${setClause} WHERE id = ?`).run(...params);

        if ('humanity' in data) {
          this.recalculateDerivedStats(target);
        }
        break;
      }

      case 'ADD_LORE': {
        const { subject, predicate, object } = validated;
        this.db.prepare('INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)')
          .run(subject, predicate, object);
        break;
      }

      case 'TRANSFER_ITEM': {
        const { itemId, fromId, toId } = validated;
        const item = this.db.prepare('SELECT owner_id FROM inventory WHERE item_id = ?').get(itemId) as { owner_id: string } | undefined;
        if (!item || item.owner_id !== fromId) {
          throw new Error(`Ownership mismatch: Item ${itemId} belongs to ${item?.owner_id ?? 'nobody'}, not ${fromId}.`);
        }
        this.db.prepare('UPDATE inventory SET owner_id = ?, is_equipped = 0 WHERE item_id = ?')
          .run(toId, itemId);
        break;
      }
    }
  }
}
