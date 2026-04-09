/**
 * ObsidianSyncService — Bidirectional RKG ↔ Obsidian Vault Synchronizer
 *
 * Phase 37: 0B51D14N_5YNC [7H3-HUM4N-R34D4BL3-V4UL7]
 *
 * Export: Polls `triplets` table → writes YAML-frontmatter .md files
 *          to data/vault/RKG/.
 * Import: chokidar watcher on data/vault/RKG/ → upserts parsed YAML back
 *          into Akashik.db.
 * Fail-safe: All errors are logged as S1GN4L_L055 and do NOT block the
 *             core agentic loop.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import chokidar, { type FSWatcher } from 'chokidar';
import Database from 'better-sqlite3';

// ── Constants ─────────────────────────────────────────────────────────────────

const VAULT_ROOT = path.resolve('data/vault/RKG');
const POLL_INTERVAL_MS = 5_000;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Triplet {
  subject_id: string;
  predicate: string;
  object_literal: string;
  last_updated: string;
}

interface NoteFrontmatter {
  subject: string;
  predicate: string;
  object: string;
  sovereign: true;
  source: 'AKASHIK_DB';
  last_synced: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Remove characters invalid on Linux/Windows filesystems. */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200); // max filename length
}

/** Strip Obsidian `[[link]]` brackets from object field for DB storage. */
function stripObsidianLinks(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, '$1');
}

/** Wrap a value in Obsidian link syntax if it looks like an entity name. */
function toObsidianLink(text: string): string {
  // Don't double-wrap already-linked values
  if (text.startsWith('[[')) return text;
  return `[[${text}]]`;
}

/** Serialize a triplet to Markdown with YAML frontmatter. */
function tripletToMarkdown(triplet: Triplet): string {
  const frontmatter: NoteFrontmatter = {
    subject: triplet.subject_id,
    predicate: triplet.predicate,
    object: toObsidianLink(triplet.object_literal),
    sovereign: true,
    source: 'AKASHIK_DB',
    last_synced: new Date().toISOString(),
  };

  // Gather all triplets for this subject to build the CONNECTED TRIADS section
  // (populated during export — see exportTriplets for multi-triplet grouping)
  const yamlBlock = yaml.dump(frontmatter, { lineWidth: 120 });

  return [
    '---',
    yamlBlock.trimEnd(),
    '---',
    '',
    `# ${triplet.subject_id}`,
    '',
    '### ◈ CONNECTED TRIADS',
    '',
    '<div class="provenance-machine">',
    '',
    `- **${triplet.predicate}** → ${toObsidianLink(triplet.object_literal)}`,
    '',
    '</div>',
    '',
  ].join('\n');
}

/** Parse frontmatter from a Markdown file. Returns null on failure. */
function parseMarkdownFrontmatter(content: string): NoteFrontmatter | null {
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!match) return null;
  try {
    return yaml.load(match[1] ?? '') as NoteFrontmatter;
  } catch {
    return null;
  }
}

// ── Main Service ──────────────────────────────────────────────────────────────

