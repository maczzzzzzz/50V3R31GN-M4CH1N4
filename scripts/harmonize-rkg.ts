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

// Source → provenance tag mapping
const SOURCE_PROVENANCE: Record<string, string> = {
  MIRAHEZE:    'provenance/miraheze',
  'Z-TEAM':    'provenance/z-team',
  'WORLD-ANVIL': 'provenance/world-anvil',
  AKASHIK_DB:  'provenance/akashik',
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
 * e.g. "Little China Market" → ["little china", "china market"]
 * Phrases shorter than 7 characters are skipped to avoid noise.
 */
function extractBigrams(text: string): string[] {
  const tokens = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = `${tokens[i]!} ${tokens[i + 1]!}`;
    if (phrase.length >= 7) bigrams.push(phrase);
  }
  return bigrams;
}

function buildDistrictKeywords(dna: DistrictDNA): string[] {
  const words = new Set<string>();
  words.add(dna.district_name.toLowerCase());

  // Add each word from district_name (e.g. "Watson" from "Watson Industrial Zone")
  for (const w of dna.district_name.toLowerCase().split(/[\s_-]+/)) {
    if (w.length > 3) words.add(w);
  }
  // District name bigrams (e.g. "little china", "night city")
  for (const bg of extractBigrams(dna.district_name)) {
    words.add(bg);
  }

  try {
    const fragments: string[] = JSON.parse(dna.lore_fragments_json);
    for (const frag of fragments) {
      for (const word of frag.toLowerCase().split(/\W+/)) {
        if (word.length > 4) words.add(word);
      }
      // Sub-zone phrase matching: add bigrams from each lore fragment so that
      // compound place-names like "Little China", "Jig-Jig Street", "North Oak"
      // score as high-specificity phrases rather than ambiguous single tokens.
      for (const bg of extractBigrams(frag)) {
        words.add(bg);
      }
    }
  } catch { /* lore_fragments_json may be malformed */ }

  return [...words];
}

// ── Phase 49: TF-IDF Semantic Scoring ──────────────────────────────────────────
//
// Replaces the raw keyword overlap count with TF-IDF weighting:
//   IDF(kw) = log(1 + N / (1 + df(kw)))
//     where N = number of districts, df = number of districts containing kw.
//   TF(kw, doc) = occurrences(kw) / total_words_in_doc
//   score(doc, district) = Σ TF(kw) * IDF(kw) for kw in district_keywords
//
// Keywords shared across many districts (generic Night City terms) receive low IDF
// weight; district-unique identifiers (e.g. "heywood", "pacifica") score high.
// This eliminates false positives for overlapping districts like Watson/Northside.

/**
 * Build an IDF map across all district keyword sets.
 * Call once after all district keyword sets are known, before scoring.
 */
