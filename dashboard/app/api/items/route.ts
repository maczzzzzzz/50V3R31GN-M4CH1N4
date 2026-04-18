/**
 * dashboard/app/api/items/route.ts
 * Phase 61: Serve Akashik.db items for the Lexicon browser.
 */

import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "Akashik.db");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

  try {
    const db = new Database(DB_PATH, { readonly: true });

    let sql =
      "SELECT id, name, type, category, cost, source, concealable, reliability FROM items WHERE 1=1";
    const params: (string | number)[] = [];

    if (q) {
      sql += " AND name LIKE ?";
      params.push(`%${q}%`);
    }
    if (type) {
      sql += " AND type = ?";
      params.push(type);
    }

    sql += " ORDER BY name ASC LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params);
    db.close();

    return NextResponse.json({ items: rows, count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: "DB_UNAVAILABLE", detail: String(err) },
      { status: 503 }
    );
  }
}
