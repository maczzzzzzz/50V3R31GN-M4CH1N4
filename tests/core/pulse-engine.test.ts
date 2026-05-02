/**
 * tests/core/pulse-engine.test.ts
 *
 * TDD: PulseEngine — Cryotank Skip / Capture Consequence (Phase 5.1 Task 5)
 *
 * Verifies:
 *   - timeSkip(actorId, months) calculates rent debt correctly
 *   - Eviction fires when eb_balance < debt
 *   - Rent deducted when balance is sufficient
 *   - Node A called twice for Punitive BD (Humanity + Addiction checks)
 *   - TimeSkipResult is fully populated
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { PulseEngine } from '../../packages/hermes-core/src/core/pulse-engine.js';
import { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import type { INitroLogicClient, OracleResult } from '../../packages/hermes-core/src/core/interfaces.js';
import { TimeSkipResultSchema } from '../../packages/hermes-core/src/shared/schemas/red-trade.schema.js';

const worldDbPath = './test-pulse-world.db';
const crushDbPath = './test-pulse-crush.db';

const bdRollResult: OracleResult = {
  result: 7,
  isCriticalSuccess: false,
  isCriticalFailure: false,
  luckyReroll: null,
  reasoning: '1d10 → 7',
};

function makeMockNitroLogic(): INitroLogicClient {
  return {
    resolveAttack: vi.fn(),
    calculateDv: vi.fn(),
    oracleRoll: vi.fn().mockResolvedValue(bdRollResult),
    isHealthy: vi.fn().mockResolvedValue(true),
  };
}

describe('PulseEngine', () => {
  let oracle: UnifiedOracleClient;
  let nitroLogic: INitroLogicClient;
  let engine: PulseEngine;

  beforeEach(async () => {
    // Setup crush db stub
    const crushDb = new Database(crushDbPath);
    crushDb.exec('CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, content TEXT)');
    crushDb.close();

    oracle = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await oracle.connect();
    await oracle.initSchema();

    nitroLogic = makeMockNitroLogic();
    engine = new PulseEngine(oracle, nitroLogic);
  });

  afterEach(async () => {
    await oracle.disconnect();
    try {
      if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
      if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
    } catch (e) {
      console.warn('Cleanup failed:', e);
    }
  });

  // ── Schema ──────────────────────────────────────────────────────────────────

  describe('world.db schema', () => {
    it('should have player_housing table after initSchema', () => {
      const result = oracle.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='player_housing'",
      );
      expect(result).toHaveLength(1);
    });
  });

  // ── Housing helpers ─────────────────────────────────────────────────────────

  describe('UnifiedOracleClient housing helpers', () => {
    it('setPlayerHousing creates a housing record', () => {
      oracle.setPlayerHousing('actor-v-001', {
        housing_tier: 'apartment',
        monthly_rent_eb: 500,
        eb_balance: 2000,
      });

      const housing = oracle.getPlayerHousing('actor-v-001');
      expect(housing).not.toBeNull();
      expect(housing!.housing_tier).toBe('apartment');
      expect(housing!.monthly_rent_eb).toBe(500);
      expect(housing!.eb_balance).toBe(2000);
    });

    it('getPlayerHousing returns null for unknown actor', () => {
      const housing = oracle.getPlayerHousing('unknown-actor');
      expect(housing).toBeNull();
    });
  });

  // ── timeSkip: no eviction ───────────────────────────────────────────────────

  describe('timeSkip — rent paid (no eviction)', () => {
    beforeEach(() => {
      oracle.setPlayerHousing('actor-v-001', {
        housing_tier: 'apartment',
        monthly_rent_eb: 200,
        eb_balance: 1000,
      });
    });

    it('should return a valid TimeSkipResult', async () => {
      const result = await engine.timeSkip('actor-v-001', 2);
      expect(() => TimeSkipResultSchema.parse(result)).not.toThrow();
    });

    it('should not evict when balance covers debt', async () => {
      const result = await engine.timeSkip('actor-v-001', 2); // debt = 400
      expect(result.evicted).toBe(false);
      expect(result.previousHousingTier).toBe('apartment');
    });

    it('should deduct rent correctly (200 × 2 = 400)', async () => {
      await engine.timeSkip('actor-v-001', 2);
      const housing = oracle.getPlayerHousing('actor-v-001');
      expect(housing!.eb_balance).toBe(600); // 1000 - 400
    });

    it('should call Node A twice for BD rolls', async () => {
      await engine.timeSkip('actor-v-001', 1);
      expect(nitroLogic.oracleRoll).toHaveBeenCalledTimes(2);
    });

    it('should include both BD roll results', async () => {
      const result = await engine.timeSkip('actor-v-001', 1);
      expect(result.bdHumanityRoll).toBe(7);
      expect(result.bdAddictionRoll).toBe(7);
    });

    it('should report correct months and rent debt', async () => {
      const result = await engine.timeSkip('actor-v-001', 3);
      expect(result.monthsSkipped).toBe(3);
      expect(result.rentDebt).toBe(600); // 200 × 3
    });
  });

  // ── timeSkip: eviction ──────────────────────────────────────────────────────

  describe('timeSkip — eviction (balance < debt)', () => {
    beforeEach(() => {
      oracle.setPlayerHousing('actor-v-001', {
        housing_tier: 'apartment',
        monthly_rent_eb: 500,
        eb_balance: 400, // can't cover 1 month
      });
    });

    it('should evict when balance cannot cover debt', async () => {
      const result = await engine.timeSkip('actor-v-001', 1); // debt = 500 > 400
      expect(result.evicted).toBe(true);
    });

    it('should reset housing_tier to street on eviction', async () => {
      await engine.timeSkip('actor-v-001', 1);
      const housing = oracle.getPlayerHousing('actor-v-001');
      expect(housing!.housing_tier).toBe('street');
    });

    it('should record the previousHousingTier before eviction', async () => {
      const result = await engine.timeSkip('actor-v-001', 1);
      expect(result.previousHousingTier).toBe('apartment');
    });

    it('should zero out the balance on eviction', async () => {
      await engine.timeSkip('actor-v-001', 1);
      const housing = oracle.getPlayerHousing('actor-v-001');
      expect(housing!.eb_balance).toBe(0);
    });

    it('should still run BD rolls even when evicted', async () => {
      await engine.timeSkip('actor-v-001', 1);
      expect(nitroLogic.oracleRoll).toHaveBeenCalledTimes(2);
    });
  });

  // ── timeSkip: no housing record ─────────────────────────────────────────────

  describe('timeSkip — actor with no housing record', () => {
    it('should not throw and should return evicted=false with street tier', async () => {
      const result = await engine.timeSkip('actor-unknown', 1);
      expect(result.evicted).toBe(false);
      expect(result.previousHousingTier).toBe('street');
      expect(result.rentDebt).toBe(0);
    });
  });
});