function buildIdfMap(districtKeywordSets: string[][]): Map<string, number> {
  const N = districtKeywordSets.length;
  const df = new Map<string, number>();

  for (const keywords of districtKeywordSets) {
    // Use a Set to avoid double-counting a keyword that appears twice in one district's set
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
 * Score a pre-lowercased document string against a district's keyword set using TF-IDF.
 * Returns 0 when no keywords match.
 */
function scoreTfIdf(haystack: string, keywords: string[], idfMap: Map<string, number>): number {
  const totalWords = Math.max(1, haystack.split(/\s+/).length);
  let score = 0;

  for (const kw of keywords) {
    const idf = idfMap.get(kw);
    if (!idf) continue;

    // Count all substring occurrences of the keyword in the haystack
    let occurrences = 0;
    let pos = 0;
    while ((pos = haystack.indexOf(kw, pos)) !== -1) {
      occurrences++;
      pos += kw.length;
    }

    if (occurrences > 0) {
      score += (occurrences / totalWords) * idf;
    }
  }

  return score;
}

// Minimum TF-IDF score to accept an assignment (filters out accidental single-word weak matches)
const TF_IDF_MIN_SCORE = 1e-6;

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  console.log(`\n◈ PHASE 47: UN1V3R54L-C0D3X HARMONIZATION ENGINE${DRY_RUN ? ' [DRY RUN]' : ''}\n`);
  const t0 = Date.now();

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  // ── Brownfield migration: ensure district_id columns exist ─────────────────
  const tablesNeeding = ['npcs', 'factions', 'locations', 'triplets', 'chronicle_seeds'];
  for (const table of tablesNeeding) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
      if (cols.length > 0 && !cols.some(c => c.name === 'district_id')) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN district_id TEXT`);
        console.log(`  [migrate] Added district_id to ${table}`);
      }
    } catch { /* table may not exist in this db */ }
  }

  // ── Ensure chronicle_fts exists ────────────────────────────────────────────
  try {
    const vtables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chronicle_fts'").all();
    if (vtables.length === 0) {
      db.exec(`
        CREATE VIRTUAL TABLE chronicle_fts USING fts5(
          title, content, category, district_id,
          content=chronicle_seeds
        );
        INSERT INTO chronicle_fts(rowid, title, content, category, district_id)
        SELECT rowid, title, content, category, district_id FROM chronicle_seeds;
      `);
      console.log('  [fts] Built chronicle_fts virtual table');
    }
  } catch (e) { console.warn('  [fts] chronicle_fts setup skipped:', (e as Error).message); }

  // ── Load district DNA ──────────────────────────────────────────────────────
  let districtDNA: DistrictDNA[] = [];
  try {
    districtDNA = db.prepare('SELECT id, district_name, lore_fragments_json FROM district_dna').all() as DistrictDNA[];
  } catch { /* district_dna may not exist — harmless */ }

  console.log(`  [districts] ${districtDNA.length} district_dna entries loaded`);

  if (districtDNA.length === 0) {
    console.warn('  [districts] No district_dna found — nothing to harmonize. Exiting.');
    db.close();
    return;
  }

  // Build keyword sets per district, then compute IDF across the full corpus
  const districtKeywords: Array<{ dna: DistrictDNA; keywords: string[] }> = districtDNA.map(dna => ({
    dna,
    keywords: buildDistrictKeywords(dna),
  }));

  const idfMap = buildIdfMap(districtKeywords.map(d => d.keywords));
  if (VERBOSE) {
    console.log(`  [tfidf] IDF map built: ${idfMap.size} unique terms across ${districtDNA.length} districts`);
  }

  // ── Load chronicles ────────────────────────────────────────────────────────
  let chronicles: Chronicle[] = [];
  try {
    chronicles = db.prepare('SELECT id, title, content, category, source, district_id FROM chronicle_seeds').all() as Chronicle[];
  } catch { /* chronicle_seeds may not exist */ }

  console.log(`  [chronicles] ${chronicles.length} chronicles loaded`);

  // ── Scoring & assignment ───────────────────────────────────────────────────
  const updateStmt = DRY_RUN
    ? null
    : db.prepare('UPDATE chronicle_seeds SET district_id = ? WHERE id = ?');
  const insertTripletStmt = DRY_RUN
    ? null
    : db.prepare(
        'INSERT OR IGNORE INTO triplets (subject_id, predicate, object_literal, district_id) VALUES (?, ?, ?, ?)'
      );
  const insertWingStmt = DRY_RUN
    ? null
    : db.prepare(`
        INSERT INTO palace_wings (id, name, wing_type, description)
        VALUES (?, ?, 'DISTRICT', ?)
        ON CONFLICT(name) DO NOTHING
      `).bind;

  let assigned = 0;
  let alreadySet = 0;
  let unmatched = 0;
  const districtCounts: Record<string, number> = {};

  const harmonize = db.transaction(() => {
    for (const chronicle of chronicles) {
      if (chronicle.district_id) {
        alreadySet++;
        continue;
      }

      let bestDistrict: DistrictDNA | null = null;
      let bestScore = 0;

      const haystack = `${chronicle.title} ${chronicle.content}`.toLowerCase();
      for (const { dna, keywords } of districtKeywords) {
        const score = scoreTfIdf(haystack, keywords, idfMap);
        if (score > bestScore) {
          bestScore = score;
          bestDistrict = dna;
        }
      }

      if (bestDistrict && bestScore > TF_IDF_MIN_SCORE) {
        updateStmt?.run(bestDistrict.district_name, chronicle.id);
        // Create RKG triplet link
        insertTripletStmt?.run(
          chronicle.title,
          'district',
          bestDistrict.district_name,
          bestDistrict.district_name,
        );
        districtCounts[bestDistrict.district_name] = (districtCounts[bestDistrict.district_name] ?? 0) + 1;
        assigned++;
        if (VERBOSE) {
          console.log(`  [assign] "${chronicle.title.slice(0, 50)}" → ${bestDistrict.district_name} (tfidf=${bestScore.toFixed(6)})`);
        }
      } else {
        unmatched++;
      }
    }

    // ── Seed palace_wings for each district ──────────────────────────────────
    for (const { dna } of districtKeywords) {
      try {
        const id = randomUUID();
        db.prepare(`
          INSERT INTO palace_wings (id, name, wing_type, description)
          VALUES (?, ?, 'DISTRICT', ?)
          ON CONFLICT(name) DO NOTHING
        `).run(id, dna.district_name, `District wing: ${dna.district_name}`);
      } catch { /* palace_wings may not exist in Akashik.db */ }
    }

    // ── Rebuild chronicle_fts after batch UPDATE ──────────────────────────────
    try {
      db.exec("INSERT INTO chronicle_fts(chronicle_fts) VALUES('rebuild')");
    } catch { /* FTS rebuild is best-effort */ }
  });

  if (DRY_RUN) {
    // Run scoring but don't commit
    let dryAssigned = 0;
    for (const chronicle of chronicles) {
      if (chronicle.district_id) { alreadySet++; continue; }
      let bestScore = 0;
      let bestDistrict: DistrictDNA | null = null;
      const haystack = `${chronicle.title} ${chronicle.content}`.toLowerCase();
      for (const { dna, keywords } of districtKeywords) {
        const s = scoreTfIdf(haystack, keywords, idfMap);
        if (s > bestScore) { bestScore = s; bestDistrict = dna; }
      }
      if (bestDistrict && bestScore > TF_IDF_MIN_SCORE) {
        dryAssigned++;
        districtCounts[bestDistrict.district_name] = (districtCounts[bestDistrict.district_name] ?? 0) + 1;
      } else {
        unmatched++;
      }
    }
    assigned = dryAssigned;
  } else {
    harmonize();
  }

  // ── Also create triplets for npcs, factions, locations with matching district ─
  if (!DRY_RUN) {
    try {
      // For npcs with faction field matching a known faction that has district_id
      const npcUpdate = db.prepare(`
        UPDATE npcs SET district_id = (
          SELECT f.district_id FROM factions f WHERE f.name = npcs.faction AND f.district_id IS NOT NULL
        )
        WHERE district_id IS NULL AND faction IS NOT NULL
      `);
      const npcResult = npcUpdate.run();
      if (npcResult.changes > 0) {
        console.log(`  [npcs] Propagated district_id to ${npcResult.changes} NPCs via faction`);
      }
    } catch { /* best-effort */ }

    try {
      // Locations: match name/owner_faction against district keywords
      const locations = db.prepare("SELECT id, name, owner_faction FROM locations WHERE district_id IS NULL").all() as
        { id: string; name: string; owner_faction: string | null }[];
      const locStmt = db.prepare('UPDATE locations SET district_id = ? WHERE id = ?');
      let locAssigned = 0;
      for (const loc of locations) {
        const text = `${loc.name} ${loc.owner_faction ?? ''}`.toLowerCase();
        let bestScore = 0;
        let bestDistrict: DistrictDNA | null = null;
        for (const { dna, keywords } of districtKeywords) {
          const s = scoreTfIdf(text, keywords, idfMap);
          if (s > bestScore) { bestScore = s; bestDistrict = dna; }
        }
        if (bestDistrict && bestScore > TF_IDF_MIN_SCORE) {
          locStmt.run(bestDistrict.district_name, loc.id);
          locAssigned++;
        }
      }
      if (locAssigned > 0) console.log(`  [locations] Assigned district_id to ${locAssigned} locations`);
    } catch { /* best-effort */ }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const elapsed = Date.now() - t0;
  console.log('\n' + '─'.repeat(60));
  console.log(`◈ HARMONIZATION COMPLETE (${elapsed}ms)`);
  console.log(`  Previously assigned : ${alreadySet}`);
  console.log(`  Newly assigned      : ${assigned}`);
  console.log(`  Unmatched           : ${unmatched}`);
  console.log('');
  console.log('  District distribution:');
  for (const [dist, count] of Object.entries(districtCounts).sort(([, a], [, b]) => b - a)) {
    console.log(`    ${dist.padEnd(30)} ${count}`);
  }
  console.log('─'.repeat(60) + '\n');

  db.close();
}

main();
