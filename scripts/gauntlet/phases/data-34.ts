// scripts/gauntlet/phases/data-34.ts
// Phase 34 — Memory Palace Hierarchy (DATA block)
// Note: block file data-block.ts takes priority at runtime.

import type { PhaseShard, GauntletContext } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 34, name: 'Memory-Palace-Hierarchy', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (!ctx.db) return false;
    const tables = ctx.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'palace_%'")
      .all() as { name: string }[];
    return tables.length >= 2;
  },

  execute: async (ctx: GauntletContext, roomId?: unknown): Promise<unknown> => {
    if (!ctx.db) return null;
    return ctx.db.prepare('SELECT * FROM palace_rooms WHERE id = ?').get(roomId);
  },
};
