import Database from 'better-sqlite3';
import fs from 'node:fs';
import { WorldCommandSchema, type WorldCommand } from '../shared/schemas/world-commands.schema.js';

export interface UnifiedOracleConfig {
  worldDbPath: string;
  crushDbPath: string;
}

export class UnifiedOracleClient {
  private db: Database.Database | null = null;
  private readonly config: UnifiedOracleConfig;

  constructor(config: UnifiedOracleConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.db = new Database(this.config.worldDbPath);
    this.db.pragma('journal_mode = WAL');
    
    // Attach crush db
    this.db.prepare('ATTACH DATABASE ? AS session_memory').run(this.config.crushDbPath);
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
        const params = entries.map(([_, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
        params.push(target);

        const sql = `UPDATE npcs SET ${setClause} WHERE id = ?`;
        this.db.prepare(sql).run(...params);
        break;
      }

      case 'ADD_LORE': {
        const { subject, predicate, object } = validated;
        this.db.prepare(
          'INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)'
        ).run(subject, predicate, object);
        break;
      }
    }
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}
