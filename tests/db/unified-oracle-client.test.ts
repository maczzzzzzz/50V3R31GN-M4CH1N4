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

  it('should support faction relationship tracking', async () => {
    const client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    try {
      await client.connect();
      await client.initSchema();

      const factionTable = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name = 'factions'");
      expect(factionTable).toHaveLength(1);

      const friendsEnemiesTable = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name = 'player_friends_enemies'");
      expect(friendsEnemiesTable).toHaveLength(1);
    } finally {
      await client.disconnect();
    }
  });

  describe('executeCommand', () => {
    let client: UnifiedOracleClient;

    beforeEach(async () => {
      client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
      await client.connect();
      await client.initSchema();
      
      // Seed an NPC for testing updates
      client.execute("INSERT INTO npcs (id, name, hp, sp, emp, humanity, faction, disposition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['morgan-black', 'Morgan Black', 100, 50, 10, 100, 'The Network', 'neutral']);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should successfully execute UPDATE_NPC', async () => {
      await client.executeCommand({
        action: 'UPDATE_NPC',
        target: 'morgan-black',
        data: {
          hp: 85,
          disposition: 'hostile'
        }
      });

      const [npc] = client.query('SELECT hp, disposition FROM npcs WHERE id = ?', ['morgan-black']);
      expect(npc.hp).toBe(85);
      expect(npc.disposition).toBe('hostile');
    });

    it('should automatically recalculate EMP when Humanity is updated', async () => {
      // Seed a mook with EMP 6 (Humanity 60)
      client.execute("INSERT INTO npcs (id, name, hp, sp, emp, humanity, faction, disposition) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ['cyber-vido', 'Vido', 50, 11, 6, 60, 'Maelstrom', 'neutral']);

      // Take 25 Humanity Loss -> Humanity 35 -> EMP 3
      await client.executeCommand({
        action: 'UPDATE_NPC',
        target: 'cyber-vido',
        data: {
          humanity: 35
        }
      });

      const [result] = client.query('SELECT humanity, emp FROM npcs WHERE id = ?', ['cyber-vido']);
      expect(result.humanity).toBe(35);
      expect(result.emp).toBe(3); // floor(35 / 10)
    });

    it('should successfully execute ADD_LORE', async () => {
      await client.executeCommand({
        action: 'ADD_LORE',
        subject: 'morgan-black',
        predicate: 'knows',
        object: 'the secret password'
      });

      const [triplet] = client.query('SELECT * FROM triplets WHERE subject_id = ?', ['morgan-black']);
      expect(triplet.predicate).toBe('knows');
      expect(triplet.object_literal).toBe('the secret password');
    });

    it('should throw error for invalid action', async () => {
      const invalidCommand = {
        action: 'DELETE_WORLD',
        target: 'all'
      };

      // @ts-ignore
      await expect(client.executeCommand(invalidCommand)).rejects.toThrow();
    });

    it('should throw error for invalid data in UPDATE_NPC', async () => {
      const invalidCommand = {
        action: 'UPDATE_NPC',
        target: 'morgan-black',
        data: {
          hp: 'nearly dead' // Should be number
        }
      };

      // @ts-ignore
      await expect(client.executeCommand(invalidCommand)).rejects.toThrow();
    });
  });

  describe('executeTransaction', () => {
    let client: UnifiedOracleClient;

    beforeEach(async () => {
      client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
      await client.connect();
      await client.initSchema();
      client.execute("INSERT INTO npcs (id, name, hp) VALUES (?, ?, ?)", ['t1', 'NPC 1', 100]);
    });

    afterEach(async () => {
      await client.disconnect();
    });

    it('should successfully execute multiple commands in a transaction', async () => {
      await client.executeTransaction([
        { action: 'UPDATE_NPC', target: 't1', data: { hp: 50 } },
        { action: 'ADD_LORE', subject: 't1', predicate: 'is', object: 'wounded' }
      ]);

      const [npc] = client.query('SELECT hp FROM npcs WHERE id = ?', ['t1']);
      const [triplet] = client.query('SELECT object_literal FROM triplets WHERE subject_id = ?', ['t1']);
      
      expect(npc.hp).toBe(50);
      expect(triplet.object_literal).toBe('wounded');
    });

    it('should rollback all changes if one command fails', async () => {
      const commands: any[] = [
        { action: 'UPDATE_NPC', target: 't1', data: { hp: 10 } },
        { action: 'INVALID_ACTION', data: {} } // This will fail
      ];

      await expect(client.executeTransaction(commands)).rejects.toThrow();

      // NPC HP should still be 100
      const [npc] = client.query('SELECT hp FROM npcs WHERE id = ?', ['t1']);
      expect(npc.hp).toBe(100);
    });
  });
});
