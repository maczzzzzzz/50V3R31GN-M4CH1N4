/**
 * dashboard/app/api/synapse/route.ts
 * Phase 72: Graph-Relational Memory — Synapse REST API
 *
 * GET  /api/synapse?action=stats          → DB stats
 * GET  /api/synapse?action=search&q=...   → semantic or exact triplet search
 * GET  /api/synapse?action=brief          → latest persisted brief
 * GET  /api/synapse?action=captures       → recent inbox captures
 * POST /api/synapse  { source, content, metadata? } → ingest capture
 */

import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "..", "data", "SovereignIntelligence.db");
const EMBEDDING_DIM = 768;

function openDb(): Database.Database {
  const db = new Database(DB_PATH);
  sqliteVec.load(db);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  return db;
}

function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS os_triplets (
      id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      subject_id     TEXT NOT NULL,
      predicate      TEXT NOT NULL,
      object_literal TEXT NOT NULL,
      last_updated   DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (subject_id, predicate, object_literal)
    );
    CREATE TABLE IF NOT EXISTS synapse_captures (
      id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      source      TEXT NOT NULL,
      content     TEXT NOT NULL,
      metadata    TEXT NOT NULL DEFAULT '{}',
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS synapse_briefs (
      id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      period_start  DATETIME NOT NULL,
      period_end    DATETIME NOT NULL,
      summary       TEXT NOT NULL,
      triplet_count INTEGER NOT NULL DEFAULT 0,
      generated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_os_triplets USING vec0(
      triplet_id TEXT PRIMARY KEY,
      embedding  FLOAT[${EMBEDDING_DIM}]
    );
  `);
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "stats";

  try {
    const db = openDb();

    if (action === "stats") {
      const triplets = (db.prepare("SELECT count(*) as n FROM os_triplets").get() as { n: number }).n;
      const captures = (db.prepare("SELECT count(*) as n FROM synapse_captures").get() as { n: number }).n;
      const briefs   = (db.prepare("SELECT count(*) as n FROM synapse_briefs").get() as { n: number }).n;
      const vecRows  = (db.prepare("SELECT count(*) as n FROM vec_os_triplets").get() as { n: number }).n;
      db.close();
      return NextResponse.json({ triplets, captures, briefs, vecRows });
    }

    if (action === "search") {
      const q       = searchParams.get("q")?.trim() ?? "";
      const subject = searchParams.get("subject")?.trim();
      const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "10", 10));

      if (!q && !subject) {
        db.close();
        return NextResponse.json({ error: "q or subject required" }, { status: 400 });
      }

      // Exact search (always available)
      const clauses: string[] = [];
      const args: unknown[] = [];
      if (subject) { clauses.push("subject_id = ?"); args.push(subject); }
      if (q && !subject) { clauses.push("(subject_id LIKE ? OR predicate LIKE ? OR object_literal LIKE ?)"); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
      const where  = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      const rows   = db.prepare(`SELECT * FROM os_triplets ${where} ORDER BY last_updated DESC LIMIT ?`).all(...args, limit);

      db.close();
      return NextResponse.json({ results: rows, mode: "exact" });
    }

    if (action === "brief") {
      const brief = db
        .prepare("SELECT * FROM synapse_briefs ORDER BY generated_at DESC LIMIT 1")
        .get();
      db.close();
      return NextResponse.json({ brief: brief ?? null });
    }

    if (action === "captures") {
      const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
      const rows  = db
        .prepare("SELECT * FROM synapse_captures ORDER BY captured_at DESC LIMIT ?")
        .all(limit);
      db.close();
      return NextResponse.json({ captures: rows });
    }

    db.close();
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      source?: string;
      content?: string;
      metadata?: Record<string, unknown>;
    };

    const source  = body.source?.trim();
    const content = body.content?.trim();

    if (!source || !content) {
      return NextResponse.json(
        { error: "source and content are required" },
        { status: 400 },
      );
    }

    const db = openDb();

    const captureId: string = (
      db
        .prepare(
          `INSERT INTO synapse_captures (source, content, metadata) VALUES (?, ?, ?) RETURNING id`,
        )
        .get(source, content, JSON.stringify(body.metadata ?? {})) as { id: string }
    ).id;

    db.close();

    return NextResponse.json({ captureId }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
