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

function buildDistrictKeywords(dna: DistrictDNA): string[] {
  const words = new Set<string>();
  words.add(dna.district_name.toLowerCase());

  // Add each word from district_name (e.g. "Watson" from "Watson Industrial Zone")
  for (const w of dna.district_name.toLowerCase().split(/[\s_-]+/)) {
    if (w.length > 3) words.add(w);
  }

  try {
    const fragments: string[] = JSON.parse(dna.lore_fragments_json);
    for (const frag of fragments) {
      for (const word of frag.toLowerCase().split(/\W+/)) {
        if (word.length > 4) words.add(word);
      }
    }
  } catch { /* lore_fragments_json may be malformed */ }

  return [...words];
}

function scoreChronicleAgainstDistrict(chronicle: Chronicle, keywords: string[]): number {
  const haystack = `${chronicle.title} ${chronicle.content}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) score++;
  }
  return score;
}

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

  // Build keyword sets per district
  const districtKeywords: Array<{ dna: DistrictDNA; keywords: string[] }> = districtDNA.map(dna => ({
    dna,
    keywords: buildDistrictKeywords(dna),
  }));

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

      for (const { dna, keywords } of districtKeywords) {
        const score = scoreChronicleAgainstDistrict(chronicle, keywords);
        if (score > bestScore) {
          bestScore = score;
          bestDistrict = dna;
        }
      }

      if (bestDistrict && bestScore > 0) {
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
          console.log(`  [assign] "${chronicle.title.slice(0, 50)}" → ${bestDistrict.district_name} (score=${bestScore})`);
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
      for (const { dna, keywords } of districtKeywords) {
        const s = scoreChronicleAgainstDistrict(chronicle, keywords);
        if (s > bestScore) { bestScore = s; bestDistrict = dna; }
      }
      if (bestDistrict && bestScore > 0) {
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
          const s = keywords.filter(kw => text.includes(kw)).length;
          if (s > bestScore) { bestScore = s; bestDistrict = dna; }
        }
        if (bestDistrict && bestScore > 0) {
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
