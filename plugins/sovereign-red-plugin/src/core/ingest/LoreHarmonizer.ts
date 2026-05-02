/**
 * src/core/ingest/LoreHarmonizer.ts
 * Phase 65: Delta Harmonization — selective lore merge from PDF shards.
 *
 * Truth Hierarchy (from research doc):
 *   TIER 1 (Official Repo) — canonical stats, DVs, mechanical rules — DO NOT overwrite
 *   TIER 2 (PDF VLM)       — flavor text, lore, DLC narrative rules — promote here
 *   TIER 3 (Community)     — homebrew — lowest priority, never overwrites T1/T2
 *
 * Algorithm:
 *   1. Load PDF shard JSON from data/ingest/pdf_shards/.
 *   2. Classify each shard: LORE | MECHANICAL | REFERENCE.
 *   3. Cross-reference MECHANICAL shards against Akashik.db canonical tables.
 *   4. Insert only LORE shards (and unmatched MECHANICAL) as triplets in the DB.
 *   5. Log all collisions for human review.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Shard types (mirrors docling-worker.py output)
// ---------------------------------------------------------------------------

interface PdfShard {
  shard_id: string;
  heading: string;
  content: string;
  word_count: number;
  page_hint: number | null;
}

interface ShardManifest {
  source: string;
  source_path: string;
  tier: string;
  shard_count: number;
  shards: PdfShard[];
}

// ---------------------------------------------------------------------------
// Shard classification
// ---------------------------------------------------------------------------

/** Heuristic patterns that indicate Tier 1 mechanical content — do not promote. */
const MECHANICAL_PATTERNS = [
  /\b(DV|difficulty value|base damage|armor penetration|ROF|rate of fire|clip size|reliability)\b/i,
  /\b(STAT|REF|DEX|TECH|COOL|WILL|LUCK|MOVE|BODY|EMP)\s*[:=]\s*\d+/i,
  /\b(\d+d\d+|\dd10)\b/,
  /\b(HP|SP|Humanity)\s*[:=]\s*\d+/i,
  /^\s*\|.*\|.*\|\s*$/m,  // Table rows — likely stats tables
];

/** Patterns that strongly indicate flavor/lore content — promote. */
const LORE_PATTERNS = [
  /\b(Night City|Arasaka|Militech|Trauma Team|MaxTac|NetWatch|Maelstrom|Valentinos|Voodoo Boys)\b/i,
  /\b(fixers?|solos?|netrunners?|techies?|nomads?|rockerboys?|medias?)\b/i,
  /\b(cyberpunk|chrome|street|corp|gang|district|barrio|zona)\b/i,
  /\b(lore|history|background|flavor|narrative|culture|slang)\b/i,
];

type ShardClassification = 'LORE' | 'MECHANICAL' | 'REFERENCE';

function classifyShard(shard: PdfShard): ShardClassification {
  const text = `${shard.heading} ${shard.content}`;

  const mechanicalScore = MECHANICAL_PATTERNS.filter(p => p.test(text)).length;
  const loreScore = LORE_PATTERNS.filter(p => p.test(text)).length;

  if (mechanicalScore >= 2) return 'MECHANICAL';
  if (loreScore >= 1) return 'LORE';
  return 'REFERENCE'; // Neutral — tables of contents, indexes, etc.
}

// ---------------------------------------------------------------------------
// Cross-reference against Tier 1 canonical data
// ---------------------------------------------------------------------------

/**
 * Check if a shard's heading matches an existing canonical entry in Akashik.db.
 * Canonical entries are those with source = 'FOUNDRY' or source = 'CANONICAL'.
 * Returns true if a collision is detected (shard should be skipped or demoted).
 */
