/**
 * scripts/forge/blueprint-engine.ts
 *
 * Phase 54.2: Atlas Forge — Master Blueprint Engine
 *
 * Generates coherent slot-based floor layouts for megabuilding maps.
 * Each layout is a grid of slots; each slot holds a TileDNA reference.
 * Tiles are selected greedily so that neighbouring exits are compatible.
 *
 * Usage: npx tsx scripts/forge/blueprint-engine.ts
 *        npm run forge:blueprint
 */

import { TILES, getTileById, areCompatible } from './topology-lib/index.js';
import type { TileDNA, ExitSide } from './topology-lib/schema.js';

// ── Grid types ────────────────────────────────────────────────────────────────

export interface SlotConfig {
  row:    number;
  col:    number;
  tileId: string;
}

export interface LayoutConfig {
  id:    string;
  label: string;
  rows:  number;
  cols:  number;
  /** Slot overrides — if absent, engine fills automatically. */
  fixed?: SlotConfig[];
  /** If true, unfillable slots are left null (sealed wall) rather than erroring. */
  allowNullSlots?: boolean;
}

export interface PlacedTile {
  row:    number;
  col:    number;
  tile:   TileDNA;
}

export interface Blueprint {
  layout:  LayoutConfig;
  grid:    (PlacedTile | null)[][];
  /** True if all slots are placed and all neighbour exits are compatible. */
  valid:   boolean;
  errors:  string[];
}

// ── Layout presets ────────────────────────────────────────────────────────────

export const LAYOUT_PRESETS: LayoutConfig[] = [
  {
    id:             'megabuilding-3x3',
    label:          'Megabuilding Floor (3×3)',
    rows:           3,
    cols:           3,
    allowNullSlots: true,  // corners are sealed walls
    fixed: [
      { row: 1, col: 1, tileId: 'hub' },     // centre = junction
      { row: 0, col: 1, tileId: 'gaff' },    // top centre = dead-end
      { row: 2, col: 1, tileId: 'gaff' },    // bottom centre = dead-end
      { row: 1, col: 0, tileId: 'artery' },  // left = corridor
      { row: 1, col: 2, tileId: 'artery' },  // right = corridor
    ],
  },
  {
    id:    'corridor-strip-1x3',
    label: 'Corridor Strip (1×3)',
    rows:  1,
    cols:  3,
    // All artery tiles — valid E↔W chain forming a straight corridor
    fixed: [
      { row: 0, col: 0, tileId: 'artery' },
      { row: 0, col: 1, tileId: 'artery' },
      { row: 0, col: 2, tileId: 'artery' },
    ],
  },
];

// ── Compatibility helpers ─────────────────────────────────────────────────────

const DIRECTIONS: Array<{ dr: number; dc: number; side: ExitSide }> = [
  { dr: -1, dc:  0, side: 'N' },
  { dr:  1, dc:  0, side: 'S' },
  { dr:  0, dc: -1, side: 'W' },
  { dr:  0, dc:  1, side: 'E' },
];

function candidatesForSlot(
  grid: (PlacedTile | null)[][],
  row: number,
  col: number,
): TileDNA[] {
  return TILES.filter(candidate => {
    for (const { dr, dc, side } of DIRECTIONS) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0]!.length) continue;
      const neighbour = grid[nr]?.[nc];
      if (!neighbour) continue;
      // The candidate's `side` must be compatible with neighbour's opposite
      if (!areCompatible(candidate, side, neighbour.tile)) return false;
    }
    return true;
  });
}

// ── Blueprint assembly ────────────────────────────────────────────────────────

export function assemble(config: LayoutConfig): Blueprint {
  const grid: (PlacedTile | null)[][] =
    Array.from({ length: config.rows }, () => Array(config.cols).fill(null));

  const errors: string[] = [];

  // Place fixed tiles first
  for (const fix of config.fixed ?? []) {
    const tile = getTileById(fix.tileId);
    if (!tile) {
      errors.push(`Fixed slot (${fix.row},${fix.col}): unknown tileId '${fix.tileId}'`);
      continue;
    }
    grid[fix.row]![fix.col] = { row: fix.row, col: fix.col, tile };
  }

  // Fill remaining slots with greedy compatible selection
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (grid[r]![c] !== null) continue;
      const candidates = candidatesForSlot(grid, r, c);
      if (candidates.length === 0) {
        if (!config.allowNullSlots) {
          errors.push(`Slot (${r},${c}): no compatible tile found — placed null`);
        }
        continue;
      }
      // Prefer hubs at centre, corridors for non-corner non-centre positions
      const chosen = candidates[0]!;
      grid[r]![c] = { row: r, col: c, tile: chosen };
    }
  }

  // Validate all neighbours
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const placed = grid[r]![c];
      if (!placed) continue;
      for (const { dr, dc, side } of DIRECTIONS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= config.rows || nc < 0 || nc >= config.cols) continue;
        const neighbour = grid[nr]?.[nc];
        if (!neighbour) continue;
        if (!areCompatible(placed.tile, side, neighbour.tile)) {
          errors.push(`Incompatible: (${r},${c})${placed.tile.id}[${side}] ↔ (${nr},${nc})${neighbour.tile.id}`);
        }
      }
    }
  }

  return {
    layout: config,
    grid,
    valid:  errors.length === 0 && (config.allowNullSlots || grid.every(row => row.every(s => s !== null))),
    errors,
  };
}

/** Render the layout as an ASCII grid for quick inspection. */
export function renderAscii(bp: Blueprint): string {
  return bp.grid.map(row =>
    row.map(s => (s ? s.tile.id.toUpperCase().slice(0, 3).padEnd(3) : '???')).join(' | ')
  ).join('\n');
}

// ── CLI ───────────────────────────────────────────────────────────────────────

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  for (const preset of LAYOUT_PRESETS) {
    const bp = assemble(preset);
    console.log(`\n◈ ${preset.label}`);
    console.log(renderAscii(bp));
    console.log(`  Valid: ${bp.valid}${bp.errors.length ? '\n  Errors: ' + bp.errors.join(', ') : ''}`);
  }
}
