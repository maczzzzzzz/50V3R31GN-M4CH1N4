/**
 * scripts/forge/topology-lib/schema.ts
 *
 * TileDNA Schema — maps 1-bit topology skeleton PNGs to wall/exit coordinates.
 * Grid unit: 1px = 1 cell. Rooms are always 16x16px skeletons at 1:1 scale.
 */

// ── Exit & wall geometry ──────────────────────────────────────────────────────

export type ExitSide = 'N' | 'S' | 'E' | 'W';

/** Opposite side mapping for connectivity checks. */
export const OPPOSITE: Record<ExitSide, ExitSide> = { N: 'S', S: 'N', E: 'W', W: 'E' };

/** Pixel-space gap in the outer wall that forms an exit. */
export interface ExitDef {
  side:    ExitSide;
  startPx: number;  // inclusive, along the wall axis
  endPx:   number;  // inclusive
}

/** An interior or outer wall segment defined as two endpoints in px. */
export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ── TileDNA ───────────────────────────────────────────────────────────────────

export interface TileDNA {
  /** Unique room identifier, e.g. "gaff", "artery", "hub". */
  id:           string;
  /** Human-readable label used in Foundry and Nucleus SENSORY. */
  label:        string;
  /** Path to the 1-bit PNG skeleton relative to project root. */
  pngPath:      string;
  /** Canvas dimensions in pixels. */
  widthPx:      number;
  heightPx:     number;
  /** Exits — gaps in the outer wall that connect to adjacent tiles. */
  exits:        ExitDef[];
  /** Interior wall segments for Foundry wall placement. */
  wallSegments: WallSegment[];
  /** Semantic tags for slot-based layout selection. */
  tags:         string[];
}

// ── Library index entry ───────────────────────────────────────────────────────

export interface TileLibrary {
  version:  string;
  tiles:    TileDNA[];
}
