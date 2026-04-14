/**
 * scripts/forge/topology-lib/generate-pngs.ts
 *
 * Generates high-resolution 1-bit topology skeleton PNGs.
 * Upscales the 16x16 logical grid to 512x512 with a tactical grid overlay.
 *
 * Usage: npx tsx scripts/forge/topology-lib/generate-pngs.ts
 *        npm run forge:topology
 */

import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { TILES, buildPixelMap, SIZE } from './tiles.js';
import type { TileDNA } from './schema.js';

const SKELETON_DIR = path.join(process.cwd(), 'scripts', 'forge', 'topology-lib', 'skeletons');
const SCALE = 32; // 16x16 -> 512x512
const OUTPUT_SIZE = SIZE * SCALE;

function generateTilePng(tile: TileDNA): void {
  const exitSet = new Set(tile.exits.map(e => e.side) as Array<'N'|'S'|'E'|'W'>);
  const pixelMap = buildPixelMap(exitSet);

  const png = new PNG({ width: OUTPUT_SIZE, height: OUTPUT_SIZE, colorType: 0, bitDepth: 8 });

  for (let y = 0; y < OUTPUT_SIZE; y++) {
    for (let x = 0; x < OUTPUT_SIZE; x++) {
      const gridX = Math.floor(x / SCALE);
      const gridY = Math.floor(y / SCALE);
      const idx = (y * OUTPUT_SIZE + x);
      
      const isWall = pixelMap[gridY]![gridX] === true;
      
      if (isWall) {
        png.data[idx] = 0; // Solid Black Wall
      } else {
        // Add a subtle 1px grid every 'SCALE' pixels to guide the AI
        const isGridLine = (x % SCALE === 0) || (y % SCALE === 0);
        png.data[idx] = isGridLine ? 200 : 255; // Slightly darker grid on white floor
      }
    }
  }

  const outPath = path.join(SKELETON_DIR, path.basename(tile.pngPath));
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(`  [forge] Generated Grid-Skel: ${outPath} (${OUTPUT_SIZE}x${OUTPUT_SIZE})`);
}

fs.mkdirSync(SKELETON_DIR, { recursive: true });
console.log('[forge] Generating 512x512 topology skeletons with tactical grids...');
for (const tile of TILES) {
  generateTilePng(tile);
}
console.log(`[forge] Done — ${TILES.length} skeletons written to ${SKELETON_DIR}`);