function isCanonicalCollision(db: Database.Database, shard: PdfShard): boolean {
  const keyword = shard.heading.trim().toLowerCase();
  if (keyword.length < 3) return false;

  // Check items
  const item = db.prepare(
    "SELECT id FROM items WHERE lower(name) = ? AND source IN ('FOUNDRY', 'CANONICAL') LIMIT 1"
  ).get(keyword);
  if (item) return true;

  // Check NPCs
  const npc = db.prepare(
    "SELECT id FROM npcs WHERE lower(name) = ? LIMIT 1"
  ).get(keyword);
  if (npc) return true;

  // Check DV tables (weapons)
  const dv = db.prepare(
    "SELECT weapon_category FROM dv_tables WHERE lower(weapon_category) = ? LIMIT 1"
  ).get(keyword);
  if (dv) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Harmonizer result
// ---------------------------------------------------------------------------

export interface HarmonizationResult {
  source: string;
  promoted: number;
  skipped_mechanical: number;
  skipped_collision: number;
  skipped_reference: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// LoreHarmonizer
// ---------------------------------------------------------------------------

export class LoreHarmonizer {
  private readonly db: Database.Database;
  private readonly shardDir: string;

  constructor(db: Database.Database, shardDir?: string) {
    this.db = db;
    this.shardDir = shardDir ?? path.join(process.cwd(), 'data', 'ingest', 'pdf_shards');
  }

  /**
   * Process all shard manifests in the shard directory.
   * Returns aggregated harmonization results.
   */
  async harmonizeAll(): Promise<HarmonizationResult[]> {
    const entries = await fs.readdir(this.shardDir).catch(() => [] as string[]);
    const manifests = entries.filter(e => e.endsWith('.json'));
    const results: HarmonizationResult[] = [];

    for (const file of manifests) {
      const manifestPath = path.join(this.shardDir, file);
      try {
        const raw = await fs.readFile(manifestPath, 'utf-8');
        const manifest: ShardManifest = JSON.parse(raw);
        const result = await this.harmonizeManifest(manifest);
        results.push(result);
      } catch (e) {
        console.error(`[LoreHarmonizer] Failed to process ${file}: ${(e as Error).message}`);
      }
    }

    return results;
  }

  /**
   * Harmonize a single PDF shard manifest against Akashik.db.
   * Inserts only Tier 2 lore triplets — never overwrites Tier 1 canonical data.
   */
  async harmonizeManifest(manifest: ShardManifest): Promise<HarmonizationResult> {
    const result: HarmonizationResult = {
      source: manifest.source,
      promoted: 0,
      skipped_mechanical: 0,
      skipped_collision: 0,
      skipped_reference: 0,
      errors: 0,
    };

    const insertTriplet = this.db.prepare(`
      INSERT OR IGNORE INTO triplets
        (subject_id, predicate, object_literal, district_id)
      VALUES (@subject_id, @predicate, @object_literal, @district_id)
    `);

    const doInsert = this.db.transaction((shards: PdfShard[]) => {
      for (const shard of shards) {
        const classification = classifyShard(shard);

        // Tier 1 collision check — skip mechanical content that matches canonical entries
        if (classification === 'MECHANICAL') {
          if (isCanonicalCollision(this.db, shard)) {
            result.skipped_collision++;
          } else {
            // Unmatched mechanical — demote to REFERENCE, still skip (mechanical purity)
            result.skipped_mechanical++;
          }
          continue;
        }

        if (classification === 'REFERENCE') {
          result.skipped_reference++;
          continue;
        }

        // LORE — promote as Tier 2 triplet
        try {
          const subjectId = this.deriveLoreSubject(shard);
          const contentHash = createHash('sha256')
            .update(`${manifest.source}::${shard.shard_id}`)
            .digest('hex')
            .slice(0, 16);

          insertTriplet.run({
            subject_id: subjectId,
            predicate: 'lore_fragment',
            object_literal: `[TIER2:PDF] ${shard.heading}: ${shard.content.slice(0, 2000)}`,
            district_id: this.extractDistrict(shard.content) ?? null,
          });

          result.promoted++;
        } catch (e) {
          console.error(`[LoreHarmonizer] Insert error: ${(e as Error).message}`);
          result.errors++;
        }
      }
    });

    doInsert(manifest.shards);

    console.log(
      `::/LORE-DELTA ${manifest.source}: promoted=${result.promoted} ` +
      `mech_skip=${result.skipped_mechanical} collision=${result.skipped_collision} ` +
      `ref_skip=${result.skipped_reference} errors=${result.errors}`
    );

    return result;
  }

  /**
   * Derive a stable subject_id for a lore shard.
   * Uses the normalized heading as the subject — avoids UUIDs for dedup.
   */
  private deriveLoreSubject(shard: PdfShard): string {
    const normalized = shard.heading
      .toLowerCase()
      .replace(/[^a-z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 64);
    return `lore::${normalized}`;
  }

  /**
   * Heuristically extract a Night City district name from content.
   * Returns the district ID string if found, null otherwise.
   */
  private extractDistrict(content: string): string | null {
    const DISTRICTS: [RegExp, string][] = [
      [/\bwatson\b/i, 'Watson'],
      [/\bwestbrook\b/i, 'Westbrook'],
      [/\bheywood\b/i, 'Heywood'],
      [/\bpacifica\b/i, 'Pacifica'],
      [/\bsanto domingo\b/i, 'Santo Domingo'],
      [/\bcity center\b/i, 'City Center'],
      [/\bbadlands\b/i, 'Badlands'],
      [/\bnorthside\b|\bnorthside industrial\b/i, 'Northside'],
    ];

    for (const [pattern, district] of DISTRICTS) {
      if (pattern.test(content)) return district;
    }
    return null;
  }
}
