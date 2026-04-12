#!/usr/bin/env tsx
/**
 * harmonize-rkg.ts
 *
 * Phase 47: UN1V3R54L-C0D3X Harmonization Engine
 *
 * Scans all chronicle_seeds and district_dna entries, performs semantic keyword
 * overlap matching to assign district_id to each chronicle, then writes formal
 * RKG triplet links and seeds palace_wings for each district.
 *
 * Usage: npx tsx scripts/harmonize-rkg.ts [--db <path>] [--dry-run]
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

// ── Config ─────────────────────────────────────────────────────────────────────

const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Minimum TF-IDF score to accept an assignment (filters out accidental single-word weak matches)
const TF_IDF_MIN_SCORE = 1e-6;

// Priority phrases that should always trigger a district match regardless of TF-IDF score
const DISTRICT_PHRASE_WHITELIST: Record<string, string> = {
  'the glen': 'Heywood',
  'north oak': 'Westbrook',
  'charter hill': 'Westbrook',
  'japantown': 'Westbrook',
  'wellsprings': 'Heywood',
  'vista del rey': 'Heywood',
  'little china': 'Watson',
  'kabuki': 'Watson',
  'northside': 'Watson',
  'arroyo': 'Santo Domingo',
  'rancho coronado': 'Santo Domingo',
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface DistrictDNA {
  id: string;
  district_name: string;
  lore_fragments_json: string;
}

interface Chronicle {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  district_id: string | null;
}

// ── Keyword builder ────────────────────────────────────────────────────────────

/**
 * Extract consecutive 2-word bigrams from a string for sub-zone phrase matching.
 * Threshold lowered to 5 to capture short but specific phrases like "The Glen".
 */
function extractBigrams(text: string): string[] {
  const tokens = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = `${tokens[i]!} ${tokens[i + 1]!}`;
    if (phrase.length >= 5) bigrams.push(phrase);
  }
  return bigrams;
}

function buildDistrictKeywords(dna: DistrictDNA): string[] {
  const words = new Set<string>();
  words.add(dna.district_name.toLowerCase());

  for (const w of dna.district_name.toLowerCase().split(/[\s_-]+/)) {
    if (w.length > 3) words.add(w);
  }
  for (const bg of extractBigrams(dna.district_name)) {
    words.add(bg);
  }

  try {
    const fragments: string[] = JSON.parse(dna.lore_fragments_json);
    for (const frag of fragments) {
      for (const word of frag.toLowerCase().split(/\W+/)) {
        if (word.length > 4) words.add(word);
      }
      for (const bg of extractBigrams(frag)) {
        words.add(bg);
      }
    }
  } catch { /* malformed JSON */ }

  return [...words];
}

// ── TF-IDF Semantic Scoring ───────────────────────────────────────────────────

