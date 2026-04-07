/**
 * MemoryPalaceService — Phase 34: 7H3-M3M0RY-P4L4C3
 *
 * Manages the hierarchical memory architecture:
 *   - Wings   → broad context buckets (DISTRICT, FACTION, PLAYER)
 *   - Rooms   → high-density Points of Interest within a Wing
 *   - Tunnels → logical cross-reference links between Wings/Rooms
 *   - Drawer  → verbatim ChromaDB storage of session exchanges (L3)
 *
 * The active room context is written to `data/palace_context.json` so that
 * all sidecars can read which Wing/Room is currently loaded without going
 * through a DB query on every turn.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ChromaClient, type Collection } from 'chromadb';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type WingType = 'DISTRICT' | 'FACTION' | 'PLAYER';
export type RoomType = 'POI' | 'SCENE' | 'ENCOUNTER';

export interface Wing {
  id: string;
  name: string;
  wing_type: WingType;
  description: string | null;
  last_accessed: string;
}

export interface Room {
  id: string;
  wing_id: string;
  name: string;
  room_type: RoomType;
  description: string | null;
  created_at: string;
}

export interface Tunnel {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: string;
  strength: number;
  created_at: string;
}

export interface PalaceContext {
  wingId: string | null;
  wingName: string | null;
  roomId: string | null;
  roomName: string | null;
  updatedAt: string;
}

export interface DrawerEntry {
  id: string;
  document: string;
  roomId: string;
  wingId: string;
  timestamp: string;
  distance?: number;
}

export interface DrawerConfig {
  /** Base URL of the ChromaDB HTTP server, e.g. http://localhost:8000 */
  chromaUrl: string;
  /** Base URL of the llama-server /v1 endpoint for embeddings */
  embeddingBaseUrl: string;
  /** Embedding model name, e.g. nomic-embed-text */
  embeddingModel: string;
}

// ── OBLITERATUS Sanitizer ─────────────────────────────────────────────────────
// Strip prompt-injection patterns before storing verbatim logs in the Drawer.

const INJECTION_PATTERNS = [
  /<\|im_start\|>[\s\S]*?<\|im_end\|>/g,   // ChatML tokens
  /<s>[\s\S]*?<\/s>/g,                       // Llama BOS/EOS
  /\[INST\][\s\S]*?\[\/INST\]/g,             // Llama instruction tags
  /<<SYS>>[\s\S]*?<\/SYS>>/g,               // System tags
  /###\s*(System|Human|Assistant):/gi,        // Markdown-style role markers
];

function obliteratus(text: string): string {
  let sanitized = text;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized.trim();
}

// ── Llama-server Embedding Function (ChromaDB v3 EmbeddingFunction interface) ─

class LlamaEmbeddingFunction {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: texts }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new Error(`[Drawer] Embedding request failed: HTTP ${response.status}`);
    }
    const json = await response.json() as { data: Array<{ embedding: number[]; index: number }> };
    return json.data.sort((a, b) => a.index - b.index).map(d => d.embedding);
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTEXT_FILE = 'data/palace_context.json';
const DRAWER_COLLECTION = 'sovereign_drawer';

// ── Service ───────────────────────────────────────────────────────────────────

export class MemoryPalaceService {
  private readonly oracle: UnifiedOracleClient;
  private activeContext: PalaceContext = {
    wingId: null,
    wingName: null,
    roomId: null,
    roomName: null,
    updatedAt: new Date().toISOString(),
  };

  // Drawer (ChromaDB) — initialized lazily via initDrawer()
  private chroma: ChromaClient | null = null;
  private drawer: Collection | null = null;
  private embedFn: LlamaEmbeddingFunction | null = null;

  constructor(oracle: UnifiedOracleClient) {
    this.oracle = oracle;
  }

  /**
   * Initialize the ChromaDB Drawer. Must be called before mineExchange() or queryDrawer().
   * Silently degrades if ChromaDB is unavailable — the Palace will still function
   * without the Drawer (Wings/Rooms/Tunnels remain operational).
   */
  async initDrawer(config: DrawerConfig): Promise<void> {
    try {
      this.embedFn = new LlamaEmbeddingFunction(config.embeddingBaseUrl, config.embeddingModel);
      this.chroma = new ChromaClient({ path: config.chromaUrl });
      this.drawer = await this.chroma.getOrCreateCollection({
        name: DRAWER_COLLECTION,
        embeddingFunction: this.embedFn,
        metadata: { 'hnsw:space': 'cosine' },
      });
      process.stdout.write(`[MemoryPalace] Drawer online: ${DRAWER_COLLECTION} @ ${config.chromaUrl}\n`);
    } catch (err) {
      process.stderr.write(`[MemoryPalace] Drawer unavailable (ChromaDB not running?): ${err}\n`);
      this.drawer = null;
    }
  }

  /**
   * Mine a verbatim exchange into the Drawer, tagged with current Palace context.
   * OBLITERATUS sanitization is applied to both turns before storage.
   */
  async mineExchange(userTurn: string, assistantTurn: string): Promise<void> {
    if (!this.drawer) return;

    const { roomId, wingId } = this.activeContext;
    if (!roomId || !wingId) {
      process.stderr.write('[MemoryPalace] mineExchange skipped: no active room context\n');
      return;
    }

    const safeUser = obliteratus(userTurn);
    const safeAssistant = obliteratus(assistantTurn);
    const document = `USER: ${safeUser}\nASSISTANT: ${safeAssistant}`;

    await this.drawer.add({
      ids: [randomUUID()],
      documents: [document],
      metadatas: [{ roomId, wingId, timestamp: new Date().toISOString() }],
    });
  }

