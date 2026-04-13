/**
 * scripts/forge/ingest-local-assets.ts
 *
 * Phase 55.0.1: Sovereign Asset Forge — Sovereign Asset Indexing
 *
 * Scans ./assets/ subdirectories for existing high-quality PNGs/WebPs,
 * indexes them in Akashik.db (assets table), copies to data/assets/anchors/
 * with ST3GG metadata (Name, Faction, Weight) embedded where possible,
 * and designates them as "Aesthetic Anchors" for AI style alignment.
 *
 * Usage: npm run forge:ingest
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SteganographyService } from '../../src/core/steganography-service.js';
import 'dotenv/config';

const ASSETS_ROOT = './assets';
const ANCHORS_DIR = './data/assets/anchors';
const AKASHIK_DB  = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

// Subfolder → canonical faction tag
const FACTION_MAP: Record<string, string> = {
  civs:        'Civilian',
  corp:        'Corporate',
  corp2:       'Corporate',
  cyberpsycho: 'Cyberpsycho',
  medtech:     'MedTech',
  militant:    'Militant',
  misc:        'Misc',
  orient:      'Orient',
  police:      'NCPD',
  police2:     'NCPD',
  vehicles:    'Vehicle',
};

function ensureSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id          TEXT PRIMARY KEY,
      file_name   TEXT NOT NULL,
      file_path   TEXT NOT NULL,
      faction     TEXT,
      weight      REAL DEFAULT 1.0,
      anchor      INTEGER DEFAULT 0,
      st3gg_path  TEXT,
      indexed_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function ingestLocalAssets(): Promise<{ indexed: number; skipped: number }> {
  await fs.mkdir(ANCHORS_DIR, { recursive: true });

  const db = new Database(AKASHIK_DB);
  ensureSchema(db);

  const st3gg = new SteganographyService();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, weight, anchor, st3gg_path)
    VALUES (?, ?, ?, ?, 1.0, 1, ?)
  `);

  let indexed = 0;
  let skipped = 0;

  let subdirs: string[];
  try {
    subdirs = await fs.readdir(ASSETS_ROOT);
  } catch {
    console.warn(`[Ingest] Assets root not found: ${ASSETS_ROOT}`);
    db.close();
    return { indexed, skipped };
  }

  for (const subdir of subdirs) {
    const dirPath = path.join(ASSETS_ROOT, subdir);
    const stat = await fs.stat(dirPath).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const faction = FACTION_MAP[subdir] ?? subdir;
    let files: string[];
    try {
      files = await fs.readdir(dirPath);
    } catch {
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.png') && !file.endsWith('.webp')) continue;

      const srcPath  = path.join(dirPath, file);
      const baseName = path.basename(file, path.extname(file));
      const assetId  = `anchor-${slugify(subdir)}-${slugify(baseName)}`;
      const outName  = `${assetId}${path.extname(file)}`;
      const outPath  = path.join(ANCHORS_DIR, outName);

      const metadata = JSON.stringify({ name: baseName, faction, weight: 1.0, anchor: true });

      try {
        if (file.endsWith('.png')) {
          await st3gg.encodeSecret(srcPath, outPath, metadata);
        } else {
          // WebP: copy as-is (ST3GG LSB requires PNG)
          await fs.copyFile(srcPath, outPath);
        }
        insert.run(assetId, file, outPath, faction, outPath);
        indexed++;
      } catch (err) {
        console.warn(`[Ingest] Skipped ${file}: ${(err as Error).message}`);
        skipped++;
      }
    }
  }

  db.close();
  console.log(`[Ingest] Complete — ${indexed} anchors indexed, ${skipped} skipped`);
  return { indexed, skipped };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  ingestLocalAssets().catch(err => { console.error('[Ingest] Fatal:', err); process.exit(1); });
}
