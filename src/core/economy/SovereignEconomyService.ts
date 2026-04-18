/**
 * src/core/economy/SovereignEconomyService.ts
 * Phase 60: Sovereign Economy Engine — Night Market generator + Addiction resolution.
 *
 * Night Market: weighted 1d10 category roll → 1d100 item roll from Akashik.db.
 * Premium+ categories are auto-tagged as Contraband (Fixer-only).
 * Addiction: CPU-fallback check (Node A CUDA pending) persisted as wellbeing triplets.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Item category weights (1d10 table, CPR Black Chrome)
// ---------------------------------------------------------------------------

const CATEGORY_WEIGHTS = [
  { category: 'weapon',    weight: 2, contraband: false },
  { category: 'ammo',      weight: 2, contraband: false },
  { category: 'armor',     weight: 1, contraband: false },
  { category: 'gear',      weight: 2, contraband: false },
  { category: 'cyberware', weight: 1, contraband: false },
  { category: 'program',   weight: 1, contraband: false },
  { category: 'drug',      weight: 0, contraband: true  }, // Premium — Contraband
  { category: 'illegal',   weight: 1, contraband: true  }, // Contraband
];

const CONTRABAND_THRESHOLD_COST = 500; // Items above this are Fixer-only

export interface MarketInventoryEntry {
  item_id: string;
  item_name: string;
  quantity: number;
  is_contraband: boolean;
  price: number;
}

export interface GeneratedMarket {
  id: string;
  district_id: string;
  vendor_npc_id: string;
  inventory: MarketInventoryEntry[];
}

export class SovereignEconomyService {
  constructor(private readonly db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // Night Market Generator
  // ---------------------------------------------------------------------------

  generateNightMarket(districtId: string, vendorNpcId: string): GeneratedMarket {
    const marketId = randomUUID();
    const inventory: MarketInventoryEntry[] = [];

    // Roll 1d10 for number of item slots (3–10 variety)
    const slotCount = 3 + Math.floor(Math.random() * 8);

    for (let i = 0; i < slotCount; i++) {
      const category = this.rollCategory();
      const item = this.rollItem(category.category);
      if (!item) continue;

      const isContraband = category.contraband || item.cost > CONTRABAND_THRESHOLD_COST;
      inventory.push({
        item_id: item.id,
        item_name: item.name,
        quantity: 1 + Math.floor(Math.random() * 3),
        is_contraband: isContraband,
        price: Math.round(item.cost * (0.8 + Math.random() * 0.4)), // ±20% street variance
      });
    }

    const insertMarket = this.db.prepare(`
      INSERT OR REPLACE INTO night_markets (id, district_id, vendor_npc_id, inventory_json, status)
      VALUES (@id, @district_id, @vendor_npc_id, @inventory_json, 'active')
    `);

    insertMarket.run({
      id: marketId,
      district_id: districtId,
      vendor_npc_id: vendorNpcId,
      inventory_json: JSON.stringify(inventory),
    });

    return { id: marketId, district_id: districtId, vendor_npc_id: vendorNpcId, inventory };
  }

  private rollCategory(): typeof CATEGORY_WEIGHTS[number] {
    const totalWeight = CATEGORY_WEIGHTS.reduce((s, c) => s + c.weight, 0);
    let roll = Math.floor(Math.random() * totalWeight);
    for (const cat of CATEGORY_WEIGHTS) {
      roll -= cat.weight;
      if (roll < 0) return cat;
    }
    return CATEGORY_WEIGHTS[0]!;
  }

  private rollItem(category: string): { id: string; name: string; cost: number } | null {
    // 1d100 weighted sample from items table for the given type
    const row = this.db.prepare(`
      SELECT id, name, cost FROM items
      WHERE type = @type OR category = @type
      ORDER BY RANDOM() LIMIT 1
    `).get({ type: category }) as { id: string; name: string; cost: number } | undefined;
    return row ?? null;
  }

  // ---------------------------------------------------------------------------
  // Addiction Resolution (CPU-fallback; Node A CUDA sm_61 pending)
  // ---------------------------------------------------------------------------

  /**
   * Run an addiction check for an NPC/character against a substance.
   * Persists outcome as a wellbeing triplet in Akashik.db.
   * CPU implementation: BODY + WILL vs DV (substance-specific).
   */
  resolveAddiction(params: {
    npcId: string;
    substance: string;
    body: number;
    will: number;
    dv: number;
  }): { addicted: boolean; roll: number } {
    const { npcId, substance, body, will, dv } = params;

    // Exploding d10 (CPU-fallback mirroring canonical_math.rs)
    const roll = this.rollExplodingD10() + body + will;
    const addicted = roll < dv;

    const predicate = addicted ? 'addicted_to' : 'resisted_addiction';
    const insertTriplet = this.db.prepare(`
      INSERT OR IGNORE INTO triplets (subject_id, predicate, object_literal, district_id)
      VALUES (@subject_id, @predicate, @object_literal, NULL)
    `);
    insertTriplet.run({
      subject_id: npcId,
      predicate,
      object_literal: substance,
    });

    return { addicted, roll };
  }

  private rollExplodingD10(): number {
    let total = 0;
    let die = Math.ceil(Math.random() * 10);
    total += die;
    while (die === 10) {
      die = Math.ceil(Math.random() * 10);
      total += die;
    }
    return total;
  }

  /** Fetch a generated market's inventory by ID. */
  getMarket(marketId: string): GeneratedMarket | null {
    const row = this.db.prepare(
      'SELECT id, district_id, vendor_npc_id, inventory_json FROM night_markets WHERE id = ?'
    ).get(marketId) as { id: string; district_id: string; vendor_npc_id: string; inventory_json: string } | undefined;
    if (!row) return null;
    return { ...row, inventory: JSON.parse(row.inventory_json) };
  }
}
