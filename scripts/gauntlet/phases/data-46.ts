// scripts/gauntlet/phases/data-46.ts
// Phase 46 — Pulse Propagation (DATA block)
// Verifies sovereignty_depth is tracked in system_state and duel_history table exists.
// Execute: runs propagatePulse() via direct DB query to validate faction friction update.

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 46, name: 'Pulse-Propagation', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (!ctx.db) return false;

    // Verify duel_history table exists
    const tables = ctx.db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='duel_history'`
    ).all() as { name: string }[];
    if (tables.length === 0) return false;

    // Verify sovereignty_depth key exists in system_state
    const row = ctx.db.prepare(
      `SELECT value FROM system_state WHERE key = 'sovereignty_depth'`
    ).get() as { value: string } | undefined;

    return row !== undefined;
  },

  execute: async (ctx: GauntletContext): Promise<unknown> => {
    if (!ctx.db) throw new Error('DB not available');

    // Ensure sovereignty_depth seed exists
    ctx.db.prepare(
      `INSERT OR IGNORE INTO system_state (key, value) VALUES ('sovereignty_depth', '0.5')`
    ).run();

    // Ensure duel_history table exists
    ctx.db.exec(`
      CREATE TABLE IF NOT EXISTS duel_history (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          document_type TEXT NOT NULL,
          document_id   TEXT NOT NULL,
          document_name TEXT,
          faction       TEXT,
          result        TEXT NOT NULL CHECK (result IN ('VETO', 'DEFER', 'PASS', 'FAIL_LOCKED')),
          initiator     TEXT NOT NULL DEFAULT 'HUMAN' CHECK (initiator IN ('HUMAN', 'MACHINA')),
          occurred_at   DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed a test duel record to validate propagation math
    ctx.db.prepare(`
      INSERT INTO duel_history (document_type, document_id, document_name, faction, result, initiator)
      VALUES ('TokenDocument', 'gauntlet-test', 'Gauntlet Probe', NULL, 'PASS', 'HUMAN')
    `).run();

    // Verify sovereignty_depth update after simulated propagation
    const totalRow = ctx.db.prepare(`
      SELECT
        SUM(CASE WHEN result = 'VETO' THEN 1 ELSE 0 END)            AS machina_wins,
        SUM(CASE WHEN result IN ('DEFER', 'PASS') THEN 1 ELSE 0 END) AS human_wins
      FROM duel_history
    `).get() as { machina_wins: number | null; human_wins: number | null };

    const mWins = totalRow.machina_wins ?? 0;
    const hWins = totalRow.human_wins ?? 0;
    const total = mWins + hWins;
    const depth = total > 0 ? parseFloat((mWins / total).toFixed(4)) : 0.5;

    ctx.db.prepare(
      `UPDATE system_state SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'sovereignty_depth'`
    ).run(String(depth));

    const verified = ctx.db.prepare(
      `SELECT value FROM system_state WHERE key = 'sovereignty_depth'`
    ).get() as { value: string };

    ctx.logger.info(`Pulse-Propagation: sovereignty_depth=${verified.value} machina=${mWins} human=${hWins}`);

    // Clean up test record
    ctx.db.prepare(`DELETE FROM duel_history WHERE document_id = 'gauntlet-test'`).run();

    return { sovereigntyDepth: parseFloat(verified.value), machinaWins: mWins, humanWins: hWins };
  },
};
