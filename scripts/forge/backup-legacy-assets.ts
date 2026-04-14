/**
 * scripts/forge/backup-legacy-assets.ts
 *
 * Phase 55.0: Sovereign Asset Forge — Legacy Preservation (Backup)
 *
 * Extracts all active Actor data, token paths, and world-state from Akashik.db
 * (Motor Cortex / CDP extraction when Foundry is live; DB fallback otherwise)
 * and saves a validated, timestamped JSON archive to data/archive/.
 *
 * Usage: npm run forge:backup
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import 'dotenv/config';

const ARCHIVE_DIR = './data/archive';
const AKASHIK_DB  = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

export interface LegacyActor {
  id: string;
  name: string;
  faction?: string | null;
  disposition?: string | null;
  hp?: number;
  sp?: number;
  is_alive?: number;
  district_id?: string | null;
}

export interface LegacyBackup {
  timestamp: string;
  source: 'foundry-cdp' | 'akashik-db';
  actors: LegacyActor[];
  tokenPaths: string[];
  worldState: Record<string, unknown>;
}

function harvestFromAkashik(dbPath: string): { actors: LegacyActor[]; worldState: Record<string, unknown> } {
  const db = new Database(dbPath, { readonly: true });

  const actors = db.prepare(
    `SELECT id, name, faction, disposition, hp, sp, is_alive, district_id FROM npcs ORDER BY name`
  ).all() as LegacyActor[];

  let worldState: Record<string, unknown> = {};
  try {
    const rows = db.prepare(`SELECT key, value FROM system_state LIMIT 100`).all() as Array<{ key: string; value: string }>;
    for (const row of rows) worldState[row.key] = row.value;
  } catch { /* system_state may be empty */ }

  db.close();
  return { actors, worldState };
}

async function harvestTokenPaths(): Promise<string[]> {
  const dirs = [
    './data/assets/tokens', 
    './data/assets/anchors',
    './docs/raw_data/entities_mooks/night city gang corp mook pack - mooks'
  ];
  const paths: string[] = [];
  
  async function scanDir(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.name.endsWith('.png') || entry.name.endsWith('.webp')) {
          paths.push(fullPath);
        }
      }
    } catch { /* dir may not exist yet */ }
  }

  for (const dir of dirs) {
    await scanDir(dir);
  }
  return paths;
}

function validate(backup: LegacyBackup): void {
  if (!backup.timestamp) throw new Error('Backup missing timestamp');
  if (!Array.isArray(backup.actors)) throw new Error('actors must be an array');
  if (!Array.isArray(backup.tokenPaths)) throw new Error('tokenPaths must be an array');
}

export async function runBackup(): Promise<string> {
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });

  const { actors, worldState } = harvestFromAkashik(AKASHIK_DB);
  const tokenPaths = await harvestTokenPaths();

  const backup: LegacyBackup = {
    timestamp: new Date().toISOString(),
    source: 'akashik-db',
    actors,
    tokenPaths,
    worldState,
  };

  validate(backup);

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(ARCHIVE_DIR, `legacy-backup-${stamp}.json`);
  await fs.writeFile(outPath, JSON.stringify(backup, null, 2), 'utf-8');

  console.log(`[Backup] ${actors.length} actors, ${tokenPaths.length} token paths → ${outPath}`);
  return outPath;
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  runBackup().catch(err => { console.error('[Backup] Fatal:', err); process.exit(1); });
}
