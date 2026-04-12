// scripts/gauntlet/phases/data-30.ts
// Phase 30 — DB Initialization / chunk count (DATA block)
// Note: block file data-block.ts takes priority at runtime.

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 30, name: 'DB-Initialization', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (ctx.pg) {
      try {
        const res = await ctx.pg.query('SELECT count(*) FROM chunks');
        return parseInt(String(res.rows[0]?.['count'] ?? '0'), 10) > 0;
      } catch {
        return false;
      }
    }
    // SQLite fallback — verify chronicle_seeds table has data
    if (!ctx.db) return false;
    try {
      const res = ctx.db.prepare('SELECT COUNT(*) as c FROM chronicle_seeds').get() as { c: number };
      return res.c > 0;
    } catch {
      return false;
    }
  },

  execute: async (_ctx: GauntletContext): Promise<unknown> => {
    return true;
  },
};
