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

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Run the DB migration script to initialize missing tables
    const i = intent as { migrationScript?: string } | null;
    const script = i?.migrationScript ?? 'npx tsx scripts/db-migrate.ts';
    await ctx.cli.execute(script).catch(e => {
      ctx.logger.error('DB-Init manifest: migration failed', e.message);
    });
  },
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

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Run VACUUM to rebuild the DB and resolve integrity issues
    await ctx.cli.execute('npx tsx -e "import Database from \'better-sqlite3\'; const db = new Database(process.env.WORLD_DB_PATH ?? \'./data/world.db\'); db.exec(\'VACUUM\'); db.close();"').catch(e => {
      ctx.logger.error('Schema-Integrity manifest: VACUUM failed', e.message);
    });
  },
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

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Trigger RKG vault reconstruction
    await ctx.cli.execute('bash scripts/reconstruct-palace.sh').catch(e => {
      ctx.logger.error('RKG-Chronicles manifest: reconstruct failed', e.message);
    });
  },
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

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Force-sync the Memory Palace by running reconstruct-palace
    await ctx.cli.execute('bash scripts/reconstruct-palace.sh --palace-only').catch(e => {
      ctx.logger.error('Memory-Palace manifest: sync failed', e.message);
    });
  },
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

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Force Akashik DB sync by copying world.db state to Akashik.db
    const akashikPath = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
    const worldPath = process.env['WORLD_DB_PATH'] ?? './data/world.db';
    await ctx.cli.execute(`cp ${worldPath} ${akashikPath}.sync.tmp && mv ${akashikPath}.sync.tmp ${akashikPath}`).catch(e => {
      ctx.logger.error('Akashik-Sync manifest: sync failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// RKG hierarchy — must match data-43.ts declaration
const RKG_BASE = process.env['OBSIDIAN_RKG_PATH'] ?? '/mnt/d/Obsidian_RKG';
const RKG_DIRS = ['Items', 'Actors', 'Factions', 'Chronicles', 'Districts', 'Global'];

// ── Phase 43: Stabilization State ────────────────────────────────────────────
export const phase43: SovereignShard = {
  metadata: { id: 43, name: 'Stabilization', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    // 1. Check system_state DB
    let stateRows = 0;
    let stateKeys: string[] = [];
    if (ctx.db) {
      try {
        const rows = ctx.db.prepare('SELECT key, value FROM system_state').all() as { key: string; value: string }[];
        stateRows = rows.length;
        stateKeys = rows.map(r => r.key);
      } catch { /* world.db may not have system_state yet */ }
    }

    // 2. Check RKG hierarchy
    const rkgBasePresent = existsSync(RKG_BASE);
    const rkgMissing = rkgBasePresent
      ? RKG_DIRS.filter(d => !existsSync(`${RKG_BASE}/${d}`))
      : RKG_DIRS;

    // 3. Check crush.db
    const crushDbPath = process.env['CRUSH_DB_PATH'] ?? './data/crush.db';
    const crushExists = existsSync(crushDbPath);

    const details: Record<string, unknown> = {
      stateKeys,
      crushDbPresent: crushExists,
      rkgBasePresent,
      rkgMissingDirs: rkgMissing,
    };

    if (!rkgBasePresent) {
      return warn(43, 'Stabilization', `RKG vault not found at ${RKG_BASE} | ${stateRows} state entries`, details);
    }
    if (rkgMissing.length > 0) {
      return warn(43, 'Stabilization', `RKG missing: [${rkgMissing.join(', ')}] | ${stateRows} state entries`, details);
    }
    return pass(43, 'Stabilization', `RKG hierarchy intact | ${stateRows} state entries | crush.db=${crushExists ? 'present' : 'missing'}`, details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Trigger semantic reconstruction to repair any missing RKG hierarchy
    ctx.logger.info('Stabilization manifest: triggering reconstruct-palace.sh');
    await ctx.cli.execute('bash scripts/reconstruct-palace.sh').catch(e => {
      ctx.logger.error('Stabilization manifest: reconstruct failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
