/**
 * src/core/ingest/CompendiumDbHandler.ts
 * Phase 57: Extracts and reconciles data from legacy community SQLite compendiums.
 *
 * Discovers tables, maps NPC/Item-like rows into the canonical schema,
 * and merges them into the Akashik DB with dedup protection.
 *
 * Usage: pass a path to a .db or .sqlite file as `source`.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';
import { semanticHash } from './hash.js';

// Generic row shape from unknown community DBs
interface GenericRow {
  [key: string]: unknown;
}

function coerceString(val: unknown): string | null {
  if (typeof val === 'string' && val.trim()) return val.trim();
  if (typeof val === 'number') return String(val);
  return null;
}

function coerceInt(val: unknown): number {
  if (typeof val === 'number') return Math.round(val);
  if (typeof val === 'string') { const n = parseInt(val, 10); return isNaN(n) ? 0 : n; }
  return 0;
}

function detectItemType(row: GenericRow): string {
  const name = coerceString(row['type'] ?? row['item_type'] ?? row['category'])?.toLowerCase() ?? '';
  for (const t of ['weapon', 'armor', 'cyberware', 'gear', 'program', 'ammo']) {
    if (name.includes(t)) return t;
  }
  return 'gear';
}

function rowToItemInsert(row: GenericRow, sourceName: string): Record<string, unknown> | null {
  const name = coerceString(row['name'] ?? row['Name'] ?? row['item_name']);
  if (!name) return null;
  return {
    id: coerceString(row['id'] ?? row['_id']) ?? randomUUID(),
    name,
    type: detectItemType(row),
    category: coerceString(row['category'] ?? row['subtype'] ?? null),
    cost: coerceInt(row['cost'] ?? row['price'] ?? row['Cost'] ?? 0),
    weight: coerceInt(row['weight'] ?? row['Weight'] ?? 0),
    data_json: JSON.stringify(row),
    district_id: coerceString(row['district'] ?? row['district_id'] ?? null),
    source: sourceName,
  };
}

function rowToNpcInsert(row: GenericRow): Record<string, unknown> | null {
  const name = coerceString(row['name'] ?? row['Name'] ?? row['npc_name']);
  if (!name) return null;
  const rawDisp = coerceString(row['disposition'] ?? null)?.toLowerCase() ?? 'neutral';
  const disposition = ['friendly', 'neutral', 'hostile'].includes(rawDisp) ? rawDisp : 'neutral';
  return {
    id: coerceString(row['id'] ?? row['_id']) ?? randomUUID(),
    name,
    hp: coerceInt(row['hp'] ?? row['HP'] ?? 0),
    sp: coerceInt(row['sp'] ?? row['SP'] ?? 0),
    emp: coerceInt(row['emp'] ?? row['EMP'] ?? 0),
    humanity: coerceInt(row['humanity'] ?? 0),
    faction: coerceString(row['faction'] ?? row['gang'] ?? null),
    district_id: coerceString(row['district'] ?? row['district_id'] ?? null),
    disposition,
    is_alive: 1,
  };
}

function isNpcTable(tableName: string, columns: string[]): boolean {
  const nameL = tableName.toLowerCase();
  if (nameL.includes('npc') || nameL.includes('actor') || nameL.includes('character')) return true;
  const colSet = new Set(columns.map(c => c.toLowerCase()));
  return colSet.has('hp') && colSet.has('name');
}

function isItemTable(tableName: string, columns: string[]): boolean {
  const nameL = tableName.toLowerCase();
  if (nameL.includes('item') || nameL.includes('weapon') || nameL.includes('armor') ||
      nameL.includes('gear') || nameL.includes('cyberware')) return true;
  const colSet = new Set(columns.map(c => c.toLowerCase()));
  return colSet.has('cost') && colSet.has('name');
}

export class CompendiumDbHandler implements IIngestHandler {
  readonly name = 'CompendiumDbHandler';
  private readonly akashik: Database.Database;

  constructor(akashikDb: Database.Database) {
    this.akashik = akashikDb;
  }

  canHandle(source: string): boolean {
    return source.endsWith('.db') || source.endsWith('.sqlite') || source.endsWith('.sqlite3');
  }

  private resolveDbFiles(source: string): string[] {
    const stat = fs.statSync(source, { throwIfNoEntry: false });
    if (!stat) return [];
    if (stat.isDirectory()) {
      return fs.readdirSync(source)
        .filter(e => e.endsWith('.db') || e.endsWith('.sqlite') || e.endsWith('.sqlite3'))
        .map(e => path.join(source, e));
    }
    return [source];
  }

  async run(source: string): Promise<IngestResult> {
    console.log(`::/5Y573M-N071C3 : CompendiumDbHandler — reconciling: ${source}`);

    const dbFiles = this.resolveDbFiles(source);
    if (dbFiles.length === 0) {
      console.warn(`  [CompendiumDbHandler] No .db files found at: ${source}`);
      return { inserted: 0, skipped: 0, errors: 0, source: 'COMPENDIUM' };
    }
    console.log(`  >> Found ${dbFiles.length} compendium DB(s)`);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const dbFile of dbFiles) {
      try {
        const r = await this.#processDb(dbFile);
        totalInserted += r.inserted;
        totalSkipped += r.skipped;
        totalErrors += r.errors;
      } catch (e) {
        console.error(`  [CompendiumDbHandler] Skipping invalid DB ${path.basename(dbFile)}: ${(e as Error).message}`);
        totalErrors++;
      }
    }

    console.log(`  >> CompendiumDbHandler done: inserted=${totalInserted} skipped=${totalSkipped} errors=${totalErrors}`);
    return { inserted: totalInserted, skipped: totalSkipped, errors: totalErrors, source: 'COMPENDIUM' };
  }

  async #processDb(source: string): Promise<IngestResult> {
    const compendium = new Database(source, { readonly: true });
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    const itemStmt = this.akashik.prepare(`
      INSERT INTO items (id, name, type, category, cost, weight, data_json, district_id, source)
      VALUES (@id, @name, @type, @category, @cost, @weight, @data_json, @district_id, @source)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        data_json = excluded.data_json,
        last_updated = CURRENT_TIMESTAMP
    `);

    const npcStmt = this.akashik.prepare(`
      INSERT INTO npcs (id, name, hp, sp, emp, humanity, faction, district_id, disposition, is_alive)
      VALUES (@id, @name, @hp, @sp, @emp, @humanity, @faction, @district_id, @disposition, @is_alive)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        hp = excluded.hp
    `);

    const chronicleStmt = this.akashik.prepare(`
      INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, district_id, semantic_hash, status)
      VALUES (@id, @title, @content, @source, @category, @era_grounding, @district_id, @semantic_hash, @status)
      ON CONFLICT(semantic_hash) DO NOTHING
    `);

    try {
      const tables = compendium.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      ).all() as Array<{ name: string }>;

      console.log(`  >> Found ${tables.length} tables in compendium`);

      for (const { name: tableName } of tables) {
        const columnInfo = compendium.prepare(`PRAGMA table_info("${tableName}")`).all() as Array<{ name: string }>;
        const columns = columnInfo.map(c => c.name);
        const rows = compendium.prepare(`SELECT * FROM "${tableName}" LIMIT 2000`).all() as GenericRow[];

        this.akashik.transaction(() => {
          for (const row of rows) {
            try {
              if (isNpcTable(tableName, columns)) {
                const npc = rowToNpcInsert(row);
                if (npc) { npcStmt.run(npc); inserted++; }
                else skipped++;
              } else if (isItemTable(tableName, columns)) {
                const item = rowToItemInsert(row, 'COMPENDIUM');
                if (item) { itemStmt.run(item); inserted++; }
                else skipped++;
              } else {
                // Treat unknown tables as lore chronicle
                const title = coerceString(row['title'] ?? row['name'] ?? row['subject'] ?? tableName);
                const content = coerceString(row['content'] ?? row['text'] ?? row['description'] ?? JSON.stringify(row));
                if (title && content) {
                  const hash = semanticHash(content);
                  const result = chronicleStmt.run({
                    id: randomUUID(),
                    title,
                    content,
                    source: 'COMPENDIUM',
                    category: '#Technical',
                    era_grounding: '2045',
                    district_id: coerceString(row['district'] ?? null),
                    semantic_hash: hash,
                    status: 'pending',
                  });
                  if ((result.changes ?? 0) > 0) inserted++;
                  else skipped++;
                } else {
                  skipped++;
                }
              }
            } catch (e) {
              console.error(`  [CompendiumDbHandler] Row error in ${tableName}: ${(e as Error).message}`);
              errors++;
            }
          }
        })();

        console.log(`  >> Table "${tableName}": ${rows.length} rows processed`);
      }
    } finally {
      compendium.close();
    }

    return { inserted, skipped, errors, source: 'COMPENDIUM' };
  }
}