export class ObsidianSyncService {
  private db: Database.Database;
  private watcher: FSWatcher | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private importLock = new Set<string>(); // prevents export→import re-trigger

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.initVaultDir();
  }

  // ── Vault Dir Init ───────────────────────────────────────────────────────

  private initVaultDir(): void {
    try {
      fs.mkdirSync(VAULT_ROOT, { recursive: true });
    } catch (err) {
      this.log(`S1GN4L_L055: vault dir init failed — ${err}`);
    }
  }

  // ── Export (DB → MD) ─────────────────────────────────────────────────────

  /**
   * Export all triplets from Akashik.db to Markdown files.
   * Groups triplets by subject_id so each subject has one file with all its
   * predicates listed under CONNECTED TRIADS.
   */
  exportTriplets(): void {
    try {
      const rows = this.db
        .prepare('SELECT subject_id, predicate, object_literal, last_updated FROM triplets ORDER BY subject_id')
        .all() as Triplet[];

      if (rows.length === 0) return;

      // Group by subject
      const bySubject = new Map<string, Triplet[]>();
      for (const row of rows) {
        const list = bySubject.get(row.subject_id) ?? [];
        list.push(row);
        bySubject.set(row.subject_id, list);
      }

      let written = 0;
      for (const [subject, triplets] of bySubject) {
        const filename = sanitizeFilename(subject) + '.md';
        const filepath = path.join(VAULT_ROOT, filename);

        // Use the first triplet for frontmatter, remaining for TRIADS section
        const primary = triplets[0]!;
        const frontmatter: NoteFrontmatter = {
          subject,
          predicate: primary.predicate,
          object: toObsidianLink(primary.object_literal),
          sovereign: true,
          source: 'AKASHIK_DB',
          last_synced: new Date().toISOString(),
        };

        const triadLines = triplets.map(
          (t) => `- **${t.predicate}** → ${toObsidianLink(t.object_literal)}`
        );

        const content = [
          '---',
          yaml.dump(frontmatter, { lineWidth: 120 }).trimEnd(),
          '---',
          '',
          `# ${subject}`,
          '',
          '### ◈ CONNECTED TRIADS',
          '',
          '<div class="provenance-machine">',
          '',
          ...triadLines,
          '',
          '</div>',
          '',
        ].join('\n');

        // Skip write if file hasn't changed (avoids re-triggering the watcher)
        this.importLock.add(filepath);
        try {
          const existing = fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : '';
          if (existing !== content) {
            fs.writeFileSync(filepath, content, 'utf8');
            written++;
          }
        } finally {
          // Release lock after a brief delay so chokidar event settles
          setTimeout(() => this.importLock.delete(filepath), 500);
        }
      }

      if (written > 0) {
        this.log(`EXPORT: ${written} note(s) written to ${VAULT_ROOT}`);
      }
    } catch (err) {
      this.log(`S1GN4L_L055: export failed — ${err}`);
    }
  }

  // ── Import (MD → DB) ─────────────────────────────────────────────────────

  /** Start chokidar watcher on the vault directory. */
  startWatcher(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(path.join(VAULT_ROOT, '*.md'), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });

    this.watcher.on('change', (filepath: string) => {
      if (this.importLock.has(filepath)) return; // skip export-triggered writes
      this.importFile(filepath);
    });

    this.watcher.on('unlink', (filepath: string) => {
      if (this.importLock.has(filepath)) return;
      this.handleDelete(filepath);
    });

    this.watcher.on('error', (err: unknown) => {
      this.log(`S1GN4L_L055: watcher error — ${err}`);
    });

    this.log(`WATCHER: monitoring ${VAULT_ROOT}`);
  }

  /** Parse and upsert a changed Markdown file into Akashik.db. */
  private importFile(filepath: string): void {
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      const fm = parseMarkdownFrontmatter(content);
      if (!fm) {
        this.log(`S1GN4L_L055: could not parse frontmatter in ${path.basename(filepath)}`);
        return;
      }

      const subject = fm.subject;
      const predicate = fm.predicate;
      const object = stripObsidianLinks(fm.object);

      if (!subject || !predicate || !object) {
        this.log(`S1GN4L_L055: incomplete frontmatter in ${path.basename(filepath)}`);
        return;
      }

      // No unique constraint on (subject_id, predicate) — DELETE then INSERT
      this.db.transaction(() => {
        this.db.prepare(
          'DELETE FROM triplets WHERE subject_id = ? AND predicate = ?'
        ).run(subject, predicate);
        this.db.prepare(
          'INSERT INTO triplets (subject_id, predicate, object_literal, last_updated) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).run(subject, predicate, object);
      })();

      this.log(`IMPORT: ${subject} → ${predicate} → ${object}`);
    } catch (err) {
      this.log(`S1GN4L_L055: import failed for ${path.basename(filepath)} — ${err}`);
    }
  }

  /** Mark a deleted vault file's triplet as purged in the DB. */
  private handleDelete(filepath: string): void {
    try {
      // Extract subject from filename (reverse of sanitizeFilename — best effort)
      const basename = path.basename(filepath, '.md').replace(/_/g, ' ');
      this.db.prepare(
        "UPDATE triplets SET predicate = 'PURGED_' || predicate WHERE subject_id = ?"
      ).run(basename);
      this.log(`PURGE: marked triplets for "${basename}" as purged`);
    } catch (err) {
      this.log(`S1GN4L_L055: delete handler failed — ${err}`);
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Start the sync daemon: initial export + periodic re-export + watcher. */
  start(): void {
    this.log('0B51D14N_5YNC: starting...');
    // Initial full export on boot
    this.exportTriplets();
    // Periodic re-export to catch DB changes from the agentic loop
    this.pollTimer = setInterval(() => this.exportTriplets(), POLL_INTERVAL_MS);
    // File watcher for human edits
    this.startWatcher();
    this.log('0B51D14N_5YNC: running — vault at ' + VAULT_ROOT);
  }

  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
    this.db.close();
    this.log('0B51D14N_5YNC: stopped');
  }

  private log(msg: string): void {
    process.stdout.write(`[VAULT] ${new Date().toISOString()} ${msg}\n`);
  }
}

// ── CLI entry point (run via: tsx src/core/obsidian-sync-service.ts) ──────────

const isMain = process.argv[1]
  ? path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
  : false;

if (isMain) {
  const dbPath = process.env['RKG_PATH'] ?? 'data/Akashik.db';
  const svc = new ObsidianSyncService(dbPath);
  svc.start();

  const shutdown = () => {
    svc.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
