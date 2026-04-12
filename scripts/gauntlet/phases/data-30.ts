// scripts/gauntlet/phases/data-30.ts
// Phase 30 — DB Initialization / chronicle count (DATA block)

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 30, name: 'DB-Initialization', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
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
