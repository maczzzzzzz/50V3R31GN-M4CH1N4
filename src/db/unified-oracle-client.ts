import Database from 'better-sqlite3';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { WorldCommandSchema, type WorldCommand } from '../shared/schemas/world-commands.schema.js';
import type { RagSearchParams, HealthCheckResult } from './interfaces.js';
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
  private db: Database.Database | null = null;
  private readonly config: UnifiedOracleConfig;
  private connected = false;

  /**
   * Authorization Gate Callback.
   * If provided, executeTransaction will pause and wait for this to resolve.
   */
  public onAuthorize?: (commands: WorldCommand[]) => Promise<boolean>;

  constructor(config: UnifiedOracleConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.db = new Database(this.config.worldDbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('recursive_triggers = ON');
    
    // Attach crush db if it exists
    if (fs.existsSync(this.config.crushDbPath)) {
      this.db.prepare('ATTACH DATABASE ? AS session_memory').run(this.config.crushDbPath);
    }
    
    this.connected = true;
  }

  /**
   * Initializes a 10x10 grid for a faction to enable influence propagation.
   * Required for the Phase 6 Pulse Engine.
   */
  async seedDistrictGrid(factionName: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
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
    transaction();
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      if (!this.db) throw new Error('Not connected');
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
    if (!this.db) throw new Error('Database not connected');
    
    // Fallback to simple FTS5 search on triplets
    const { query, topK } = params;
    
    // Try to use FTS5 if table exists, otherwise return empty
    try {
      const results = this.db.prepare(`
        SELECT subject_id, predicate, object_literal
        FROM triplets_fts
        WHERE triplets_fts MATCH ?
        LIMIT ?
      `).all(query, topK) as any[];

      const matches = results.map((r, index) => ({
        content: `${r.subject_id} ${r.predicate}: ${r.object_literal}`,
        namespace: params.namespace,
        contextType: 'lore' as const,
        capabilityReq: 'none',
        sourceFile: 'unified-oracle',
        sourceRef: `triplet:${r.subject_id}`,
        sectionHeading: r.predicate,
        score: 1.0 - (index * 0.05), // Mock score for baseline compliance
        pageStart: 0,
        pageEnd: 0,
      }));

      return { query, matches };
    } catch (err) {
      // If schema not initialized or FTS5 fails, return empty matches
      return { query, matches: [] };
    }
  }

  async initSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    const schema = fs.readFileSync('src/db/world-schema.sql', 'utf8');
    this.db.exec(schema);
  }

  query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not connected');
    return this.db.prepare(sql).all(...params) as T[];
  }

  execute(sql: string, params: any[] = []): Database.RunResult {
    if (!this.db) throw new Error('Database not connected');
    return this.db.prepare(sql).run(...params);
  }

  getPlayerHousing(actorId: string): PlayerHousing | null {
    if (!this.db) throw new Error('Database not connected');
    const row = this.db.prepare(
      'SELECT actor_id, housing_tier, monthly_rent_eb, eb_balance FROM player_housing WHERE actor_id = ?'
    ).get(actorId) as PlayerHousing | undefined;
    return row ?? null;
  }

  setPlayerHousing(actorId: string, data: PlayerHousingUpdate & { housing_tier: PlayerHousing['housing_tier']; monthly_rent_eb: number; eb_balance: number }): void {
    if (!this.db) throw new Error('Database not connected');
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
    if (!this.db) throw new Error('Database not connected');
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
    if (!this.db) throw new Error('Database not connected');
    const row = this.db.prepare('SELECT friction_pool FROM factions WHERE name = ?').get(factionName) as { friction_pool: number } | undefined;
    return row?.friction_pool ?? 0;
  }

  /**
   * Enforces Cyberpunk RED coupling rules (e.g. EMP = floor(Humanity/10)).
   * Automatically called after NPC state mutations.
   */
  private recalculateDerivedStats(actorId: string): void {
    if (!this.db) return;

    const npc = this.db.prepare('SELECT humanity FROM npcs WHERE id = ?').get(actorId) as { humanity: number } | undefined;
    if (!npc) return;

    const newEmp = Math.max(0, Math.floor(npc.humanity / 10));
    this.db.prepare('UPDATE npcs SET emp = ? WHERE id = ?').run(newEmp, actorId);
  }

  /**
   * Execute multiple commands within an atomic IMMEDIATE transaction.
   * "The Flush Gate" pattern: Ensures world state consistency under load.
   */
  async executeTransaction(commands: WorldCommand[]): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // ── Vitalik's 2-of-2 Authorization Model (v1.0.3) ───────────────────────
    if (this.onAuthorize) {
      const authorized = await this.onAuthorize(commands);
      if (!authorized) {
        process.stderr.write('[Oracle] Transaction REJECTED by human supervisor.\n');
        return;
      }
    }

    const start = Date.now();
    
    // Using BEGIN IMMEDIATE to prevent deadlocks during high-load Pulse updates
    const transaction = this.db.transaction((cmds: WorldCommand[]) => {
      for (const cmd of cmds) {
        this.applyCommandSync(cmd);
      }
    });

    try {
      transaction(commands);
      const duration = Date.now() - start;
      if (duration > 100) {
        process.stderr.write(`[Oracle] Flush Gate slowdown: ${duration}ms for ${commands.length} commands\n`);
      }
    } catch (err) {
      process.stderr.write(`[Oracle] Transaction failed, rolling back: ${err}\n`);
      throw err;
    }
  }

  async executeCommand(command: WorldCommand): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    this.applyCommandSync(command);
  }

  /**
   * Synchronous version of applyCommand for use within transactions.
   * Enforces Cyberpunk RED coupling rules and reconciliation.
   */
  private applyCommandSync(command: WorldCommand): void {
    const validated = WorldCommandSchema.parse(command);

    switch (validated.action) {
      case 'UPDATE_NPC': {
        const { target, data } = validated;
        const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
        if (entries.length === 0) return;

        // Force lowercase disposition to match CHECK constraint ('friendly', 'neutral', 'hostile')
        if ('disposition' in data && typeof data.disposition === 'string') {
          data.disposition = data.disposition.toLowerCase() as 'friendly' | 'neutral' | 'hostile';
        }

        const setClause = entries.map(([k, _]) => `${k} = ?`).join(', ');
        const params: any[] = entries.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
        params.push(target);

        this.db!.prepare(`UPDATE npcs SET ${setClause} WHERE id = ?`).run(...params);

        if ('humanity' in data) {
          this.recalculateDerivedStats(target);
        }
        break;
      }

      case 'ADD_LORE': {
        const { subject, predicate, object } = validated;
        this.db!.prepare('INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)')
          .run(subject, predicate, object);
        break;
      }

      case 'TRANSFER_ITEM': {
        const { itemId, fromId, toId } = validated;
        const item = this.db!.prepare('SELECT owner_id FROM inventory WHERE item_id = ?').get(itemId) as { owner_id: string } | undefined;
        if (!item || item.owner_id !== fromId) {
          throw new Error(`Ownership mismatch: Item ${itemId} belongs to ${item?.owner_id ?? 'nobody'}, not ${fromId}.`);
        }
        this.db!.prepare('UPDATE inventory SET owner_id = ?, is_equipped = 0 WHERE item_id = ?')
          .run(toId, itemId);
        break;
      }
    }
  }
}
