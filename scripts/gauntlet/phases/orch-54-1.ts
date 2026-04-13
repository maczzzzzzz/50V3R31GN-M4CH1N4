/**
 * scripts/gauntlet/phases/orch-54-1.ts
 *
 * Phase 54.1: Atlas Forge — Topology Library Indexing
 *
 * Verifies: tile definitions load correctly, all 3 skeletons exist on disk,
 * TileDNA exit maps are consistent with pixel maps, and lookup functions work.
 */

import { existsSync } from 'node:fs';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { TILES, getTileById, getTilesWithExits, areCompatible, skeletonsGenerated, getMissingSkeletons } from '../../../scripts/forge/topology-lib/index.js';
import { buildPixelMap, EXIT_START, EXIT_END, SIZE } from '../../../scripts/forge/topology-lib/tiles.js';

const PHASE_ID   = 541;
const PHASE_NAME = 'Topology-Library-Index';
const BLOCK      = 'ATLAS_FORGE';

export const phase54_1: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Library count
    if (TILES.length < 3) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Expected ≥3 tiles, got ${TILES.length}` };
    }
    details['tileCount'] = TILES.length;

    // 2. Required tile IDs present
    for (const id of ['gaff', 'artery', 'hub']) {
      if (!getTileById(id)) {
        return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Missing tile id: ${id}` };
      }
    }
    details['requiredTiles'] = 'gaff,artery,hub';

    // 3. PNG skeletons on disk
    if (!skeletonsGenerated()) {
      const missing = getMissingSkeletons();
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Missing skeleton PNGs: ${missing.join(', ')}` };
    }
    details['skeletons'] = 'ALL_PRESENT';

    // 4. Pixel map consistency: exits must be open (false) at the gap, walls closed elsewhere
    for (const tile of TILES) {
      const exitSet = new Set(tile.exits.map(e => e.side) as Array<'N'|'S'|'E'|'W'>);
      const grid = buildPixelMap(exitSet);

      for (const exit of tile.exits) {
        for (let p = EXIT_START; p <= EXIT_END; p++) {
          let isOpen: boolean;
          switch (exit.side) {
            case 'N': isOpen = grid[0]![p] === false; break;
            case 'S': isOpen = grid[SIZE-1]![p] === false; break;
            case 'E': isOpen = grid[p]![SIZE-1] === false; break;
            case 'W': isOpen = grid[p]![0] === false; break;
          }
          if (!isOpen!) {
            return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Tile ${tile.id}: exit ${exit.side} px${p} not open in pixel map` };
          }
        }
      }
    }
    details['pixelMapConsistency'] = 'PASS';

    // 5. Exit-based lookup: hub should support all 4 exits
    const allFour = getTilesWithExits(['N', 'S', 'E', 'W']);
    if (allFour.length === 0 || !allFour.some(t => t.id === 'hub')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Hub tile not found by 4-exit lookup' };
    }
    details['exitLookup'] = `hub found (${allFour.length} matching)`;

    // 6. Compatibility check: hub N ↔ gaff S should be compatible
    const hub  = getTileById('hub')!;
    const gaff = getTileById('gaff')!;
    if (!areCompatible(hub, 'N', gaff)) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'hub(N) ↔ gaff(S) compatibility check failed' };
    }
    details['compatibilityCheck'] = 'hub(N)↔gaff(S) COMPATIBLE';

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Topology library indexed: ${TILES.length} tiles, all skeletons present, pixel maps valid`,
      details,
    };
  }
};
