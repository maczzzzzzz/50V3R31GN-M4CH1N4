/**
 * scripts/forge/ingest-local-assets.ts
 *
 * Phase 55.0.1: Sovereign Asset Forge — Sovereign Asset Indexing
 *
 * Scans multiple sources for existing high-quality assets, maps, and tokens,
 * indexes them in Akashik.db (assets table), and designates anchors for AI style alignment.
 *
 * Sources:
 * - ./assets/ (Vehicles, NCPD, MedTech, etc.)
 * - ./docs/raw_data/campaign_ttta/Maps/ (Original TTTA Maps)
 * - ./docs/raw_data/entities_mooks/ (Legacy Mook Actor JSONs - parsed for image paths)
 * - ./data/assets/tiles/ (Newly generated district tiles)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SteganographyService } from '../../src/core/steganography-service.js';
import 'dotenv/config';

const ASSETS_ROOT = './assets';
const ANCHORS_DIR = './data/assets/anchors';
const TILES_DIR   = './data/assets/tiles';
const TTTA_MAPS_DIR = './docs/raw_data/campaign_ttta/Maps';
const MOOKS_DIR   = './docs/raw_data/entities_mooks/night city gang corp mook pack - mooks';
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
      category    TEXT,
      weight      REAL DEFAULT 1.0,
      anchor      INTEGER DEFAULT 0,
      legacy_target INTEGER DEFAULT 0,
      st3gg_path  TEXT,
      indexed_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { db.exec(`ALTER TABLE assets ADD COLUMN category TEXT`); } catch {}
  try { db.exec(`ALTER TABLE assets ADD COLUMN legacy_target INTEGER DEFAULT 0`); } catch {}
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function scanTttaMaps(db: Database.Database): Promise<{ indexed: number; skipped: number }> {
  let indexed = 0;
  let skipped = 0;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, category, weight, anchor, legacy_target, st3gg_path)
    VALUES (?, ?, ?, ?, ?, 1.0, 0, 1, ?)
  `);

  async function scanDir(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (/\.(png|webp|jpg|jpeg)$/i.test(entry.name)) {
          const baseName = path.basename(entry.name, path.extname(entry.name));
          const assetId  = `ttta-map-${slugify(baseName)}`;
          const category = entry.name.toLowerCase().includes('token') ? 'token' : 'map';
          insert.run(assetId, entry.name, fullPath, 'TTTA', category, fullPath);
          indexed++;
        }
      }
    } catch {}
  }
  await scanDir(TTTA_MAPS_DIR);
  console.log(`[Ingest] TTTA Maps: ${indexed} indexed`);
  return { indexed, skipped };
}

async function scanGeneratedTiles(db: Database.Database): Promise<{ indexed: number; skipped: number }> {
  let indexed = 0;
  let skipped = 0;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, category, weight, anchor, legacy_target, st3gg_path)
    VALUES (?, ?, ?, ?, 'tile', 1.0, 0, 0, ?)
  `);

  try {
    const files = await fs.readdir(TILES_DIR);
    for (const file of files) {
      if (!/\.(png|webp)$/i.test(file)) continue;
      const fullPath = path.join(TILES_DIR, file);
      const baseName = path.basename(file, path.extname(file));
      const assetId  = `tile-${slugify(baseName)}`;
      const parts    = baseName.split('_');
      const district = parts.length > 1 ? parts[1] : 'Generic';
      insert.run(assetId, file, fullPath, district, fullPath);
      indexed++;
    }
  } catch {}
  console.log(`[Ingest] Generated Tiles: ${indexed} indexed`);
  return { indexed, skipped };
}

async function scanLegacyMooks(db: Database.Database): Promise<{ indexed: number; skipped: number }> {
  let indexed = 0;
  let skipped = 0;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, category, weight, anchor, legacy_target, st3gg_path)
    VALUES (?, ?, ?, ?, 'token', 1.0, 0, 1, ?)
  `);

  async function scanDir(dir: string, faction: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath, faction || entry.name);
        } else if (entry.name.endsWith('.json')) {
          try {
            const raw = await fs.readFile(fullPath, 'utf-8');
            const actor = JSON.parse(raw);
            const imgPath = actor.img || actor.prototypeToken?.texture?.src;
            if (imgPath && /\.(png|webp|jpg|jpeg)$/i.test(imgPath)) {
              const assetId = `legacy-mook-${actor._id || slugify(actor.name)}`;
              insert.run(assetId, path.basename(imgPath), imgPath, faction, imgPath);
              indexed++;
            }
          } catch {}
        }
      }
    } catch {}
  }
  await scanDir(MOOKS_DIR, '');
  console.log(`[Ingest] Legacy Mooks: ${indexed} indexed`);
  return { indexed, skipped };
}

export async function ingestLocalAssets(): Promise<{ indexed: number; skipped: number }> {
  await fs.mkdir(ANCHORS_DIR, { recursive: true });
  const db = new Database(AKASHIK_DB);
  ensureSchema(db);
  const st3gg = new SteganographyService();

  const insert = db.prepare(`
    INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, category, weight, anchor, legacy_target, st3gg_path)
    VALUES (?, ?, ?, ?, ?, 1.0, 1, 0, ?)
  `);

  let indexed = 0;
  let skipped = 0;

  // 1. Process Anchors (./assets)
  try {
    const subdirs = await fs.readdir(ASSETS_ROOT);
    for (const subdir of subdirs) {
      const dirPath = path.join(ASSETS_ROOT, subdir);
      if (!(await fs.stat(dirPath)).isDirectory()) continue;

      const faction = FACTION_MAP[subdir] ?? subdir;
      const category = subdir === 'vehicles' ? 'vehicle' : 'token';
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (!/\.(png|webp)$/i.test(file)) continue;
        const srcPath  = path.join(dirPath, file);
        const baseName = path.basename(file, path.extname(file));
        const assetId  = `anchor-${slugify(subdir)}-${slugify(baseName)}`;
        const outPath  = path.join(ANCHORS_DIR, `${assetId}${path.extname(file)}`);

        try {
          if (file.endsWith('.png')) {
            await st3gg.encodeSecret(srcPath, outPath, JSON.stringify({ name: baseName, faction, category, anchor: true }));
          } else {
            await fs.copyFile(srcPath, outPath);
          }
          insert.run(assetId, file, outPath, faction, category, outPath);
          indexed++;
        } catch (err) {
          console.warn(`[Ingest] Skipped anchor ${file}: ${(err as Error).message}`);
          skipped++;
        }
      }
    }
  } catch {}

  // 2. Process other streams
  const legacyMooks = await scanLegacyMooks(db);
  const tttaMaps    = await scanTttaMaps(db);
  const genTiles    = await scanGeneratedTiles(db);

  const totalIndexed = indexed + legacyMooks.indexed + tttaMaps.indexed + genTiles.indexed;

  // Fallback: If no anchors were designated (empty ./assets), promote the first available asset
  if (indexed === 0 && totalIndexed > 0) {
    console.log('[Ingest] Fallback: No primary anchors found. Promoting first mook to anchor.');
    db.exec(`UPDATE assets SET anchor = 1 WHERE id = (SELECT id FROM assets LIMIT 1)`);
  }

  db.close();
  console.log(`[Ingest] Complete — ${totalIndexed} total assets indexed.`);
  return { indexed: totalIndexed, skipped };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  ingestLocalAssets().catch(err => { console.error('[Ingest] Fatal:', err); process.exit(1); });
}
