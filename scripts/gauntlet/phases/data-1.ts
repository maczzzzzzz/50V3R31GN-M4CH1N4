// scripts/gauntlet/phases/data-1.ts
// Phase 1 — RAG Engine / SQLite FTS (DATA block)

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 1, name: 'RAG-Engine-FTS', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (!ctx.db) return false;
    try {
      ctx.db.prepare('SELECT COUNT(*) as c FROM triplets_fts').get();
      return true;
    } catch {
      return false;
    }
  },

  execute: async (ctx: GauntletContext, params?: unknown): Promise<unknown> => {
    if (!ctx.db) return null;
    const query = (params as { query?: string })?.query ?? '';
    return ctx.db
      .prepare('SELECT content FROM triplets WHERE subject LIKE ? LIMIT 5')
      .all(`%${query}%`);
  },
};
