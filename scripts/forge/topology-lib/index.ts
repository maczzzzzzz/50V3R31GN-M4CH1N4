/**
 * scripts/forge/topology-lib/index.ts
 *
 * Atlas Forge Topology Library — public API.
 * Provides tile lookup, exit-compatible filtering, and PNG path resolution.
 */

import fs from 'node:fs';
import { TILES, LIBRARY } from './tiles.js';
import { OPPOSITE } from './schema.js';
import type { TileDNA, ExitSide } from './schema.js';

export { TILES, LIBRARY };
export type { TileDNA, ExitSide };
export { buildPixelMap } from './tiles.js';

// ── Tile lookup ───────────────────────────────────────────────────────────────

export function getTileById(id: string): TileDNA | undefined {
  return TILES.find(t => t.id === id);
}

export function getTilesByTag(tag: string): TileDNA[] {
  return TILES.filter(t => t.tags.includes(tag));
}

/** Returns tiles whose exit set is a superset of the required exits. */
export function getTilesWithExits(required: ExitSide[]): TileDNA[] {
  return TILES.filter(t => {
    const tileExits = new Set(t.exits.map(e => e.side));
    return required.every(r => tileExits.has(r));
  });
}

// ── Connectivity ──────────────────────────────────────────────────────────────

/** Check whether tile A's exit on `side` is compatible with tile B's opposite exit. */
export function areCompatible(a: TileDNA, side: ExitSide, b: TileDNA): boolean {
  const aHas = a.exits.some(e => e.side === side);
  const bHas = b.exits.some(e => e.side === OPPOSITE[side]);
  // Compatible if both have matching exits, or neither does (wall-to-wall)
  return aHas === bHas;
}

// ── PNG existence check ───────────────────────────────────────────────────────

export function skeletonsGenerated(): boolean {
  return TILES.every(t => fs.existsSync(t.pngPath));
}

export function getMissingSkeletons(): string[] {
  return TILES.filter(t => !fs.existsSync(t.pngPath)).map(t => t.pngPath);
}
