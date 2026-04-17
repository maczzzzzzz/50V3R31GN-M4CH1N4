/**
 * src/core/ingest/JsonFoundryHandler.ts
 * Phase 57: Ingests Foundry VTT JSON exports (fvtt-Actor, fvtt-Item, fvtt-JournalEntry)
 * into structured SQL tables with strict Zod validation.
 *
 * Usage: pass path to a .json file or directory of .json files.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';
import { FoundryItemSchema, FoundryNpcSchema } from './types.js';
import { semanticHash } from './hash.js';

// ---------------------------------------------------------------------------
// Foundry document shapes (loose — we coerce what we need)
// ---------------------------------------------------------------------------

const FoundryDocSchema = z.object({
  _id: z.string().optional(),
  type: z.string().optional(),
  name: z.string().min(1),
  system: z.record(z.unknown()).optional().default({}),
  items: z.array(z.unknown()).optional(),
  flags: z.record(z.unknown()).optional(),
});

type FoundryDoc = z.infer<typeof FoundryDocSchema>;

function extractItems(doc: FoundryDoc, source: string): z.infer<typeof FoundryItemSchema>[] {
  const sys = doc.system as Record<string, unknown> ?? {};
  const cost = typeof sys['price'] === 'number' ? sys['price'] :
    typeof (sys['price'] as Record<string, unknown>)?.['market'] === 'number'
      ? (sys['price'] as Record<string, unknown>)['market'] as number : 0;
  const weight = typeof sys['weight'] === 'number' ? sys['weight'] : 0;

  return [FoundryItemSchema.parse({
    id: doc._id ?? randomUUID(),
    name: doc.name,
    type: doc.type ?? 'gear',
    category: typeof sys['category'] === 'string' ? sys['category'] : null,
    cost,
    weight,
    data_json: JSON.stringify(doc.system ?? {}),
    district_id: null,
    source,
  })];
}

function extractNpc(doc: FoundryDoc): z.infer<typeof FoundryNpcSchema> | null {
  const sys = doc.system as Record<string, unknown> ?? {};
  const derivedStats = sys['derivedStats'] as Record<string, unknown> ?? {};
  const stats = sys['stats'] as Record<string, unknown> ?? {};

  const hp = typeof (derivedStats['hp'] as Record<string, unknown>)?.['max'] === 'number'
    ? (derivedStats['hp'] as Record<string, unknown>)['max'] as number
    : typeof (stats['hp'] as Record<string, unknown>)?.['value'] === 'number'
      ? (stats['hp'] as Record<string, unknown>)['value'] as number : 0;

  const sp = typeof (derivedStats['sp'] as Record<string, unknown>)?.['max'] === 'number'
    ? (derivedStats['sp'] as Record<string, unknown>)['max'] as number : 0;

  const emp = typeof (stats['emp'] as Record<string, unknown>)?.['value'] === 'number'
    ? (stats['emp'] as Record<string, unknown>)['value'] as number : 0;

  const rawDisposition = (sys['disposition'] as string | undefined) ?? 'neutral';
  const disposition = ['friendly', 'neutral', 'hostile'].includes(rawDisposition)
    ? (rawDisposition as 'friendly' | 'neutral' | 'hostile') : 'neutral';

  return FoundryNpcSchema.parse({
    id: doc._id ?? randomUUID(),
    name: doc.name,
    hp,
    sp,
    emp,
    humanity: 0,
    faction: typeof sys['faction'] === 'string' ? sys['faction'] : null,
    district_id: null,
    disposition,
    is_alive: true,
  });
}

async function collectJsonFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectJsonFiles(full, files);
    } else if (entry.name.endsWith('.json') && !entry.name.includes(':Zone.Identifier')) {
      files.push(full);
    }
  }
  return files;
}

async function collectNdjsonFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectNdjsonFiles(full, files);
    } else if ((entry.name.endsWith('.db') || entry.name.endsWith('.ndjson')) && !entry.name.includes(':Zone.Identifier')) {
      files.push(full);
    }
  }
  return files;
}

async function parseNdjson(filePath: string): Promise<FoundryDoc[]> {
  const text = await fs.readFile(filePath, 'utf-8');
  const docs: FoundryDoc[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = FoundryDocSchema.safeParse(JSON.parse(trimmed));
      if (parsed.success) docs.push(parsed.data);
    } catch { /* skip malformed lines */ }
  }
  return docs;
}

