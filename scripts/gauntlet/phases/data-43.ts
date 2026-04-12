// scripts/gauntlet/phases/data-43.ts
// Phase 43 — Semantic Reconstruction / RKG (DATA block)
// Note: block file data-block.ts takes priority at runtime.

import type { PhaseShard, GauntletContext } from '../types.js';
import { existsSync } from 'node:fs';

export const shard: PhaseShard = {
  metadata: { id: 43, name: 'Semantic-Reconstruction', block: 'DATA' },

  verify: async (_ctx: GauntletContext): Promise<boolean> => {
    // Verify RKG Items exist in the Obsidian vault (mounted Windows path)
    return existsSync('/mnt/d/Obsidian_RKG/Items');
  },

  execute: async (_ctx: GauntletContext): Promise<unknown> => {
    const { execSync } = await import('node:child_process');
    execSync('bash scripts/reconstruct-palace.sh', { stdio: 'inherit' });
    return true;
  },
};
