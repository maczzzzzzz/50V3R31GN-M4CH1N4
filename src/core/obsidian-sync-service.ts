/**
 * ObsidianSyncService — Semantic Bidirectional RKG ↔ Obsidian Vault Synchronizer
 *
 * Phase 43: 53M4N71C_V4UL7_R3C0N57RUC710N
 *
 * Transform: Converts raw database triplets AND chronicle seeds into structured
 *            Obsidian notes with hierarchical folders and semantic tags.
 *            MAX-STABILITY approach: minimal memory allocation, batched IO.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import chokidar, { type FSWatcher } from 'chokidar';
import Database from 'better-sqlite3';

// ── Constants ─────────────────────────────────────────────────────────────────

const VAULT_ROOT = path.resolve('data/vault/RKG');
const WINDOWS_VAULT_MIRROR = process.env['WINDOWS_VAULT_ROOT'] || null;
const POLL_INTERVAL_MS = 120_000; // 2 minutes for massive vault stability

// ── Types ─────────────────────────────────────────────────────────────────────

interface Triplet {
  subject_id: string;
  predicate: string;
  object_literal: string;
  last_updated: string;
}

interface Chronicle {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  era_grounding: string;
  status: string;
  last_updated: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function sanitizeFilename(name: string): string {
  if (typeof name !== 'string') return 'unnamed';
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200);
}

function stripObsidianLinks(text: string): string {
  if (typeof text !== 'string') return String(text);
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1');
}

function toObsidianLink(text: string): string {
  if (typeof text !== 'string') return String(text);
  if (text.startsWith('[[')) return text;
  if (/^\d+/.test(text) || text.length < 3) return text;
  return `[[${text}]]`;
}

// ── Main Service ──────────────────────────────────────────────────────────────

export class ObsidianSyncService {
  private db: Database.Database;
  private watcher: FSWatcher | null = null;
  private mirrorWatcher: FSWatcher | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private importLock = new Set<string>();

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.initVaultDirs();
  }

  private initVaultDirs(): void {
    try {
      if (!fs.existsSync(VAULT_ROOT)) fs.mkdirSync(VAULT_ROOT, { recursive: true });
      if (WINDOWS_VAULT_MIRROR && !fs.existsSync(WINDOWS_VAULT_MIRROR)) {
        fs.mkdirSync(WINDOWS_VAULT_MIRROR, { recursive: true });
      }
    } catch (err) {
      this.log(`S1GN4L_L055: vault dir init failed — ${err}`);
    }
  }

  // ── Sync Logic ────────────────────────────────────────────────────────────

  sync(): void {
    this.exportTriplets();
    this.exportChronicles();
    // Aggressive lock clearing to prevent memory creep
    this.importLock.clear();
  }

  exportTriplets(): void {
    try {
      const rows = this.db
        .prepare("SELECT subject_id, predicate, object_literal, last_updated FROM triplets WHERE predicate NOT LIKE 'PURGED_%' ORDER BY subject_id")
        .all() as Triplet[];

      const bySubject = new Map<string, Triplet[]>();
      for (const row of rows) {
        const list = bySubject.get(row.subject_id) ?? [];
        list.push(row);
        bySubject.set(row.subject_id, list);
      }

      let count = 0;
      for (const [subject, triplets] of bySubject) {
        this.writeTripletNote(subject, triplets);
        count++;
      }
      if (count > 0) this.log(`EXPORT: ${count} triplet entities synced.`);
    } catch (err) {
      this.log(`S1GN4L_L055: triplet export failed — ${err}`);
    }
  }

  exportChronicles(): void {
    try {
      const stmt = this.db.prepare("SELECT title, content, source, category, era_grounding, status FROM chronicle_seeds WHERE status = 'approved'");
      
      let count = 0;
      for (const c of stmt.iterate() as Iterable<any>) {
        this.writeChronicleNote(c);
        count++;
        if (count % 500 === 0) this.log(`EXPORT: Progress ${count}...`);
      }
      this.log(`EXPORT: Finished ${count} chronicles.`);
    } catch (err) {
      this.log(`S1GN4L_L055: chronicle export failed — ${err}`);
    }
  }

  private writeTripletNote(subject: string, triplets: Triplet[]): void {
    const typeObj = triplets.find(t => t.predicate === 'is')?.object_literal.toLowerCase() ?? '';
    const descObj = triplets.find(t => t.predicate === 'has description')?.object_literal ?? '';
    
    let category = 'Knowledge';
    if (typeObj.includes('item') || subject.toLowerCase().includes('materials')) category = 'Items';
    else if (typeObj.includes('npc') || typeObj.includes('actor')) category = 'Actors';

    const props: any = {
      subject,
      type: category.slice(0, -1),
      tags: [`rkg/${category.toLowerCase()}`],
      sovereign: true,
      source: 'AKASHIK_DB',
      last_synced: new Date().toISOString()
    };

    for (const t of triplets) {
      const k = t.predicate.replace('has ', '').replace(' ', '_');
      if (k !== 'description') props[k] = stripObsidianLinks(t.object_literal);
    }

    const content = `---\n${yaml.dump(props)}---\n\n# ${subject}\n\n${descObj ? `> ${descObj}\n\n` : ''}### ◈ KNOWLEDGE TRIADS\n\n${triplets.map(t => `- **${t.predicate}** :: ${toObsidianLink(t.object_literal)}`).join('\n')}`;

    this.safeWrite(category, subject, content);
  }

  private writeChronicleNote(c: any): void {
    const cleanCat = (c.category || '').replace('#', '');
    let folder = 'Lore';
    if (cleanCat === 'Gear' || cleanCat === 'Technical') folder = 'Items';
    else if (cleanCat === 'Corporate') folder = 'Factions';

    const props = {
      subject: c.title,
      type: 'Chronicle',
      tags: [`rkg/chronicles/${folder.toLowerCase()}`, cleanCat],
      source: c.source,
      era: c.era_grounding,
      sovereign: true,
      last_synced: new Date().toISOString()
    };

    const content = `---\n${yaml.dump(props)}---\n\n# ${c.title}\n\n${c.content}\n\n---\n_Source: ${c.source}_`;

    this.safeWrite(`Chronicles/${folder}`, c.title, content);
  }

  private safeWrite(subfolder: string, subject: string, content: string): void {
    const filename = sanitizeFilename(subject) + '.md';
    const relPath = path.join(subfolder, filename);
    
    const wslPath = path.join(VAULT_ROOT, relPath);
    const mirrorPath = WINDOWS_VAULT_MIRROR ? path.join(WINDOWS_VAULT_MIRROR, relPath) : null;

    const targets = [wslPath];
    if (mirrorPath) targets.push(mirrorPath);

    for (const p of targets) {
      try {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Memory-efficient check: only write if actually different
        if (fs.existsSync(p)) {
          const existing = fs.readFileSync(p, 'utf8');
          if (existing === content) continue;
        }

        this.importLock.add(p);
        fs.writeFileSync(p, content, 'utf8');
      } catch (e) { }
    }
  }

  startWatcher(): void {
    if (this.watcher) return;
    this.watcher = this.setupDirWatcher(VAULT_ROOT, "WSL");
    if (WINDOWS_VAULT_MIRROR) {
      this.mirrorWatcher = this.setupDirWatcher(WINDOWS_VAULT_MIRROR, "WINDOWS");
    }
  }

  private setupDirWatcher(dir: string, label: string): FSWatcher {
    return chokidar.watch(path.join(dir, '**/*.md'), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 1000 },
    }).on('change', (filepath: string) => {
      if (!this.importLock.has(filepath)) this.handleFileUpdate(filepath);
    }).on('unlink', (filepath: string) => {
      if (!this.importLock.has(filepath)) this.handleDelete(filepath);
    });
  }

  private handleFileUpdate(filepath: string): void {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const match = /^---\n([\s\S]*?)\n---/.exec(content);
      if (!match) return;
      const fm = yaml.load(match[1]!) as any;
      if (!fm) return;

      if (fm.type === 'Chronicle') {
        const body = content.split('---').slice(2).join('---').trim();
        this.db.prepare('UPDATE chronicle_seeds SET content = ? WHERE title = ?').run(body, fm.subject);
      } else {
        const triples: {p: string, o: string}[] = [];
        for (const [k, v] of Object.entries(fm.properties || {})) {
          triples.push({ p: k.replace(/_/g, ' '), o: String(v) });
        }
        this.db.transaction(() => {
          this.db.prepare('DELETE FROM triplets WHERE subject_id = ?').run(fm.subject);
          for (const t of triples) {
            this.db.prepare('INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)').run(fm.subject, t.p, t.o);
          }
        })();
      }
      this.log(`IMPORT: ${fm.subject} updated.`);
    } catch (err) { }
  }

  private handleDelete(filepath: string): void {
    const subject = path.basename(filepath, '.md').replace(/_/g, ' ');
    this.db.prepare("DELETE FROM triplets WHERE subject_id = ?").run(subject);
    this.log(`PURGE: deleted ${subject}`);
  }

  start(): void {
    this.log('0B51D14N_5YNC: operational.');
    this.sync();
    this.pollTimer = setInterval(() => this.sync(), POLL_INTERVAL_MS);
    this.startWatcher();
  }

  stop(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.watcher) void this.watcher.close();
    if (this.mirrorWatcher) void this.mirrorWatcher.close();
    this.db.close();
  }

  private log(msg: string): void {
    process.stdout.write(`[VAULT] ${new Date().toISOString()} ${msg}\n`);
  }
}

const isMain = process.argv[1]
  ? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
  : false;

if (isMain) {
  const dbPath = process.env['RKG_PATH'] ?? 'data/Akashik.db';
  const svc = new ObsidianSyncService(dbPath);
  svc.start();
  process.on('SIGINT', () => { svc.stop(); process.exit(0); });
  process.on('SIGTERM', () => { svc.stop(); process.exit(0); });
}
