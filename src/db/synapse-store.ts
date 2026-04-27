import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ILogger } from './interfaces.js';

/** Dimensions of the embedding model (nomic-embed-text via llama-server). */
export const EMBEDDING_DIM = 768;

export interface SynapseCapture {
  id: string;
  source: string;
  content: string;
  metadata: string;
  captured_at: string;
}

export interface SynapseBrief {
  id: string;
  period_start: string;
  period_end: string;
  summary: string;
  triplet_count: number;
  generated_at: string;
}

export interface OsTriplet {
  id: string;
  subject_id: string;
  predicate: string;
  object_literal: string;
  room_id: string | null;
  cluster_id: string | null;
  last_updated: string;
  reputation_score?: number;
  peer_validations?: number;
}

export interface VecSearchResult {
  triplet_id: string;
  distance: number;
}

/**
 * SynapseStore — owns the SovereignIntelligence.db connection with sqlite-vec loaded.
 *
 * Single source of truth for OS-level structured data + vector embeddings.
 * All Phase 72 services obtain their Database handle via this store.
 */
export class SynapseStore {
  private _db: Database.Database | null = null;
  private readonly dbPath: string;
  private readonly logger?: ILogger | undefined;

  private get db(): Database.Database {
    if (!this._db) throw new Error('SynapseStore: not connected — call open() first');
    return this._db;
  }

  constructor(dbPath: string, logger?: ILogger) {
    this.dbPath = path.resolve(dbPath);
    this.logger = logger;
  }

  open(): void {
    if (this._db) return;
    const traceId = randomUUID();

    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this._db = new Database(this.dbPath);
    sqliteVec.load(this._db);

    this._db.pragma('journal_mode = WAL');
    this._db.pragma('synchronous = NORMAL');
    this._db.pragma('foreign_keys = ON');

    this.ensureSchema();

    this.logger?.info('SynapseStore', traceId, 'Opened SovereignIntelligence.db with sqlite-vec', {
      dbPath: this.dbPath,
    });
  }

  close(): void {
    if (!this._db) return;
    this._db.close();
    this._db = null;
  }

  getRawDb(): Database.Database {
    return this.db;
  }

  // ── Schema bootstrap ────────────────────────────────────────────────────────

