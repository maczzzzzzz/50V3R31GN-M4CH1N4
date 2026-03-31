import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';

describe('UnifiedOracleClient: TTTA Gear Integration', () => {
  const worldDbPath = './data/test-ttta-world.db';
  const crushDbPath = './data/test-ttta-crush.db';
  let client: UnifiedOracleClient;

  beforeAll(async () => {
    // Ensure data dir exists
    if (!fs.existsSync('./data')) fs.mkdirSync('./data');
    
    client = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await client.connect();
    await client.initSchema();
  });

  afterAll(async () => {
    await client.disconnect();
    if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
    if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
  });

  it('should recursively import and identify TTTA gear from raw_data', async () => {
    const dataDir = 'docs/raw_data';
    const jsonFiles: string[] = [];
    
    function walkDir(dir: string, files: string[]): void {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, files);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          const dirLower = dir.toLowerCase();
          if (dirLower.includes('items') || dirLower.includes('cyberware') || dirLower.includes('gear')) {
            files.push(fullPath);
          }
        }
      }
    }

    walkDir(dataDir, jsonFiles);
    expect(jsonFiles.length).toBeGreaterThan(0);

    // Import items
    for (const file of jsonFiles) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!raw.name) continue;
      client.execute('INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)', 
        [raw.name, 'is', raw.type || 'item']);
    }

    // Verify FTS5 Search
    const results = await client.ragSearch({
      query: 'Zhirafa Security Badge',
      namespace: 'campaign_ttta',
      topK: 5,
      similarityThreshold: 0.1
    });

    expect(results.matches.length).toBeGreaterThan(0);
    expect(results.matches[0].content).toContain('Zhirafa Security Badge');
  });
});
