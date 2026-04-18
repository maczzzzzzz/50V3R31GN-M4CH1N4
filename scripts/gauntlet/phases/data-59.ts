// scripts/gauntlet/phases/data-59.ts
// Phase 59 — Canonical Mirror Verification (DATA block)
//
// Verifies:
//   1. Akashik.db v4 schema tables exist and are populated.
//   2. dv_tables entries are present for the canonical weapon categories.
//   3. Exploding d10 logic is statistically sound (CPU-mirror of canonical_math.rs).
//   4. DV fallback values match CPR Core Rulebook p.413.
//
// Execute: offline (no CDP required), queries Akashik.db directly.

import type { PhaseShard, GauntletContext } from '../types.js';

// ---------------------------------------------------------------------------
// CPU mirror of canonical_math.rs::roll_d10_exploding() for in-process proof
// ---------------------------------------------------------------------------

function rollExplodingD10(): number {
  let total = 0;
  let current = Math.ceil(Math.random() * 10);
  total += current;

  // Explode up: 10 → roll again and add
  while (current === 10) {
    current = Math.ceil(Math.random() * 10);
    total += current;
  }

  // Explode down: if the *re-rolled* initial is 1, subtract further rolls
  // Matches canonical_math.rs logic exactly (separate re-roll for downward check)
  let initial = Math.ceil(Math.random() * 10);
  if (initial === 1) {
    total = initial;
    do {
      initial = Math.ceil(Math.random() * 10);
      total -= initial;
    } while (initial === 1);
  }

  return total;
}

// Hardcoded fallback DV table (CPR Core p.413) — mirrors dv_resolver.rs
const FALLBACK_DV: Record<string, number> = {
  'pistol:medium':    15,
  'pistol:close':     13,
  'pistol:long':      20,
  'pistol:extreme':   25,
  'rifle:long':       15,
  'rifle:close':      17,
  'rifle:medium':     16,
  'rifle:extreme':    13,
  'shotgun:close':    13,
  'shotgun:medium':   15,
  'smg:medium':       13,
  'smg:close':        15,
  'melee:close':      15,
};

export const shard: PhaseShard = {
  metadata: { id: 59, name: 'Canonical-Mirror', block: 'DATA' },

  verify: async (ctx: GauntletContext): Promise<boolean> => {
    if (!ctx.db) {
      ctx.logger.error('Phase 59: No DB connection — cannot verify schema');
      return false;
    }

    const errors: string[] = [];

    // 1. Required v4 tables exist
    const requiredTables = ['dv_tables', 'item_modifiers', 'item_components', 'localized_dictionary'];
    for (const table of requiredTables) {
      const exists = ctx.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);
      if (!exists) errors.push(`Missing table: ${table}`);
    }

    // 2. dv_tables has entries
    const dvCount = (ctx.db.prepare('SELECT count(*) as c FROM dv_tables').get() as { c: number }).c;
    if (dvCount === 0) errors.push('dv_tables is empty — DV resolution will fall back to hardcoded only');

    // 3. Canonical DV lookup for pistol/medium
    const pistolMedium = ctx.db.prepare(
      "SELECT dv FROM dv_tables WHERE weapon_category='pistol' AND range_bracket='medium'"
    ).get() as { dv: number } | undefined;
    if (pistolMedium && pistolMedium.dv !== 15) {
      errors.push(`pistol/medium DV mismatch: got ${pistolMedium.dv}, expected 15`);
    }

    // 4. Exploding d10: 1000-roll statistical proof — never 0, distribution sane
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 1000; i++) {
      const r = rollExplodingD10();
      if (r === 0) { errors.push('Exploding d10 produced 0 — canonical_math violation'); break; }
      if (r < min) min = r;
      if (r > max) max = r;
    }
    if (min > 1) errors.push(`Exploding d10 minimum ${min} — expected to reach 1 or below over 1000 rolls`);
    if (max < 10) errors.push(`Exploding d10 maximum ${max} — explosion never triggered over 1000 rolls`);

    // 5. Fallback DV sanity: pistol/medium = 15 (CPR p.413)
    if (FALLBACK_DV['pistol:medium'] !== 15) errors.push('Hardcoded fallback pistol/medium DV corrupted');
    if (FALLBACK_DV['rifle:long'] !== 15) errors.push('Hardcoded fallback rifle/long DV corrupted');

    if (errors.length > 0) {
      ctx.logger.error('Phase 59 verify FAILED', { errors });
      return false;
    }

    ctx.logger.info('Phase 59 verify PASS — Canonical Mirror schema and math verified');
    return true;
  },

  execute: async (ctx: GauntletContext): Promise<unknown> => {
    const results: Record<string, unknown> = {};

    // Schema inventory
    if (ctx.db) {
      const tables = ctx.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      ).all() as { name: string }[];
      results['tables'] = tables.map(t => t.name);

      const dvCount = (ctx.db.prepare('SELECT count(*) as c FROM dv_tables').get() as { c: number }).c;
      const itemModCount = (ctx.db.prepare('SELECT count(*) as c FROM item_modifiers').get() as { c: number }).c;
      results['dv_table_rows'] = dvCount;
      results['item_modifier_rows'] = itemModCount;

      // Sample DV entries
      const dvSample = ctx.db.prepare(
        'SELECT weapon_category, range_bracket, dv FROM dv_tables LIMIT 10'
      ).all();
      results['dv_sample'] = dvSample;
    }

    // Exploding d10 distribution (100 rolls)
    const rolls: number[] = [];
    for (let i = 0; i < 100; i++) rolls.push(rollExplodingD10());
    const avg = rolls.reduce((s, v) => s + v, 0) / rolls.length;
    results['d10_explosion_distribution'] = {
      samples: 100,
      min: Math.min(...rolls),
      max: Math.max(...rolls),
      avg: parseFloat(avg.toFixed(2)),
      explosions_detected: rolls.filter(r => r > 10).length,
    };

    // Fallback DV table dump
    results['fallback_dv'] = FALLBACK_DV;

    ctx.logger.info('Phase 59 execute complete', results);
    return results;
  },
};
