/**
 * scripts/forge/topology-lib/tiles.ts
 *
 * Room definitions for the Atlas Forge topology library.
 * Each tile is a 16x16px 1-bit skeleton (1=wall/black, 0=floor/white).
 *
 * Rooms:
 *   THE GAFF    — small dead-end room, exits N+S
 *   THE ARTERY  — corridor tile, exits E+W
 *   THE HUB     — junction room, exits N+S+E+W
 *
 * Exit gap: 4px wide, centred at px 6–9 on a 16px axis (0-indexed).
 */

import path from 'node:path';
import type { TileDNA, TileLibrary } from './schema.js';

const SKELETON_DIR = path.join('scripts', 'forge', 'topology-lib', 'skeletons');

// ── Grid helpers ──────────────────────────────────────────────────────────────

export const SIZE = 16; // px (1-bit skeleton canvas)

// Exit gap column/row indices (inclusive, centred on the 16px axis)
export const EXIT_START = 6;
export const EXIT_END   = 9;

/**
 * Generate the 1-bit pixel map for a room.
 * Returns a SIZE×SIZE boolean array where true = wall (black).
 */
export function buildPixelMap(exits: Set<'N'|'S'|'E'|'W'>): boolean[][] {
  const grid: boolean[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

  // Fill outer border as walls
  for (let i = 0; i < SIZE; i++) {
    grid[0]![i]      = true; // top row (N wall)
    grid[SIZE-1]![i] = true; // bottom row (S wall)
    grid[i]![0]      = true; // left col (W wall)
    grid[i]![SIZE-1] = true; // right col (E wall)
  }

  // Carve exit gaps
  for (let p = EXIT_START; p <= EXIT_END; p++) {
    if (exits.has('N')) grid[0]![p]      = false;
    if (exits.has('S')) grid[SIZE-1]![p] = false;
    if (exits.has('E')) grid[p]![SIZE-1] = false;
    if (exits.has('W')) grid[p]![0]      = false;
  }

  return grid;
}

// ── Tile definitions ──────────────────────────────────────────────────────────

export const TILES: TileDNA[] = [
  {
    id:       'gaff',
    label:    'THE GAFF',
    pngPath:  path.join(SKELETON_DIR, 'gaff.png'),
    widthPx:  SIZE,
    heightPx: SIZE,
    exits: [
      { side: 'N', startPx: EXIT_START, endPx: EXIT_END },
      { side: 'S', startPx: EXIT_START, endPx: EXIT_END },
    ],
    wallSegments: [
      // Outer walls (N/S full except exits; E/W full)
      { x1: 0, y1: 0,      x2: EXIT_START-1, y2: 0 },       // N-left
      { x1: EXIT_END+1, y1: 0, x2: SIZE-1, y2: 0 },         // N-right
      { x1: 0, y1: SIZE-1, x2: EXIT_START-1, y2: SIZE-1 },  // S-left
      { x1: EXIT_END+1, y1: SIZE-1, x2: SIZE-1, y2: SIZE-1 },// S-right
      { x1: 0, y1: 0,      x2: 0,      y2: SIZE-1 },         // W full
      { x1: SIZE-1, y1: 0, x2: SIZE-1, y2: SIZE-1 },         // E full
    ],
    tags: ['room', 'small', 'dead-end'],
  },
  {
    id:       'artery',
    label:    'THE ARTERY',
    pngPath:  path.join(SKELETON_DIR, 'artery.png'),
    widthPx:  SIZE,
    heightPx: SIZE,
    exits: [
      { side: 'E', startPx: EXIT_START, endPx: EXIT_END },
      { side: 'W', startPx: EXIT_START, endPx: EXIT_END },
    ],
    wallSegments: [
      { x1: 0, y1: 0,      x2: SIZE-1, y2: 0 },              // N full
      { x1: 0, y1: SIZE-1, x2: SIZE-1, y2: SIZE-1 },         // S full
      { x1: 0, y1: 0,      x2: 0, y2: EXIT_START-1 },        // W-top
      { x1: 0, y1: EXIT_END+1, x2: 0, y2: SIZE-1 },          // W-bottom
      { x1: SIZE-1, y1: 0, x2: SIZE-1, y2: EXIT_START-1 },   // E-top
      { x1: SIZE-1, y1: EXIT_END+1, x2: SIZE-1, y2: SIZE-1 },// E-bottom
    ],
    tags: ['corridor', 'transit'],
  },
  {
    id:       'hub',
    label:    'THE HUB',
    pngPath:  path.join(SKELETON_DIR, 'hub.png'),
    widthPx:  SIZE,
    heightPx: SIZE,
    exits: [
      { side: 'N', startPx: EXIT_START, endPx: EXIT_END },
      { side: 'S', startPx: EXIT_START, endPx: EXIT_END },
      { side: 'E', startPx: EXIT_START, endPx: EXIT_END },
      { side: 'W', startPx: EXIT_START, endPx: EXIT_END },
    ],
    wallSegments: [
      // N wall
      { x1: 0, y1: 0,      x2: EXIT_START-1, y2: 0 },
      { x1: EXIT_END+1, y1: 0, x2: SIZE-1, y2: 0 },
      // S wall
      { x1: 0, y1: SIZE-1, x2: EXIT_START-1, y2: SIZE-1 },
      { x1: EXIT_END+1, y1: SIZE-1, x2: SIZE-1, y2: SIZE-1 },
      // W wall
      { x1: 0, y1: 0,      x2: 0, y2: EXIT_START-1 },
      { x1: 0, y1: EXIT_END+1, x2: 0, y2: SIZE-1 },
      // E wall
      { x1: SIZE-1, y1: 0, x2: SIZE-1, y2: EXIT_START-1 },
      { x1: SIZE-1, y1: EXIT_END+1, x2: SIZE-1, y2: SIZE-1 },
    ],
    tags: ['junction', 'hub', 'large'],
  },
];

export const LIBRARY: TileLibrary = {
  version: '1.0.0',
  tiles:   TILES,
};
