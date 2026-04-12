// scripts/gauntlet/phases/data-47.ts
// Phase 47: UN1V3R54L-C0D3X — District Harmonization & Memory Consolidation Shard

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync } from 'node:fs';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 47, phaseName: 'UN1V3R54L-C0D3X', block: 'DATA', status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 47, phaseName: 'UN1V3R54L-C0D3X', block: 'DATA', status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 47, phaseName: 'UN1V3R54L-C0D3X', block: 'DATA', status: 'WARN', message: msg, details };
}
function skip(msg: string): AuditResult {
  return { phaseId: 47, phaseName: 'UN1V3R54L-C0D3X', block: 'DATA', status: 'SKIP', message: msg };
}

export const phase47: SovereignShard = {
  metadata: { id: 47, name: 'UN1V3R54L-C0D3X', block: 'DATA' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    // 1. Harmonizer script must exist
    if (!existsSync('scripts/harmonize-rkg.ts')) {
      return fail('harmonize-rkg.ts not found');
    }

    if (!ctx.db) return skip('world.db not available — skipping district integrity checks');

    const details: Record<string, unknown> = {};

    // 2. district_id columns: verify across all target tables
    const TARGET_TABLES = ['npcs', 'factions', 'locations', 'triplets', 'chronicle_seeds'];
    const missingColumns: string[] = [];
    try {
      const existing = (
        ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
      ).map(r => r.name);

      for (const table of TARGET_TABLES) {
        if (!existing.includes(table)) continue;
        const cols = ctx.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
        if (!cols.some(c => c.name === 'district_id')) {
          missingColumns.push(table);
        }
      }
    } catch (e) {
      return fail(`Schema introspection failed: ${(e as Error).message}`);
    }

    if (missingColumns.length > 0) {
      return fail(`district_id missing from: ${missingColumns.join(', ')}`, { missingColumns });
    }
    details['districtIdColumns'] = 'ALL PRESENT';

    // 3. district_dna must exist and be populated
    let districtCount = 0;
    try {
      districtCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM district_dna').get() as { c: number }).c;
    } catch {
      return warn('district_dna table not found', details);
    }
    if (districtCount === 0) {
      return warn('district_dna is empty — harmonization will be a no-op', { ...details, districtCount });
    }
    details['districtDNACount'] = districtCount;

    // 4. chronicle_seeds: check how many have been harmonized
    let totalChronicles = 0;
    let harmonizedChronicles = 0;
    try {
      totalChronicles = (ctx.db.prepare('SELECT COUNT(*) as c FROM chronicle_seeds').get() as { c: number }).c;
      harmonizedChronicles = (
        ctx.db.prepare("SELECT COUNT(*) as c FROM chronicle_seeds WHERE district_id IS NOT NULL AND district_id != ''").get() as { c: number }
      ).c;
    } catch { /* chronicle_seeds may be empty */ }
    details['chronicles'] = { total: totalChronicles, harmonized: harmonizedChronicles };

    const harmonizationPct = totalChronicles > 0
      ? Math.round((harmonizedChronicles / totalChronicles) * 100)
      : 0;

    if (totalChronicles > 0 && harmonizationPct < 10) {
      return warn(
        `district_id coverage low: ${harmonizedChronicles}/${totalChronicles} (${harmonizationPct}%) — run harmonize-rkg`,
        details,
      );
    }

    // 5. chronicle_fts virtual table must exist
    try {
      const fts = (
        ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chronicle_fts'").all() as { name: string }[]
      );
      if (fts.length === 0) {
        return warn('chronicle_fts virtual table not found — FTS search unavailable', details);
      }
      details['chronicleFts'] = 'PRESENT';
    } catch { /* best-effort */ }

    // 6. triplets_fts must also be present (existing check)
    try {
      ctx.db.prepare("SELECT * FROM triplets_fts LIMIT 1").all();
      details['tripletsFts'] = 'PRESENT';
    } catch {
      return warn('triplets_fts not available', details);
    }

    return pass(
      `${districtCount} districts | ${harmonizedChronicles}/${totalChronicles} chronicles harmonized (${harmonizationPct}%)`,
      details,
    );
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('UN1V3R54L-C0D3X manifest: running harmonization engine');
    // Step 1: Run harmonizer
    await ctx.cli.execute('npx tsx scripts/harmonize-rkg.ts').catch(e => {
      ctx.logger.error('UN1V3R54L-C0D3X manifest: harmonize-rkg failed', e.message);
    });
    // Step 2: Rebuild palace vault
    await ctx.cli.execute('bash scripts/reconstruct-palace.sh').catch(e => {
      ctx.logger.error('UN1V3R54L-C0D3X manifest: reconstruct-palace failed', e.message);
    });
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    // Re-run harmonizer on drift (e.g., new chronicles ingested without district_id)
    await ctx.cli.execute('npx tsx scripts/harmonize-rkg.ts').catch(() => { /* silent */ });
  },
};
