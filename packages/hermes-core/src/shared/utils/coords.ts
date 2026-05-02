/**
 * ◈ COORDS_UTIL : Clean BASE
 *
 * Machine coordinates are normalized 0-1000 for agnostic spatial awareness.
 */

export function normalizedToMachine(val: number): number {
  return Math.round(val * 1000);
}
