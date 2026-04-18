/**
 * dashboard/app/api/generate-market/route.ts
 * Phase 61: Trigger Night Market generation directly via SQLite.
 * Mirrors SovereignEconomyService logic inline (dashboard is a separate package).
 */

import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "Akashik.db");

const CATEGORY_WEIGHTS = [
  { category: "weapon",    weight: 2, contraband: false },
  { category: "ammo",      weight: 2, contraband: false },
  { category: "armor",     weight: 1, contraband: false },
  { category: "gear",      weight: 2, contraband: false },
  { category: "cyberware", weight: 1, contraband: false },
  { category: "program",   weight: 1, contraband: false },
  { category: "drug",      weight: 0, contraband: true  },
  { category: "illegal",   weight: 1, contraband: true  },
];

const CONTRABAND_COST_THRESHOLD = 500;

function rollCategory() {
  const total = CATEGORY_WEIGHTS.reduce((s, c) => s + c.weight, 0);
  let roll = Math.floor(Math.random() * total);
  for (const cat of CATEGORY_WEIGHTS) {
    roll -= cat.weight;
    if (roll < 0) return cat;
  }
  return CATEGORY_WEIGHTS[0]!;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { district_id?: string };
  const districtId = body.district_id ?? "unknown";

  try {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");

    const marketId = randomUUID();
    const slotCount = 3 + Math.floor(Math.random() * 8);
    const inventory: unknown[] = [];

    for (let i = 0; i < slotCount; i++) {
      const cat = rollCategory();
      const row = (
        db.prepare("SELECT id, name, cost FROM items WHERE type = ? OR category = ? ORDER BY RANDOM() LIMIT 1").get(cat.category, cat.category) ??
        db.prepare("SELECT id, name, cost FROM items ORDER BY RANDOM() LIMIT 1").get()
      ) as { id: string; name: string; cost: number } | undefined;
      if (!row) continue;
      const isContraband = cat.contraband || row.cost > CONTRABAND_COST_THRESHOLD;
      inventory.push({
        item_id: row.id,
        item_name: row.name,
        quantity: 1 + Math.floor(Math.random() * 3),
        is_contraband: isContraband,
        price: Math.round(row.cost * (0.8 + Math.random() * 0.4)),
      });
    }

    // Vendor NPC from DB if available
    const vendor = db
      .prepare("SELECT id FROM npcs ORDER BY RANDOM() LIMIT 1")
      .get() as { id: string } | undefined;

    db.prepare(
      "INSERT INTO night_markets (id, district_id, vendor_npc_id, inventory_json, status) VALUES (?, ?, ?, ?, 'active')"
    ).run(marketId, districtId, vendor?.id ?? "vendor-anon", JSON.stringify(inventory));

    db.close();

    return NextResponse.json({ market_id: marketId, district_id: districtId, inventory });
  } catch (err) {
    return NextResponse.json(
      { error: "GENERATION_FAILED", detail: String(err) },
      { status: 500 }
    );
  }
}