async function loadJsonDocs(source: string): Promise<FoundryDoc[]> {
  const stat = await fs.stat(source).catch(() => null);
  if (!stat) throw new Error(`JsonFoundryHandler: source not found: ${source}`);

  const isNdjsonFile = (f: string) => f.endsWith('.db') || f.endsWith('.ndjson');

  const files: string[] = stat.isDirectory()
    ? [...await collectJsonFiles(source), ...await collectNdjsonFiles(source)]
    : [source];

  const docs: FoundryDoc[] = [];
  for (const file of files) {
    try {
      if (isNdjsonFile(file)) {
        docs.push(...await parseNdjson(file));
      } else {
        const raw = await fs.readFile(file, 'utf-8');
        const json = JSON.parse(raw) as unknown;
        const entries = Array.isArray(json) ? json : [json];
        for (const entry of entries) {
          const parsed = FoundryDocSchema.safeParse(entry);
          if (parsed.success) docs.push(parsed.data);
        }
      }
    } catch (e) {
      console.error(`  [JsonFoundryHandler] Parse error in ${file}: ${(e as Error).message}`);
    }
  }
  return docs;
}

export class JsonFoundryHandler implements IIngestHandler {
  readonly name = 'JsonFoundryHandler';
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  canHandle(source: string): boolean {
    return source.endsWith('.json') || (
      !source.startsWith('http') && !source.endsWith('.pdf') && !source.endsWith('.db')
    );
  }

  async run(source: string): Promise<IngestResult> {
    console.log(`::/5Y573M-N071C3 : JsonFoundryHandler — ingesting: ${source}`);

    const docs = await loadJsonDocs(source);
    console.log(`  >> Loaded ${docs.length} Foundry documents`);

    const itemStmt = this.db.prepare(`
      INSERT INTO items (id, name, type, category, cost, weight, data_json, district_id, source)
      VALUES (@id, @name, @type, @category, @cost, @weight, @data_json, @district_id, @source)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        data_json = excluded.data_json,
        last_updated = CURRENT_TIMESTAMP
    `);

    const npcStmt = this.db.prepare(`
      INSERT INTO npcs (id, name, hp, sp, emp, humanity, faction, district_id, disposition, is_alive)
      VALUES (@id, @name, @hp, @sp, @emp, @humanity, @faction, @district_id, @disposition, @is_alive)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        hp = excluded.hp,
        disposition = excluded.disposition
    `);

    const chronicleStmt = this.db.prepare(`
      INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, district_id, semantic_hash, status)
      VALUES (@id, @title, @content, @source, @category, @era_grounding, @district_id, @semantic_hash, @status)
      ON CONFLICT(semantic_hash) DO NOTHING
    `);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    this.db.transaction(() => {
      for (const doc of docs) {
        try {
          const docType = doc.type ?? '';
          if (['character', 'npc', 'mook', 'vehicle'].includes(docType)) {
            const npc = extractNpc(doc);
            if (npc) {
              npcStmt.run({ ...npc, is_alive: npc.is_alive ? 1 : 0 });
              inserted++;
            }
          } else if (['weapon', 'armor', 'cyberware', 'gear', 'program', 'ammo', 'clothing'].includes(docType)) {
            const items = extractItems(doc, 'FOUNDRY');
            for (const item of items) {
              itemStmt.run(item);
              inserted++;
            }
          } else if (docType === 'JournalEntry' || docType === 'journal') {
            const content = JSON.stringify(doc.system ?? { name: doc.name });
            const hash = semanticHash(content);
            const result = chronicleStmt.run({
              id: randomUUID(),
              title: doc.name,
              content,
              source: 'FOUNDRY',
              category: '#Technical',
              era_grounding: '2045',
              district_id: null,
              semantic_hash: hash,
              status: 'pending',
            });
            if ((result.changes ?? 0) > 0) inserted++;
            else skipped++;
          } else {
            // Unknown type — insert as item fallback
            const items = extractItems(doc, 'FOUNDRY');
            for (const item of items) {
              itemStmt.run(item);
              inserted++;
            }
          }
        } catch (e) {
          console.error(`  [JsonFoundryHandler] Error processing "${doc.name}": ${(e as Error).message}`);
          errors++;
        }
      }
    })();

    console.log(`  >> JsonFoundryHandler done: inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { inserted, skipped, errors, source: 'FOUNDRY' };
  }
}
