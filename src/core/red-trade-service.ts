import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  RedTradeCargoSchema,
  FrictionRollResultSchema,
  type CargoCategory,
  type RedTradeCargo,
  type FrictionRollResult,
} from '../shared/schemas/red-trade.schema.js';

/** Buyer/rival factions per spec section 2.2 */
const FACTION_MAP: Record<CargoCategory, { buyer: string; rival: string }> = {
  data_runner:    { buyer: 'Tyger Claws',     rival: 'Netwatch'  },
  scarcity_goods: { buyer: 'Faction Leaders', rival: 'Nomads'    },
  military_gear:  { buyer: 'Maelstrom',       rival: 'MAX-TAC'   },
};

const ALL_CATEGORIES: CargoCategory[] = ['data_runner', 'scarcity_goods', 'military_gear'];

interface RawItem {
  name: string;
  type: string;
  system?: { price?: { market?: number }; isElectronic?: boolean };
}

export class RedTradeService {
  private readonly dataDir: string;

  constructor(dataDir = 'docs/raw_data') {
    this.dataDir = dataDir;
  }

  /**
   * Rolls 1d10 + currentFriction and returns a FrictionRollResult.
   * @param currentFriction  The faction's current friction_pool (0–10).
   * @param dieRoll          Optional injected roll for testing (1–10).
   */
  rollFriction(currentFriction: number, dieRoll?: number): FrictionRollResult {
    const roll = dieRoll ?? Math.ceil(Math.random() * 10);
    const total = roll + currentFriction;

    const outcome =
      total >= 15 ? 'ambush' :
      total >= 8  ? 'gate'   :
                    'bark';

    return FrictionRollResultSchema.parse({ roll, friction: currentFriction, total, outcome });
  }

  generateCargo(category?: CargoCategory): RedTradeCargo {
    const items = this.loadItems();
    const selectedCategory = category ?? ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
    const filtered = items.filter(item => this.classifyItem(item) === selectedCategory);

    if (filtered.length === 0) {
      throw new Error(`No items available for cargo category: ${selectedCategory}`);
    }

    const item = filtered[Math.floor(Math.random() * filtered.length)];
    const factions = FACTION_MAP[selectedCategory];

    return RedTradeCargoSchema.parse({
      id: randomUUID(),
      name: this.canonicalName(item.name, selectedCategory),
      category: selectedCategory,
      bulk: this.deriveBulk(item),
      rarity: this.deriveRarity(item),
      buyerFaction: factions.buyer,
      rivalFaction: factions.rival,
      sourceItem: item.name,
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private loadItems(): RawItem[] {
    const results: RawItem[] = [];
    if (!fs.existsSync(this.dataDir)) return results;
    this.walkDir(this.dataDir, results);
    return results;
  }

  private walkDir(dir: string, results: RawItem[]): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walkDir(fullPath, results);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as RawItem;
          if (raw.name && raw.type) results.push(raw);
        } catch {
          // skip malformed files
        }
      }
    }
  }

  private classifyItem(item: RawItem): CargoCategory {
    const nameLower = item.name.toLowerCase();
    const type = item.type.toLowerCase();

    // Data Runner: badges, passes, invites, electronic access items (digital contraband)
    if (
      nameLower.includes('badge') ||
      nameLower.includes('invite') ||
      nameLower.includes('access') ||
      nameLower.includes('pass') ||
      nameLower.includes('net-map') ||
      item.system?.isElectronic === true
    ) {
      return 'data_runner';
    }

    // Military Gear: weapons, cyberware, explosives, drones (physical military contraband)
    if (
      type === 'weapon' ||
      type === 'cyberware' ||
      type === 'armor' ||
      nameLower.includes('drone') ||
      nameLower.includes('explosive') ||
      nameLower.includes('charge') ||
      nameLower.includes('grenade') ||
      nameLower.includes('cannon') ||
      nameLower.includes('borgware') ||
      nameLower.includes('cloaking')
    ) {
      return 'military_gear';
    }

    // Scarcity Goods: everything else (crafting materials, medical supplies, social goods)
    return 'scarcity_goods';
  }

  /** Apply lore-accurate naming per spec section 2.2 */
  private canonicalName(sourceName: string, category: CargoCategory): string {
    if (category === 'data_runner' && sourceName.toLowerCase().includes('badge')) {
      return `Stolen ${sourceName}`;
    }
    return sourceName;
  }

  private deriveBulk(item: RawItem): 'physical' | 'digital' {
    const nameLower = item.name.toLowerCase();
    if (
      nameLower.includes('badge') ||
      nameLower.includes('invite') ||
      nameLower.includes('pass') ||
      item.system?.isElectronic === true
    ) {
      return 'digital';
    }
    return 'physical';
  }

  private deriveRarity(item: RawItem): 'common' | 'uncommon' | 'rare' | 'exotic' {
    const price = item.system?.price?.market ?? 0;
    if (price >= 5000) return 'exotic';
    if (price >= 1000) return 'rare';
    if (price >= 250)  return 'uncommon';
    return 'common';
  }
}
