// scripts/gauntlet/phases/data-block.ts
// DATA Block shards — Phases 0, 1, 30, 34, 37, 43
// Verifies: DB schema integrity, world state, chronicle seeds, Memory Palace, Akashik sync

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync } from 'node:fs';

function pass(phaseId: number, phaseName: string, message: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId, phaseName, block: 'DATA', status: 'PASS', message, details };
}
function fail(phaseId: number, phaseName: string, message: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId, phaseName, block: 'DATA', status: 'FAIL', message, details };
}
function warn(phaseId: number, phaseName: string, message: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId, phaseName, block: 'DATA', status: 'WARN', message, details };
}
function skip(phaseId: number, phaseName: string, message: string): AuditResult {
  return { phaseId, phaseName, block: 'DATA', status: 'SKIP', message };
}

// ── Phase 0: DB Initialization ────────────────────────────────────────────────
export const phase0: SovereignShard = {
  metadata: { id: 0, name: 'DB-Init', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(0, 'DB-Init', 'world.db not available');
    const CORE_TABLES = [
      'system_state', 'npcs', 'factions', 'locations',
      'triplets', 'palace_rooms', 'chronicle_seeds',
    ];
    try {
      const existing = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const missing = CORE_TABLES.filter(t => !existing.includes(t));
      if (missing.length > 0) {
        return fail(0, 'DB-Init', `Missing core tables: ${missing.join(', ')}`, { missing });
      }
      return pass(0, 'DB-Init', `${CORE_TABLES.length} core tables present`, { tableCount: existing.length });
    } catch (e) {
      return fail(0, 'DB-Init', `Schema query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 1: Core Schema Integrity ─────────────────────────────────────────────
export const phase1: SovereignShard = {
  metadata: { id: 1, name: 'Schema-Integrity', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(1, 'Schema-Integrity', 'world.db not available');
    try {
      // Verify integrity_check passes
      const result = ctx.db.prepare('PRAGMA integrity_check').all() as { integrity_check: string }[];
      const ok = result.length === 1 && result[0]?.integrity_check === 'ok';
      if (!ok) {
        return fail(1, 'Schema-Integrity', 'SQLite integrity_check FAILED', { errors: result });
      }
      // Check WAL mode
      const wal = ctx.db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
      // Check foreign keys
      const fk = ctx.db.prepare('PRAGMA foreign_key_check').all() as unknown[];
      if (fk.length > 0) {
        return warn(1, 'Schema-Integrity', `${fk.length} foreign key violations found`, { violations: fk.slice(0, 5) });
      }
      return pass(1, 'Schema-Integrity', `Integrity OK | journal_mode=${wal.journal_mode}`, {
        journalMode: wal.journal_mode,
        fkViolations: 0,
      });
    } catch (e) {
      return fail(1, 'Schema-Integrity', `Integrity check failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 30: RKG Chronicles ──────────────────────────────────────────────────
export const phase30: SovereignShard = {
  metadata: { id: 30, name: 'RKG-Chronicles', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(30, 'RKG-Chronicles', 'world.db not available');
    try {
      const count = (ctx.db.prepare('SELECT COUNT(*) as c FROM chronicle_seeds').get() as { c: number }).c;
      const conceptual = (ctx.db.prepare('SELECT COUNT(*) as c FROM conceptual_seeds').get() as { c: number }).c;
      if (count === 0 && conceptual === 0) {
        return warn(30, 'RKG-Chronicles', 'chronicle_seeds and conceptual_seeds both empty');
      }
      return pass(30, 'RKG-Chronicles', `${count} chronicle seeds | ${conceptual} conceptual seeds`, {
        chronicleSeeds: count,
        conceptualSeeds: conceptual,
      });
    } catch (e) {
      return fail(30, 'RKG-Chronicles', `Chronicle query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 34: Memory Palace ───────────────────────────────────────────────────
export const phase34: SovereignShard = {
  metadata: { id: 34, name: 'Memory-Palace', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(34, 'Memory-Palace', 'world.db not available');
    const PALACE_TABLES = ['palace_wings', 'palace_halls', 'palace_rooms', 'palace_closets', 'palace_tunnels'];
    try {
      const existing = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const missing = PALACE_TABLES.filter(t => !existing.includes(t));
      if (missing.length > 0) {
        return fail(34, 'Memory-Palace', `Missing palace tables: ${missing.join(', ')}`);
      }
      const roomCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM palace_rooms').get() as { c: number }).c;
      const hallCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM palace_halls').get() as { c: number }).c;
      if (roomCount === 0) {
        return warn(34, 'Memory-Palace', 'palace_rooms is empty — palace not yet populated');
      }
      return pass(34, 'Memory-Palace', `${roomCount} rooms | ${hallCount} halls`, {
        rooms: roomCount,
        halls: hallCount,
      });
    } catch (e) {
      return fail(34, 'Memory-Palace', `Palace query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 37: Akashik Sync ────────────────────────────────────────────────────
export const phase37: SovereignShard = {
  metadata: { id: 37, name: 'Akashik-Sync', block: 'DATA' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const akashikPath = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
    if (!existsSync(akashikPath)) {
      return fail(37, 'Akashik-Sync', `Akashik.db not found at ${akashikPath}`);
    }
    // Open independently (may be a mirror of world.db)
    try {
      const AkashikDb = (await import('better-sqlite3')).default;
      const adb = new AkashikDb(akashikPath, { readonly: true });
      const tables = (adb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const npcCount = tables.includes('npcs')
        ? (adb.prepare('SELECT COUNT(*) as c FROM npcs').get() as { c: number }).c
        : -1;
      adb.close();
      return pass(37, 'Akashik-Sync', `Akashik.db accessible | ${tables.length} tables | ${npcCount} NPCs`, {
        tableCount: tables.length,
        npcCount,
      });
    } catch (e) {
      return fail(37, 'Akashik-Sync', `Akashik.db open failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 43: Stabilization State ────────────────────────────────────────────
export const phase43: SovereignShard = {
  metadata: { id: 43, name: 'Stabilization', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(43, 'Stabilization', 'world.db not available');
    try {
      const rows = ctx.db.prepare('SELECT key, value FROM system_state').all() as { key: string; value: string }[];
      const stateMap: Record<string, string> = {};
      for (const row of rows) stateMap[row.key] = row.value;
      // Check crush.db is accessible
      const crushDbPath = process.env['CRUSH_DB_PATH'] ?? './data/crush.db';
      const crushExists = existsSync(crushDbPath);
      if (rows.length === 0) {
        return warn(43, 'Stabilization', `system_state empty | crush.db=${crushExists ? 'present' : 'missing'}`);
      }
      return pass(43, 'Stabilization', `${rows.length} system state entries | crush.db=${crushExists ? 'present' : 'missing'}`, {
        stateKeys: Object.keys(stateMap),
        crushDbPresent: crushExists,
      });
    } catch (e) {
      return fail(43, 'Stabilization', `Stabilization query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