  private ensureSchema(): void {
    // Base OS tables (idempotent — created by init_intelligence_store.sh, re-ensured here)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_state (
        key   TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS decision_audit (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        logic_hash TEXT    NOT NULL,
        verdict    TEXT    NOT NULL CHECK (verdict IN ('VETO', 'PASS')),
        rationale  TEXT,
        timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS os_triplets (
        id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        subject_id     TEXT NOT NULL,
        predicate      TEXT NOT NULL,
        object_literal TEXT NOT NULL,
        room_id        TEXT,
        cluster_id     TEXT,
        reputation_score REAL DEFAULT 0.0,
        peer_validations INTEGER DEFAULT 0,
        x              REAL DEFAULT 0.0,
        y              REAL DEFAULT 0.0,
        z              REAL DEFAULT 0.0,
        freshness      REAL DEFAULT 1.0,
        last_updated   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (subject_id, predicate, object_literal)
      );

      CREATE TABLE IF NOT EXISTS mobile_postcards (
        id               TEXT PRIMARY KEY,
        node_id          TEXT NOT NULL,
        timestamp        DATETIME NOT NULL,
        vitals           TEXT NOT NULL,
        reputation_delta REAL NOT NULL,
        location_mask    TEXT NOT NULL
      );

      -- Phase 72: JARVIS Capture inbox
      CREATE TABLE IF NOT EXISTS synapse_captures (
        id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        source      TEXT NOT NULL,
        content     TEXT NOT NULL,
        metadata    TEXT NOT NULL DEFAULT '{}',
        captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Phase 72: Daily/weekly synthesized briefs
      CREATE TABLE IF NOT EXISTS synapse_briefs (
        id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        period_start  DATETIME NOT NULL,
        period_end    DATETIME NOT NULL,
        summary       TEXT NOT NULL,
        triplet_count INTEGER NOT NULL DEFAULT 0,
        generated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Phase 72: sqlite-vec virtual table for semantic search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS vec_os_triplets USING vec0(
        triplet_id TEXT PRIMARY KEY,
        embedding  FLOAT[${EMBEDDING_DIM}]
      );
    `);
  }

  // ── os_triplets (text layer) ─────────────────────────────────────────────

  upsertTripletText(subject: string, predicate: string, object: string, roomId?: string, clusterId?: string): string {
    const stmt = this.db.prepare(`
      INSERT INTO os_triplets (subject_id, predicate, object_literal, room_id, cluster_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (subject_id, predicate, object_literal)
        DO UPDATE SET 
          last_updated = CURRENT_TIMESTAMP,
          room_id = COALESCE(excluded.room_id, os_triplets.room_id),
          cluster_id = COALESCE(excluded.cluster_id, os_triplets.cluster_id)
      RETURNING id
    `);
    const row = stmt.get(subject, predicate, object, roomId ?? null, clusterId ?? null) as { id: string };
    return row.id;
  }

  getTripletById(id: string): OsTriplet | undefined {
    return this.db
      .prepare('SELECT * FROM os_triplets WHERE id = ?')
      .get(id) as OsTriplet | undefined;
  }

  searchTripletsBySubject(subject: string): OsTriplet[] {
    return this.db
      .prepare('SELECT * FROM os_triplets WHERE subject_id = ? ORDER BY last_updated DESC')
      .all(subject) as OsTriplet[];
  }

  // ── vec_os_triplets (vector layer) ──────────────────────────────────────

  upsertTripletVector(tripletId: string, embedding: number[]): void {
    if (embedding.length !== EMBEDDING_DIM) {
      throw new Error(
        `SynapseStore: embedding dim mismatch — expected ${EMBEDDING_DIM}, got ${embedding.length}`,
      );
    }
    const buf = Buffer.from(new Float32Array(embedding).buffer);
    this.db
      .prepare(
        `INSERT INTO vec_os_triplets (triplet_id, embedding)
         VALUES (?, ?)
         ON CONFLICT (triplet_id) DO UPDATE SET embedding = excluded.embedding`,
      )
      .run(tripletId, buf);
  }

  vecSearch(queryEmbedding: number[], topK: number): VecSearchResult[] {
    const buf = Buffer.from(new Float32Array(queryEmbedding).buffer);
    return this.db
      .prepare(
        `SELECT triplet_id, distance
         FROM vec_os_triplets
         WHERE embedding MATCH ?
         AND k = ?
         ORDER BY distance`,
      )
      .all(buf, topK) as VecSearchResult[];
  }

  // ── synapse_captures ────────────────────────────────────────────────────

  insertCapture(source: string, content: string, metadata: Record<string, unknown> = {}): string {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO synapse_captures (id, source, content, metadata)
         VALUES (?, ?, ?, ?)`,
      )
      .run(id, source, content, JSON.stringify(metadata));
    return id;
  }

  getRecentCaptures(limit = 50): SynapseCapture[] {
    return this.db
      .prepare(
        `SELECT * FROM synapse_captures ORDER BY captured_at DESC LIMIT ?`,
      )
      .all(limit) as SynapseCapture[];
  }

  // ── synapse_briefs ──────────────────────────────────────────────────────

  insertBrief(periodStart: string, periodEnd: string, summary: string, tripletCount: number): string {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO synapse_briefs (id, period_start, period_end, summary, triplet_count)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, periodStart, periodEnd, summary, tripletCount);
    return id;
  }

  getLatestBrief(): SynapseBrief | undefined {
    return this.db
      .prepare(`SELECT * FROM synapse_briefs ORDER BY generated_at DESC LIMIT 1`)
      .get() as SynapseBrief | undefined;
  }

  getBriefs(limit = 10): SynapseBrief[] {
    return this.db
      .prepare(`SELECT * FROM synapse_briefs ORDER BY generated_at DESC LIMIT ?`)
      .all(limit) as SynapseBrief[];
  }

  // ── mobile_postcards ────────────────────────────────────────────────────

  insertPostcard(postcard: { id: string, node_id: string, timestamp: string, vitals: string, reputation_delta: number, location_mask: string }): void {
    this.db
      .prepare(
        `INSERT INTO mobile_postcards (id, node_id, timestamp, vitals, reputation_delta, location_mask)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(postcard.id, postcard.node_id, postcard.timestamp, postcard.vitals, postcard.reputation_delta, postcard.location_mask);
  }

  updateReputation(id: string, delta: number, table: 'os_triplets' | 'intelligence_shards' = 'os_triplets'): void {
    // Note: intelligence_shards table assumed to exist per Phase 88
    this.db
      .prepare(`UPDATE ${table} SET reputation_score = reputation_score + ? WHERE id = ?`)
      .run(delta, id);
  }

  // ── stats ───────────────────────────────────────────────────────────────

  getStats(): { triplets: number; captures: number; briefs: number; vecRows: number } {
    const triplets = (this.db.prepare('SELECT count(*) as n FROM os_triplets').get() as { n: number }).n;
    const captures = (this.db.prepare('SELECT count(*) as n FROM synapse_captures').get() as { n: number }).n;
    const briefs   = (this.db.prepare('SELECT count(*) as n FROM synapse_briefs').get() as { n: number }).n;
    const vecRows  = (this.db.prepare('SELECT count(*) as n FROM vec_os_triplets').get() as { n: number }).n;
    return { triplets, captures, briefs, vecRows };
  }
}
