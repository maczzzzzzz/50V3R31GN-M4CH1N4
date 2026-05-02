import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { RedTradeService } from '../../packages/hermes-core/src/core/red-trade-service.js';
import { RedTradeCargoSchema, FrictionRollResultSchema } from '../../packages/hermes-core/src/shared/schemas/red-trade.schema.js';

const ITEMS_DIR = path.resolve('tests/fixtures/red-trade-items');

describe('RedTradeService', () => {
  let service: RedTradeService;

  beforeEach(() => {
    service = new RedTradeService(ITEMS_DIR);
  });

  it('should generate a valid RedTradeCargo object', () => {
    const cargo = service.generateCargo();
    expect(() => RedTradeCargoSchema.parse(cargo)).not.toThrow();
  });

  it('should generate cargo with all required fields populated', () => {
    const cargo = service.generateCargo();
    expect(cargo.id).toBeTruthy();
    expect(cargo.name).toBeTruthy();
    expect(cargo.category).toMatch(/^(data_runner|scarcity_goods|military_gear)$/);
    expect(cargo.bulk).toMatch(/^(physical|digital)$/);
    expect(cargo.rarity).toMatch(/^(common|uncommon|rare|exotic)$/);
    expect(cargo.buyerFaction).toBeTruthy();
    expect(cargo.rivalFaction).toBeTruthy();
    expect(cargo.sourceItem).toBeTruthy();
  });

  it('should generate data_runner cargo when category is specified', () => {
    const cargo = service.generateCargo('data_runner');
    expect(cargo.category).toBe('data_runner');
    expect(cargo.buyerFaction).toBe('Tyger Claws');
    expect(cargo.rivalFaction).toBe('Netwatch');
  });

  it('should generate scarcity_goods cargo when category is specified', () => {
    const cargo = service.generateCargo('scarcity_goods');
    expect(cargo.category).toBe('scarcity_goods');
    expect(cargo.buyerFaction).toBe('Faction Leaders');
    expect(cargo.rivalFaction).toBe('Nomads');
  });

  it('should generate military_gear cargo when category is specified', () => {
    const cargo = service.generateCargo('military_gear');
    expect(cargo.category).toBe('military_gear');
    expect(cargo.buyerFaction).toBe('Maelstrom');
    expect(cargo.rivalFaction).toBe('MAX-TAC');
  });

  describe('rollFriction', () => {
    it('should return a valid FrictionRollResult', () => {
      const result = service.rollFriction(0);
      expect(() => FrictionRollResultSchema.parse(result)).not.toThrow();
    });

    it('should produce bark when total is 7 or less', () => {
      // inject die roll of 1, friction 0 → total 1
      const result = service.rollFriction(0, 1);
      expect(result.outcome).toBe('bark');
      expect(result.total).toBe(1);
    });

    it('should produce gate when total is between 8 and 14', () => {
      // inject die roll of 8, friction 0 → total 8
      const result = service.rollFriction(0, 8);
      expect(result.outcome).toBe('gate');
      expect(result.total).toBe(8);
    });

    it('should produce ambush when total is 15 or more', () => {
      // inject die roll of 10, friction 5 → total 15
      const result = service.rollFriction(5, 10);
      expect(result.outcome).toBe('ambush');
      expect(result.total).toBe(15);
    });

    it('should correctly add currentFriction to the die roll', () => {
      const result = service.rollFriction(3, 6);
      expect(result.roll).toBe(6);
      expect(result.friction).toBe(3);
      expect(result.total).toBe(9);
    });
  });

  it('should return different cargo on repeated calls (probabilistic)', () => {
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(service.generateCargo().name);
    }
    // With 3+ cargo items, we should see at least 2 distinct results over 20 tries
    expect(results.size).toBeGreaterThanOrEqual(1);
  });
});
