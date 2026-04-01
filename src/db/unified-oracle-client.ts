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

  constructor(config: UnifiedOracleConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.db = new Database(this.config.worldDbPath);
    this.db.pragma('journal_mode = WAL');
    
    // Attach crush db if it exists
    if (fs.existsSync(this.config.crushDbPath)) {
      this.db.prepare('ATTACH DATABASE ? AS session_memory').run(this.config.crushDbPath);
    }
    
    this.connected = true;
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

  query(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not connected');
    return this.db.prepare(sql).all(...params);
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
   * Enforces Cyberpunk RED coupling rules (e.g. EMP = floor(Humanity/10)).
   * Automatically called after NPC state mutations.
   */
  private recalculateDerivedStats(actorId: string): void {
    if (!this.db) return;

    const npc = this.db.prepare('SELECT humanity FROM npcs WHERE id = ?').get(actorId) as { humanity: number } | undefined;
    if (!npc) return;

    const newEmp = Math.floor(npc.humanity / 10);
    this.db.prepare('UPDATE npcs SET emp = ? WHERE id = ?').run(newEmp, actorId);
  }

  async executeCommand(command: WorldCommand): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    // 1. Validate
    const validated = WorldCommandSchema.parse(command);

    // 2. Execute
    switch (validated.action) {
      case 'UPDATE_NPC': {
        const { target, data } = validated;
        const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
        if (entries.length === 0) return;

        const setClause = entries.map(([k, _]) => `${k} = ?`).join(', ');
        const params: any[] = entries.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
        params.push(target);

        const sql = `UPDATE npcs SET ${setClause} WHERE id = ?`;
        this.db.prepare(sql).run(...params);

        // 3. Post-Update Hook: Recalculate Empathy if Humanity was updated
        if ('humanity' in data) {
          this.recalculateDerivedStats(target);
        }
        break;
      }

      case 'ADD_LORE': {
        const { subject, predicate, object } = validated;
        this.db.prepare(
          'INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)'
        ).run(subject, predicate, object);
        break;
      }

      case 'TRANSFER_ITEM': {
        const { itemId, fromId, toId } = validated;
        this.db.transaction(() => {
          // 1. Verify existence and current ownership
          const item = this.db!.prepare('SELECT owner_id FROM inventory WHERE item_id = ?').get(itemId) as { owner_id: string } | undefined;
          if (!item || item.owner_id !== fromId) {
            throw new Error(`Ownership mismatch: Item ${itemId} belongs to ${item?.owner_id ?? 'nobody'}, not ${fromId}.`);
          }
          // 2. Atomic transfer
          this.db!.prepare('UPDATE inventory SET owner_id = ?, is_equipped = 0 WHERE item_id = ?')
            .run(toId, itemId);
        })();
        break;
      }
    }
  }
}
