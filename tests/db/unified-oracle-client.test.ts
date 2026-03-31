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
    crushDb.exec('CREATE TABLE messages (id TEXT PRIMARY KEY, content TEXT)');
    crushDb.close();
  });

  afterEach(() => {
    if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
    if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
  });

  it('should connect and attach the crush database', async () => {
    const client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await client.connect();
    
    // Check if we can query the attached database
    const result = client.query('SELECT name FROM pragma_database_list() WHERE name = ?', ['session_memory']);
    expect(result).toHaveLength(1);
    
    await client.disconnect();
  });
});
