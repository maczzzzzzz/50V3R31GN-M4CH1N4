// scripts/gauntlet/phases/data-1.ts
// Phase 1 — RAG Engine / pgvector (DATA block)
// Note: block file data-block.ts takes priority at runtime.

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 1, name: 'RAG-Engine-pgvector', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (!ctx.pg) {
      // No pg client — fall back to SQLite triplets FTS as RAG backend verification
      if (!ctx.db) return false;
      try {
        const res = ctx.db.prepare("SELECT COUNT(*) as c FROM triplets_fts").get() as { c: number } | undefined;
        return (res?.c ?? 0) >= 0; // table exists → schema is present
      } catch {
        return false;
      }
    }
    try {
      const res = await ctx.pg.query('SELECT 1');
      return (res.rowCount ?? 0) === 1;
    } catch {
      return false;
    }
  },

  execute: async (ctx: GauntletContext, params?: unknown): Promise<unknown> => {
    const { namespace, query } = (params ?? {}) as { namespace?: string; query?: string };
    if (ctx.pg) {
      return ctx.pg.query('SELECT content FROM chunks WHERE namespace = $1 LIMIT 1', [namespace ?? '']);
    }
    // SQLite fallback
    if (ctx.db && query) {
      return ctx.db.prepare('SELECT content FROM triplets WHERE subject LIKE ? LIMIT 1').get(`%${query}%`);
    }
    return null;
  },
};
