import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';
import Database from 'better-sqlite3';
import fs from 'node:fs';

describe('UnifiedOracleClient', () => {
  const worldDbPath = './test-world.db';
  const crushDbPath = './test-crush.db';

  beforeEach(() => {
    // Setup dummy crush db
    const crushDb = new Database(crushDbPath);
    crushDb.exec('CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, content TEXT)');
    crushDb.close();
  });

  afterEach(() => {
    try {
      if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
      if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
    } catch (e) {
      console.warn('Failed to cleanup test dbs:', e);
    }
  });

  it('should connect and attach the crush database', async () => {
    const client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    try {
      await client.connect();
      
      // Check if we can query the attached database
      const result = client.query('SELECT name FROM pragma_database_list() WHERE name = ?', ['session_memory']);
      expect(result).toHaveLength(1);
    } finally {
      await client.disconnect();
    }
  });

  it('should initialize the RKG schema', async () => {
    const client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    try {
      await client.connect();
      await client.initSchema();
      
      const tables = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?)", ['npcs', 'triplets']);
      expect(tables).toHaveLength(2);
    } finally {
      await client.disconnect();
    }
  });
});
