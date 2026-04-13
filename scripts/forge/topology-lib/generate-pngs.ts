/**
 * scripts/forge/topology-lib/generate-pngs.ts
 *
 * Generates 1-bit topology skeleton PNGs for each room in the library.
 * Uses pngjs to write 16x16 black-and-white PNGs.
 *
 * Usage: npx tsx scripts/forge/topology-lib/generate-pngs.ts
 *        npm run forge:topology
 */

import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { TILES, buildPixelMap } from './tiles.js';
import type { TileDNA } from './schema.js';

const SKELETON_DIR = path.join(process.cwd(), 'scripts', 'forge', 'topology-lib', 'skeletons');

function generateTilePng(tile: TileDNA): void {
  const exitSet = new Set(tile.exits.map(e => e.side) as Array<'N'|'S'|'E'|'W'>);
  const pixelMap = buildPixelMap(exitSet);

  const png = new PNG({ width: tile.widthPx, height: tile.heightPx, colorType: 0, bitDepth: 8 });

  for (let y = 0; y < tile.heightPx; y++) {
    for (let x = 0; x < tile.widthPx; x++) {
      const idx = (y * tile.widthPx + x);
      // PNG colorType 0 = greyscale; idx maps to the data buffer
      const isWall = pixelMap[y]![x] === true;
      png.data[idx] = isWall ? 0 : 255; // black=wall, white=floor
    }
  }

  const outPath = path.join(SKELETON_DIR, path.basename(tile.pngPath));
  const buf = PNG.sync.write(png);
  fs.writeFileSync(outPath, buf);
  console.log(`  [forge] Generated: ${outPath} (${tile.widthPx}x${tile.heightPx})`);
}

fs.mkdirSync(SKELETON_DIR, { recursive: true });
console.log('[forge] Generating 1-bit topology skeleton PNGs...');
for (const tile of TILES) {
  generateTilePng(tile);
}
console.log(`[forge] Done — ${TILES.length} skeletons written to ${SKELETON_DIR}`);