  /**
   * Query the Drawer for semantically similar exchanges.
   * Optionally scoped to a specific roomId for context precision.
   */
  async queryDrawer(query: string, roomId?: string, limit = 5): Promise<DrawerEntry[]> {
    if (!this.drawer) return [];

    const where = roomId ? ({ roomId } as Record<string, string>) : undefined;

    const results = await this.drawer.query({
      queryTexts: [query],
      nResults: limit,
      ...(where ? { where } : {}),
      include: ['documents', 'metadatas', 'distances'] as any,
    });

    const ids = results.ids[0] ?? [];
    const docs = results.documents[0] ?? [];
    const metas = results.metadatas[0] ?? [];
    const dists = (results.distances?.[0]) ?? [];

    return ids.map((id, i): DrawerEntry => {
      const dist = dists[i];
      const entry: DrawerEntry = {
        id,
        document: docs[i] ?? '',
        roomId: (metas[i] as any)?.roomId ?? '',
        wingId: (metas[i] as any)?.wingId ?? '',
        timestamp: (metas[i] as any)?.timestamp ?? '',
      };
      if (dist != null) entry.distance = dist;
      return entry;
    });
  }

  // ── Wings ─────────────────────────────────────────────────────────────────

  upsertWing(name: string, wing_type: WingType, description?: string): Wing {
    const db = this.oracle.getRawDatabase();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO palace_wings (id, name, wing_type, description, last_accessed)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(name) DO UPDATE SET
        wing_type     = excluded.wing_type,
        description   = COALESCE(excluded.description, palace_wings.description),
        last_accessed = CURRENT_TIMESTAMP
    `).run(id, name, wing_type, description ?? null);

    return db.prepare('SELECT * FROM palace_wings WHERE name = ?').get(name) as Wing;
  }

  getWing(nameOrId: string): Wing | null {
    const db = this.oracle.getRawDatabase();
    return (
      (db.prepare('SELECT * FROM palace_wings WHERE id = ? OR name = ?').get(nameOrId, nameOrId) as Wing | undefined) ?? null
    );
  }

  listWings(): Wing[] {
    return this.oracle.getRawDatabase().prepare(
      'SELECT * FROM palace_wings ORDER BY last_accessed DESC'
    ).all() as Wing[];
  }

  // ── Rooms ─────────────────────────────────────────────────────────────────

  upsertRoom(wingId: string, name: string, room_type: RoomType, description?: string): Room {
    const db = this.oracle.getRawDatabase();
    const id = randomUUID();
    db.prepare(`
      INSERT INTO palace_rooms (id, wing_id, name, room_type, description)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT DO NOTHING
    `).run(id, wingId, name, room_type, description ?? null);

    return db.prepare('SELECT * FROM palace_rooms WHERE wing_id = ? AND name = ?').get(wingId, name) as Room;
  }

  getRoom(roomId: string): Room | null {
    return (
      (this.oracle.getRawDatabase().prepare('SELECT * FROM palace_rooms WHERE id = ?').get(roomId) as Room | undefined) ?? null
    );
  }

  listRooms(wingId: string): Room[] {
    return this.oracle.getRawDatabase().prepare(
      'SELECT * FROM palace_rooms WHERE wing_id = ? ORDER BY created_at DESC'
    ).all(wingId) as Room[];
  }

  // ── Tunnels ───────────────────────────────────────────────────────────────

  addTunnel(sourceId: string, targetId: string, relation_type: string, strength = 1.0): Tunnel {
    const db = this.oracle.getRawDatabase();
    const id = randomUUID();
    db.prepare(
      'INSERT INTO palace_tunnels (id, source_id, target_id, relation_type, strength) VALUES (?, ?, ?, ?, ?)'
    ).run(id, sourceId, targetId, relation_type, strength);
    return db.prepare('SELECT * FROM palace_tunnels WHERE id = ?').get(id) as Tunnel;
  }

  getTunnelsFrom(sourceId: string): Tunnel[] {
    return this.oracle.getRawDatabase().prepare(
      'SELECT * FROM palace_tunnels WHERE source_id = ? ORDER BY strength DESC'
    ).all(sourceId) as Tunnel[];
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Enter a Room: updates the active context and persists it to
   * `data/palace_context.json` so sidecars can read the current location.
   */
  enterRoom(roomId: string): PalaceContext {
    const db = this.oracle.getRawDatabase();
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`[MemoryPalace] Room not found: ${roomId}`);

    const wing = db.prepare('SELECT * FROM palace_wings WHERE id = ?').get(room.wing_id) as Wing | undefined;

    // Bump wing's last_accessed timestamp
    db.prepare('UPDATE palace_wings SET last_accessed = CURRENT_TIMESTAMP WHERE id = ?').run(room.wing_id);

    this.activeContext = {
      wingId: room.wing_id,
      wingName: wing?.name ?? null,
      roomId: room.id,
      roomName: room.name,
      updatedAt: new Date().toISOString(),
    };

    this.persistContext();
    return this.activeContext;
  }

  getActiveContext(): PalaceContext {
    return { ...this.activeContext };
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private persistContext(): void {
    try {
      const dir = path.dirname(CONTEXT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONTEXT_FILE, JSON.stringify(this.activeContext, null, 2), 'utf8');
    } catch (err) {
      process.stderr.write(`[MemoryPalace] Failed to persist context: ${err}\n`);
    }
  }
}