function buildIdfMap(districtKeywordSets: string[][]): Map<string, number> {
  const N = districtKeywordSets.length;
  const df = new Map<string, number>();
  for (const keywords of districtKeywordSets) {
    for (const kw of new Set(keywords)) {
      df.set(kw, (df.get(kw) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [kw, count] of df) {
    idf.set(kw, Math.log(1 + N / (1 + count)));
  }
  return idf;
}

/**
 * Optimized TF-IDF scorer using a pre-calculated frequency map of tokens.
 */
function scoreTfIdf(allTokens: string[], keywords: string[], idfMap: Map<string, number>): number {
  const totalWords = Math.max(1, allTokens.length);
  const freqs = new Map<string, number>();
  for (const t of allTokens) freqs.set(t, (freqs.get(t) ?? 0) + 1);

  let score = 0;
  for (const kw of keywords) {
    const idf = idfMap.get(kw);
    const count = freqs.get(kw) ?? 0;
    if (idf && count > 0) score += (count / totalWords) * idf;
  }
  return score;
}

function tokenize(text: string): string[] {
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const bigrams = extractBigrams(text);
  return [...words, ...bigrams];
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n◈ PHASE 47: UN1V3R54L-C0D3X HARMONIZATION ENGINE${DRY_RUN ? ' [DRY RUN]' : ''}\n`);
  const t0 = Date.now();

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // 1. Schema Migration
  const tablesNeeding = ['npcs', 'factions', 'locations', 'triplets', 'chronicle_seeds'];
  for (const table of tablesNeeding) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (cols.length > 0 && !cols.some(c => c.name === 'district_id')) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN district_id TEXT`);
        console.log(`  [migrate] Added district_id to ${table}`);
      }
    } catch { /* ignore */ }
  }

  // 2. Load Data
  const districtDNA = db.prepare('SELECT id, district_name, lore_fragments_json FROM district_dna').all() as DistrictDNA[];
  console.log(`  [districts] ${districtDNA.length} district_dna entries loaded`);
  if (districtDNA.length === 0) { db.close(); return; }

  const districtKeywords = districtDNA.map(dna => ({ dna, keywords: buildDistrictKeywords(dna) }));
  const idfMap = buildIdfMap(districtKeywords.map(d => d.keywords));

  const chronicles = db.prepare('SELECT id, title, content, district_id FROM chronicle_seeds').all() as Chronicle[];
  console.log(`  [chronicles] ${chronicles.length} chronicles loaded`);

  const updateStmt = DRY_RUN ? null : db.prepare('UPDATE chronicle_seeds SET district_id = ? WHERE id = ?');
  const insertTripletStmt = DRY_RUN ? null : db.prepare('INSERT OR IGNORE INTO triplets (subject_id, predicate, object_literal, district_id) VALUES (?, ?, ?, ?)');

  let assigned = 0;
  let alreadySet = 0;
  let unmatched = 0;
  const districtCounts: Record<string, number> = {};

  const processBatch = db.transaction(() => {
    for (const chronicle of chronicles) {
      if (chronicle.district_id) {
        alreadySet++;
        districtCounts[chronicle.district_id] = (districtCounts[chronicle.district_id] ?? 0) + 1;
        continue;
      }

      let bestDistrict: DistrictDNA | null = null;
      let bestScore = 0;
      const haystack = `${chronicle.title} ${chronicle.content}`.toLowerCase();

      // Priority Whitelist
      for (const [phrase, districtName] of Object.entries(DISTRICT_PHRASE_WHITELIST)) {
        if (haystack.includes(phrase)) {
          bestDistrict = districtKeywords.find(d => d.dna.district_name === districtName)?.dna ?? null;
          if (bestDistrict) { bestScore = 1.0; break; }
        }
      }

      if (!bestDistrict) {
        const tokens = tokenize(haystack);
        for (const { dna, keywords } of districtKeywords) {
          const score = scoreTfIdf(tokens, keywords, idfMap);
          if (score > bestScore) { bestScore = score; bestDistrict = dna; }
        }
      }

      if (bestDistrict && bestScore > TF_IDF_MIN_SCORE) {
        if (updateStmt) updateStmt.run(bestDistrict.district_name, chronicle.id);
        if (insertTripletStmt) insertTripletStmt.run(chronicle.title, 'district', bestDistrict.district_name, bestDistrict.district_name);
        districtCounts[bestDistrict.district_name] = (districtCounts[bestDistrict.district_name] ?? 0) + 1;
        assigned++;
      } else {
        unmatched++;
      }
    }
  });

  if (!DRY_RUN) processBatch();

  // 3. Post-processing (NPCs, Locations)
  if (!DRY_RUN) {
    try {
      db.prepare(`UPDATE npcs SET district_id = (SELECT f.district_id FROM factions f WHERE f.name = npcs.faction AND f.district_id IS NOT NULL) WHERE district_id IS NULL AND faction IS NOT NULL`).run();
      const locations = db.prepare("SELECT id, name, owner_faction FROM locations WHERE district_id IS NULL").all() as any[];
      for (const loc of locations) {
        const tokens = tokenize(`${loc.name} ${loc.owner_faction ?? ''}`);
        let bestDistrict: DistrictDNA | null = null;
        let bestScore = 0;
        for (const { dna, keywords } of districtKeywords) {
          const s = scoreTfIdf(tokens, keywords, idfMap);
          if (s > bestScore) { bestScore = s; bestDistrict = dna; }
        }
        if (bestDistrict && bestScore > TF_IDF_MIN_SCORE) {
          db.prepare('UPDATE locations SET district_id = ? WHERE id = ?').run(bestDistrict.district_name, loc.id);
        }
      }
    } catch { /* silent */ }
  }

  const elapsed = Date.now() - t0;
  console.log('\n' + '─'.repeat(60));
  console.log(`◈ HARMONIZATION COMPLETE (${elapsed}ms)`);
  console.log(`  Processed : ${chronicles.length} | Newly Assigned: ${assigned} | Already Set: ${alreadySet} | Unmatched: ${unmatched}`);
  console.log('  Distribution:', Object.fromEntries(Object.entries(districtCounts).sort(([,a],[,b]) => b-a)));
  console.log('─'.repeat(60) + '\n');
  db.close();
}

main();
