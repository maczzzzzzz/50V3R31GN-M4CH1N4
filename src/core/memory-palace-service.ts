/**
 * MemoryPalaceService — Phase 34: 7H3-M3M0RY-P4L4C3
 *
 * Manages the hierarchical memory architecture:
 *   - Wings   → broad context buckets (DISTRICT, FACTION, PLAYER)
 *   - Rooms   → high-density Points of Interest within a Wing
 *   - Tunnels → logical cross-reference links between Wings/Rooms
 *
 * The active room context is written to `data/palace_context.json` so that
 * all sidecars can read which Wing/Room is currently loaded without going
 * through a DB query on every turn.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
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

// ── Service ───────────────────────────────────────────────────────────────────

const CONTEXT_FILE = 'data/palace_context.json';

export class MemoryPalaceService {
  private readonly oracle: UnifiedOracleClient;
  private activeContext: PalaceContext = {
    wingId: null,
    wingName: null,
    roomId: null,
    roomName: null,
    updatedAt: new Date().toISOString(),
  };

  constructor(oracle: UnifiedOracleClient) {
    this.oracle = oracle;
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
