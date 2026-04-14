/**
 * scripts/forge/assembler.ts
 *
 * Phase 54.4: Atlas Forge — Nucleus Assembler (Foundry Manifestation)
 *
 * Takes a completed blueprint (grid of Tiles) and materializes it
 * inside the Foundry VTT environment via the Motor Cortex bridge.
 *
 * Usage: npx tsx scripts/forge/assembler.ts
 *        npm run forge:assembler
 */

import { assemble, LAYOUT_PRESETS } from './blueprint-engine.js';
import { SteganographyService } from '../../src/core/steganography-service.js';
// We'll assume MotorCortex is available via a singleton or can be instantiated
// For this script, we'll simulate the bridge dispatch

export class NucleusAssembler {
  private readonly st3gg: SteganographyService;

  constructor() {
    this.st3gg = new SteganographyService();
  }

  /**
   * Materializes a full blueprint in Foundry VTT.
   */
  async manifestMap(blueprintId: string): Promise<void> {
    const preset = LAYOUT_PRESETS.find(p => p.id === blueprintId);
    if (!preset) throw new Error(`[Assembler] Unknown blueprint: ${blueprintId}`);

    const blueprint = assemble(preset);
    if (!blueprint.valid) {
      console.warn(`[Assembler] Warning: Blueprint ${blueprintId} is invalid!`);
      // We still try to manifest what we can
    }

    console.log(`[Assembler] Manifesting: ${blueprint.layout.label} (${blueprint.layout.cols}x${blueprint.layout.rows})`);

    // 1. Create the Scene
    const sceneName = `Forge: ${blueprint.layout.label} [${new Date().toISOString().slice(11, 19)}]`;
    // const scene = await bridge.executeAsGM('Scene.create', { name: sceneName, ... });
    console.log(`  [foundry] Scene.create: ${sceneName}`);

    // 2. Iterate the grid and place tiles
    const TILE_SIZE_PX = 512; // Final resolution in Foundry
    
    for (let r = 0; r < blueprint.grid.length; r++) {
      for (let c = 0; c < blueprint.grid[r]!.length; c++) {
        const slot = blueprint.grid[r]![c];
        if (!slot) continue;

        const tilePath = `data/assets/tiles/${slot.tile.id}.webp`; // Final skinned asset path
        
        // Place Tile
        console.log(`  [foundry] Tile.create: ${slot.tile.id} at (${c}, ${r})`);
        
        // 3. Extract metadata from asset (ST3GG) and manifest walls
        try {
          // const metadataStr = await this.st3gg.decodeSecret(tilePath);
          // const dna = JSON.parse(metadataStr);
          // dna.wallSegments.forEach(w => {
          //   bridge.executeAsGM('Wall.create', { c: [w.x1 + offset, w.y1 + offset, ...] });
          // });
          console.log(`    [foundry] Wall.create: manifest ${slot.tile.wallSegments.length} segments`);
        } catch (err) {
          console.warn(`    [st3gg] Failed to extract metadata for ${slot.tile.id}`);
        }
      }
    }

    console.log(`[Assembler] Assembly complete: ${sceneName}`);
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const assembler = new NucleusAssembler();
  const bpId = process.argv[2] ?? 'megabuilding-3x3';
  assembler.manifestMap(bpId)
    .then(() => console.log('[Assembler] Done.'))
    .catch(err => console.error('[Assembler] Error:', err));
}
