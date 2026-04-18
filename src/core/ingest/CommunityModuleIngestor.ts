/**
 * src/core/ingest/CommunityModuleIngestor.ts
 * Phase 59: Community JSON ingestor — parses docs/raw_data/campaign_ttta/ and
 * docs/raw_data/entities_mooks/, linking items and NPC stats to the canonical base.
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';

const RAW_DATA = 'docs/raw_data';
const CAMPAIGN_DIR = path.join(RAW_DATA, 'campaign_ttta');
const MOOKS_DIR = path.join(RAW_DATA, 'entities_mooks');

// ---------------------------------------------------------------------------
// Foundry JSON shapes (community packs)
// ---------------------------------------------------------------------------

interface FoundryItemDoc {
  _id?: string;
  name?: string;
  type?: string;
  system?: {
    price?: { market?: number };
    weight?: number;
    concealable?: { concealable?: boolean };
    reliability?: string;
    installedItems?: { slots?: number };
    source?: { book?: string };
    description?: { value?: string };
  };
}

interface FoundryMookDoc {
  _id?: string;
  name?: string;
  type?: string;
  faction?: string;
  system?: {
    stats?: {
      emp?: { value?: number };
      body?: { value?: number };
    };
    derivedStats?: {
      hp?: { value?: number; max?: number };
    };
    externalData?: {
      currentArmorHead?: { value?: number };
      currentArmorBody?: { value?: number };
    };
  };
  items?: FoundryItemDoc[];
}

export class CommunityModuleIngestor implements IIngestHandler {
  readonly name = 'CommunityModuleIngestor';

  constructor(private readonly db: Database.Database) {}

  canHandle(source: string): boolean {
    return source === '--official' || source === RAW_DATA ||
           source.startsWith(CAMPAIGN_DIR) || source.startsWith(MOOKS_DIR);
  }

  async run(_source: string): Promise<IngestResult> {
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    const r = this.ingestCampaignItems();
    inserted += r.inserted; skipped += r.skipped; errors += r.errors;

    const r2 = this.ingestMooks();
    inserted += r2.inserted; skipped += r2.skipped; errors += r2.errors;

    return { source: RAW_DATA, inserted, skipped, errors };
  }

  // ---------------------------------------------------------------------------
  // Campaign TTTA items
  // ---------------------------------------------------------------------------

  private ingestCampaignItems(): IngestResult {
    let inserted = 0, skipped = 0, errors = 0;

    if (!fs.existsSync(CAMPAIGN_DIR)) {
      console.warn(`  [CommunityModuleIngestor] ${CAMPAIGN_DIR} not found — skipping`);
      return { source: CAMPAIGN_DIR, inserted, skipped, errors };
    }

    const insertItem = this.db.prepare(`
      INSERT OR IGNORE INTO items (id, name, type, category, cost, weight, data_json, source, concealable, reliability, slots_used)
      VALUES (@id, @name, @type, @category, @cost, @weight, @data_json, @source, @concealable, @reliability, @slots_used)
    `);

    const doInsert = this.db.transaction((files: string[]) => {
      for (const file of files) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const doc = JSON.parse(raw) as FoundryItemDoc;
          if (!doc.name) { skipped++; continue; }

          const id = doc._id ?? randomUUID();
          const sys = doc.system ?? {};
          insertItem.run({
            id,
            name: doc.name,
            type: doc.type ?? 'gear',
            category: sys.source?.book ?? 'TttA',
            cost: sys.price?.market ?? 0,
            weight: sys.weight ?? 0,
            data_json: raw,
            source: 'COMMUNITY_TTTA',
            concealable: sys.concealable?.concealable ? 1 : 0,
            reliability: sys.reliability ?? null,
            slots_used: sys.installedItems?.slots ?? 0,
          });
          inserted++;
        } catch (e) {
          console.error(`  [CommunityModuleIngestor] Item parse error ${path.basename(file)}: ${(e as Error).message}`);
          errors++;
        }
      }
    });

    const files = this.collectJson(CAMPAIGN_DIR);
    doInsert(files);
    console.log(`  [CommunityModuleIngestor] Campaign items — files=${files.length} inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { source: CAMPAIGN_DIR, inserted, skipped, errors };
  }

  // ---------------------------------------------------------------------------
  // Mook NPCs
  // ---------------------------------------------------------------------------

  private ingestMooks(): IngestResult {
    let inserted = 0, skipped = 0, errors = 0;

    if (!fs.existsSync(MOOKS_DIR)) {
      console.warn(`  [CommunityModuleIngestor] ${MOOKS_DIR} not found — skipping`);
      return { source: MOOKS_DIR, inserted, skipped, errors };
    }

    const insertNpc = this.db.prepare(`
      INSERT OR IGNORE INTO npcs (id, name, hp, sp, emp, humanity, faction, district_id, disposition, is_alive, head_sp, body_sp)
      VALUES (@id, @name, @hp, @sp, @emp, @humanity, @faction, @district_id, @disposition, @is_alive, @head_sp, @body_sp)
    `);

    const insertTriplet = this.db.prepare(`
      INSERT OR IGNORE INTO triplets (subject_id, predicate, object_literal, district_id)
      VALUES (@subject_id, @predicate, @object_literal, @district_id)
    `);

    const doInsert = this.db.transaction((files: string[]) => {
      for (const file of files) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const doc = JSON.parse(raw) as FoundryMookDoc;
          if (!doc.name || doc.type !== 'mook') { skipped++; continue; }

          const id = doc._id ?? createHash('sha256').update(doc.name + file).digest('hex').slice(0, 16);
          const sys = doc.system ?? {};
          const hp = sys.derivedStats?.hp?.value ?? 0;
          const bodyArmor = sys.externalData?.currentArmorBody?.value ?? 0;
          const headArmor = sys.externalData?.currentArmorHead?.value ?? 0;
          const emp = sys.stats?.emp?.value ?? 0;

          // Faction from directory name (parent folder of the JSON file)
          const dirFaction = doc.faction ?? path.basename(path.dirname(file));

          insertNpc.run({
            id,
            name: doc.name,
            hp,
            sp: bodyArmor,
            emp,
            humanity: emp * 10,
            faction: dirFaction,
            district_id: null,
            disposition: 'hostile',
            is_alive: 1,
            head_sp: headArmor,
            body_sp: bodyArmor,
          });

          // Semantic triplet: faction membership
          insertTriplet.run({
            subject_id: id,
            predicate: 'member_of',
            object_literal: dirFaction,
            district_id: null,
          });

          inserted++;
        } catch (e) {
          console.error(`  [CommunityModuleIngestor] Mook parse error ${path.basename(file)}: ${(e as Error).message}`);
          errors++;
        }
      }
    });

    const files = this.collectJson(MOOKS_DIR);
    doInsert(files);
    console.log(`  [CommunityModuleIngestor] Mooks — files=${files.length} inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { source: MOOKS_DIR, inserted, skipped, errors };
  }

  private collectJson(dir: string): string[] {
    const results: string[] = [];
    const scan = (d: string) => {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(d, e.name);
          if (e.isDirectory()) scan(full);
          else if (e.name.endsWith('.json')) results.push(full);
        }
      } catch { /* skip unreadable dirs */ }
    };
    scan(dir);
    return results;
  }
}
