import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import fs from 'node:fs';

describe('UnifiedOracleClient: Persistence Stress Tests', () => {
  const worldDbPath = './data/test-stress-world.db';
  const crushDbPath = './data/test-stress-crush.db';
  let client: UnifiedOracleClient;

  beforeAll(async () => {
    client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await client.connect();
    await client.initSchema();
  });

  afterAll(async () => {
    await client.disconnect();
    if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
    if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
  });

  it('should atomatically track SP ablation across rapid hits', async () => {
    const npcId = 'stress-mook-001';
    const initialSP = 11;

    // Seed mook
    client.execute('INSERT OR REPLACE INTO npcs (id, name, hp, sp, disposition) VALUES (?, ?, ?, ?, ?)',
      [npcId, 'Stress Mook', 50, initialSP, 'hostile']);

    // Simulate 3 hits
    for (const damage of [15, 12, 14]) {
      const current = client.query('SELECT sp, hp FROM npcs WHERE id = ?', [npcId])[0];
      if (damage > current.sp) {
        client.execute('UPDATE npcs SET sp = ?, hp = ? WHERE id = ?', 
          [current.sp - 1, current.hp - (damage - current.sp), npcId]);
      }
    }

    const final = client.query('SELECT sp, hp FROM npcs WHERE id = ?', [npcId])[0];
    expect(final.sp).toBe(initialSP - 3);
  });
});
