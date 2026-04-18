/**
 * dashboard/app/api/markets/route.ts
 * Phase 61: Serve night_markets rows for the Economy terminal.
 */

import { NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "Akashik.db");

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db
      .prepare(
        "SELECT id, district_id, vendor_npc_id, inventory_json, status FROM night_markets ORDER BY rowid DESC LIMIT 20"
      )
      .all() as {
        id: string;
        district_id: string;
        vendor_npc_id: string;
        inventory_json: string;
        status: string;
      }[];
    db.close();

    const markets = rows.map((r) => ({
      ...r,
      inventory: JSON.parse(r.inventory_json) as unknown[],
    }));

    return NextResponse.json({ markets });
  } catch (err) {
    return NextResponse.json(
      { error: "DB_UNAVAILABLE", detail: String(err) },
      { status: 503 }
    );
  }
}
