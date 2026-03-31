import Database from 'better-sqlite3';

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

  query(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Database not connected');
    return this.db.prepare(sql).all(...params);
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}
