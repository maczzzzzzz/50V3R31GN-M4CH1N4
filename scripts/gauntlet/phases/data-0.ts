// scripts/gauntlet/phases/data-0.ts
// Phase 0 — Foundation Schemas (DATA block)
// Note: block file data-block.ts takes priority at runtime; this file provides
// the PhaseShard.verify/execute interface as specified in the implementation plan.

import type { PhaseShard, GauntletContext } from '../types.js';
import { ActorSchema } from '../../../src/shared/schemas/actor.schema.js';

export const shard: PhaseShard = {
  metadata: { id: 0, name: 'Foundation-Schemas', block: 'DATA' },

  verify: async (_ctx: GauntletContext): Promise<boolean> => {
    // Verify ActorSchema is importable and functional by parsing minimal valid data
    // ActorSchema requires full stats/derivedStats/roleInfo/information — use safeParse
    // on a complete minimal fixture so schema infrastructure health is confirmed
    const fixture = {
      name: 'Test-NPC',
      type: 'mook' as const,
      system: {
        stats: {
          int: { value: 6 }, ref: { value: 6 }, dex: { value: 6 },
          tech: { value: 6 }, cool: { value: 6 }, will: { value: 6 },
          luck: { value: 6, max: 6 }, move: { value: 6 }, body: { value: 6 },
          emp: { value: 6, max: 6 },
        },
        derivedStats: {
          hp: { value: 30, max: 30 },
          humanity: { value: 40, max: 40 },
          deathSave: { value: 6, penalty: 0, basePenalty: 0 },
          currentWoundState: 'notWounded' as const,
          seriouslyWounded: 25,
          walk: { value: 6 },
          run: { value: 12 },
        },
        roleInfo: { activeRole: 'Solo', activeNetRole: '' },
        information: { alias: '', description: '', notes: '', history: '' },
      },
    };
    return ActorSchema.safeParse(fixture).success;
  },

  execute: async (_ctx: GauntletContext, params?: unknown): Promise<unknown> => {
    return ActorSchema.parse(params);
  },
};
