/**
 * tests/core/seed-controller.test.ts
 *
 * Unit tests for SeedController — Phase 19 Latent Seeding (R00TS Pattern).
 * Uses an in-memory SQLite via UnifiedOracleClient with initSchema().
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedController } from '../../packages/hermes-core/src/core/seed-controller.js';
import { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import fs from 'node:fs';

const WORLD_DB = './test-seeds-world.db';
const CRUSH_DB = './test-seeds-crush.db';

async function makeOracle(): Promise<UnifiedOracleClient> {
  const oracle = new UnifiedOracleClient({ worldDbPath: WORLD_DB, crushDbPath: CRUSH_DB });
  await oracle.connect();
  await oracle.initSchema();
  return oracle;
}

describe('SeedController', () => {
  let oracle: UnifiedOracleClient;

  beforeEach(async () => {
    oracle = await makeOracle();
  });

  afterEach(async () => {
    await oracle.disconnect();
    try {
      if (fs.existsSync(WORLD_DB)) fs.unlinkSync(WORLD_DB);
      if (fs.existsSync(CRUSH_DB)) fs.unlinkSync(CRUSH_DB);
    } catch { /* ignore */ }
  });

  // 1. upsertSeed returns a stable id
  it('upsertSeed() returns a stable deterministic id for word+district', () => {
    const controller = new SeedController(oracle);
    const id1 = controller.upsertSeed({ word: 'Despair', weight: 0.9, category: 'mood', district: 'Watson' });
    const id2 = controller.upsertSeed({ word: 'Despair', weight: 0.5, category: 'mood', district: 'Watson' });
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^seed_[0-9a-f]{8}$/);
  });

  // 2. upsertSeed with same word+district updates weight (idempotent)
  it('upsertSeed() updates weight on second call with same word+district', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Paranoia', weight: 0.3, category: 'mood', district: 'Watson' });
    controller.upsertSeed({ word: 'Paranoia', weight: 0.8, category: 'mood', district: 'Watson' });

    const seeds = oracle.getSeedsForDistrict('Watson');
    const paranoia = seeds.find((s) => s.word === 'Paranoia');
    expect(paranoia).toBeDefined();
    expect(paranoia!.weight).toBe(0.8);
  });

  // 3. getPromptBias returns empty string when no seeds for district
  it('getPromptBias() returns empty string when no seeds exist for district', () => {
    const controller = new SeedController(oracle);
    const bias = controller.getPromptBias('Heywood');
    expect(bias).toBe('');
  });

  // 4. getPromptBias formats district bias correctly
  it('getPromptBias() includes district name and top seeds sorted by weight', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Despair', weight: 0.9, category: 'mood', district: 'Watson' });
    controller.upsertSeed({ word: 'Paranoia', weight: 0.75, category: 'mood', district: 'Watson' });
    controller.upsertSeed({ word: 'Greed', weight: 0.4, category: 'faction', district: 'Watson' });

    const bias = controller.getPromptBias('Watson');
    expect(bias).toContain('[DISTRICT ATMOSPHERE: Watson]');
    expect(bias).toContain('DOMINANT THEMES:');
    expect(bias).toContain('Despair (0.90)');
    expect(bias).toContain('Paranoia (0.75)');
    // Despair should appear before Paranoia (higher weight)
    expect(bias.indexOf('Despair')).toBeLessThan(bias.indexOf('Paranoia'));
  });

  // 5. getPromptBias includes global seeds (district = null) in district query
  it('getPromptBias() includes global seeds alongside district seeds', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Violence', weight: 0.95, category: 'event', district: null });
    controller.upsertSeed({ word: 'Despair', weight: 0.6, category: 'mood', district: 'Watson' });

    const bias = controller.getPromptBias('Watson');
    expect(bias).toContain('Violence');
    expect(bias).toContain('Despair');
  });

  // 6. getPromptBias with null district returns global bias label
  it('getPromptBias(null) uses GLOBAL ATMOSPHERE label', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Chaos', weight: 0.85, category: 'event', district: null });

    const bias = controller.getPromptBias(null);
    expect(bias).toContain('[GLOBAL ATMOSPHERE]');
    expect(bias).toContain('Chaos');
  });

  // 7. topN parameter limits results
  it('getPromptBias() respects the topN parameter', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Alpha', weight: 1.0, category: 'mood', district: 'Pacifica' });
    controller.upsertSeed({ word: 'Beta', weight: 0.8, category: 'mood', district: 'Pacifica' });
    controller.upsertSeed({ word: 'Gamma', weight: 0.6, category: 'mood', district: 'Pacifica' });

    const bias = controller.getPromptBias('Pacifica', 2);
    expect(bias).toContain('Alpha');
    expect(bias).toContain('Beta');
    expect(bias).not.toContain('Gamma');
  });

  // 8. getSeedsForDistrict returns seeds ordered by weight desc
  it('getSeedsForDistrict() returns seeds sorted by weight descending', () => {
    const controller = new SeedController(oracle);
    controller.upsertSeed({ word: 'Low', weight: 0.1, category: 'mood', district: 'Badlands' });
    controller.upsertSeed({ word: 'High', weight: 0.9, category: 'mood', district: 'Badlands' });
    controller.upsertSeed({ word: 'Mid', weight: 0.5, category: 'mood', district: 'Badlands' });

    const seeds = oracle.getSeedsForDistrict('Badlands');
    expect(seeds[0]!.word).toBe('High');
    expect(seeds[1]!.word).toBe('Mid');
    expect(seeds[2]!.word).toBe('Low');
  });
});
