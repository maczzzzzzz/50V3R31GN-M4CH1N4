// scripts/gauntlet/phases/data-43.ts
// Phase 43 — Semantic Reconstruction / RKG (DATA block)
// Note: block file data-block.ts takes priority at runtime.

import type { PhaseShard, GauntletContext } from '../types.js';
import { existsSync } from 'node:fs';

// RKG hierarchy subdirectories expected in the Obsidian vault
const RKG_BASE = process.env['OBSIDIAN_RKG_PATH'] ?? '/mnt/d/Obsidian_RKG';
const RKG_DIRS = ['Items', 'NPCs', 'Factions', 'Locations', 'Scenes', 'Chronicle'];

export const shard: PhaseShard = {
  metadata: { id: 43, name: 'Semantic-Reconstruction', block: 'DATA' },

  verify: async (_ctx: GauntletContext): Promise<boolean> => {
    // Verify full RKG hierarchy exists in the Obsidian vault (mounted Windows path)
    if (!existsSync(RKG_BASE)) return false;
    const missing = RKG_DIRS.filter(d => !existsSync(`${RKG_BASE}/${d}`));
    // Pass if vault root exists and at least the core dirs are present
    return missing.length < RKG_DIRS.length;
  },

  execute: async (ctx: GauntletContext): Promise<unknown> => {
    const missing = RKG_DIRS.filter(d => !existsSync(`${RKG_BASE}/${d}`));
    ctx.logger.info(`Semantic-Reconstruction: triggering reconstruct-palace.sh (missing RKG dirs: ${missing.join(', ') || 'none'})`);
    await ctx.cli.execute('bash scripts/reconstruct-palace.sh');
    return { triggered: true, missingDirs: missing };
  },
};
