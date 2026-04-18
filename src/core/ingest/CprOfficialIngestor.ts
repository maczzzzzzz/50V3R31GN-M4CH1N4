/**
 * src/core/ingest/CprOfficialIngestor.ts
 * Phase 59: Official CPR YAML ingestor — parses packs/core/ and packs/internal/
 * applying canonical rules data (dv_tables, items, localized_dictionary).
 *
 * Source format: Foundry VTT CPR system YAML packs (migrations 025-040).
 * Gracefully handles missing packs/ directory.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { randomUUID } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';

const PACKS_DIR = 'packs';
const OFFICIAL_DIRS = ['core', 'internal'];

interface CprYamlItem {
  _id?: string;
  name?: string;
  type?: string;
  system?: {
    price?: { market?: number };
    weight?: number;
    concealable?: { concealable?: boolean };
    source?: { book?: string };
    description?: { value?: string };
    reliability?: string;
    slotsUsed?: number;
  };
}

interface CprYamlDvEntry {
  weaponCategory?: string;
  rangeBracket?: string;
  dv?: number;
}

export class CprOfficialIngestor implements IIngestHandler {
  readonly name = 'CprOfficialIngestor';

  constructor(private readonly db: Database.Database) {}

  canHandle(source: string): boolean {
    return source === '--official' || source === PACKS_DIR || source.endsWith('.yaml') || source.endsWith('.yml');
  }

  async run(_source: string): Promise<IngestResult> {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    if (!fs.existsSync(PACKS_DIR)) {
      console.warn(`  [CprOfficialIngestor] packs/ not found — skipping official YAML ingest`);
      console.warn(`  [CprOfficialIngestor] Stage packs/core/ and packs/internal/ from the CPR Foundry system to enable.`);
      return { source: PACKS_DIR, inserted, skipped, errors };
    }

    const insertItem = this.db.prepare(`
      INSERT OR IGNORE INTO items (id, name, type, category, cost, weight, data_json, source, concealable, reliability, slots_used)
      VALUES (@id, @name, @type, @category, @cost, @weight, @data_json, @source, @concealable, @reliability, @slots_used)
    `);

    const insertDv = this.db.prepare(`
      INSERT OR REPLACE INTO dv_tables (weapon_category, range_bracket, dv)
      VALUES (@weapon_category, @range_bracket, @dv)
    `);

    const insertDict = this.db.prepare(`
      INSERT OR IGNORE INTO localized_dictionary (key, value_en)
      VALUES (@key, @value_en)
    `);

    const doInsert = this.db.transaction((files: string[]) => {
      for (const file of files) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const docs = yaml.loadAll(raw) as unknown[];

          for (const doc of docs) {
            if (!doc || typeof doc !== 'object') continue;
            const d = doc as Record<string, unknown>;

            // DV table entries
            if ('weaponCategory' in d && 'rangeBracket' in d && 'dv' in d) {
              const entry = d as CprYamlDvEntry;
              if (entry.weaponCategory && entry.rangeBracket && entry.dv !== undefined) {
                insertDv.run({
                  weapon_category: entry.weaponCategory,
                  range_bracket: entry.rangeBracket,
                  dv: entry.dv,
                });
                inserted++;
              }
              continue;
            }

            // Item entries
            if ('name' in d && 'type' in d) {
              const item = d as CprYamlItem;
              if (!item.name) { skipped++; continue; }
              const id = (item._id as string | undefined) ?? randomUUID();
              const sys = item.system ?? {};
              insertItem.run({
                id,
                name: item.name,
                type: item.type ?? 'gear',
                category: sys.source?.book ?? null,
                cost: sys.price?.market ?? 0,
                weight: sys.weight ?? 0,
                data_json: JSON.stringify(d),
                source: 'CPR_OFFICIAL',
                concealable: sys.concealable?.concealable ? 1 : 0,
                reliability: sys.reliability ?? null,
                slots_used: sys.slotsUsed ?? 0,
              });
              // Localize name
              insertDict.run({ key: `item.${id}.name`, value_en: item.name });
              inserted++;
            }
          }
        } catch (e) {
          console.error(`  [CprOfficialIngestor] Error parsing ${file}: ${(e as Error).message}`);
          errors++;
        }
      }
    });

    const yamlFiles = this.collectYaml(PACKS_DIR);
    doInsert(yamlFiles);

    console.log(`  [CprOfficialIngestor] Processed ${yamlFiles.length} YAML files — inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { source: PACKS_DIR, inserted, skipped, errors };
  }

  private collectYaml(dir: string): string[] {
    const results: string[] = [];
    const scan = (d: string) => {
      const entries = fs.readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(d, e.name);
        if (e.isDirectory()) {
          const rel = path.relative(PACKS_DIR, full);
          if (OFFICIAL_DIRS.some(od => rel === od || rel.startsWith(od + '/'))) scan(full);
          else if (dir === PACKS_DIR) scan(full); // top-level subdir scan
        } else if (e.name.endsWith('.yaml') || e.name.endsWith('.yml')) {
          results.push(full);
        }
      }
    };
    scan(dir);
    return results;
  }
}
