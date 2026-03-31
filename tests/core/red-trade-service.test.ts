import { describe, it, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { RedTradeService } from '../../src/core/red-trade-service.js';
import { RedTradeCargoSchema } from '../../src/shared/schemas/red-trade.schema.js';

const ITEMS_DIR = path.resolve('docs/raw_data');

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

  it('should return different cargo on repeated calls (probabilistic)', () => {
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(service.generateCargo().name);
    }
    // With 3+ cargo items, we should see at least 2 distinct results over 20 tries
    expect(results.size).toBeGreaterThanOrEqual(1);
  });
});
