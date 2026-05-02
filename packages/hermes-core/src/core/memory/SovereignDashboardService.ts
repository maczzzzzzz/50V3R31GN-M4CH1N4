/**
 * SovereignDashboardService — Phase 90: Obsidian Command-Center
 *
 * Materializes a live "Sovereign Dashboard" note in the OS Obsidian vault,
 * subsuming all previous Logseq UI features. Provides headless persistence by
 * mirroring HeadlessDatalog query state to physical Markdown journal shards.
 *
 * Responsibilities:
 *  1. Dashboard   — writes `data/vault/Sovereign_OS/Sovereign_Dashboard.md`
 *                   on a configurable interval with live DB stats + top facts.
 *  2. Journaling  — engraves daily agent activity to `Journals/YYYY-MM-DD.md`
 *                   in the Obsidian vault (Sovereign Hall meeting-minutes format).
 *  3. Sync Mirror — watches `data/vault/Sovereign_OS/` for external edits and
 *                   ingests changed fact-notes back into os_triplets.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import chokidar, { type FSWatcher } from 'chokidar';
import type { ILogger } from '../../db/interfaces.js';
import { HeadlessDatalog, type ShardResult } from './HeadlessDatalog.js';
import Database from 'better-sqlite3';

// ── Config ────────────────────────────────────────────────────────────────────

export interface DashboardConfig {
  /** Path to SovereignIntelligence.db */
  dbPath: string;
  /** Root of the OS Obsidian vault (WSL path). */
  vaultRoot: string;
  /** Optional Windows mirror path (e.g. D:\Obsidian_Sovereign_OS) */
  windowsMirror?: string;
  /** Dashboard refresh interval in ms. Default: 60_000 (1 min). */
  refreshIntervalMs?: number;
  /** Max triplets displayed in the dashboard fact table. Default: 20. */
  maxDisplayFacts?: number;
}

// ── Journal entry ─────────────────────────────────────────────────────────────

export interface JournalEntry {
  agentId:   string;
  action:    string;
  traceId?:  string;
  outcome?:  'SUCCESS' | 'FAILURE' | 'PENDING';
  payload?:  Record<string, unknown>;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class SovereignDashboardService {
  private readonly cfg: Required<DashboardConfig>;
  private readonly datalog: HeadlessDatalog;
  private readonly db: Database.Database;
  private readonly logger: ILogger | undefined;

  private timer: ReturnType<typeof setInterval> | null = null;
  private watcher: FSWatcher | null = null;
  private importLock = new Set<string>();

  constructor(cfg: DashboardConfig, logger?: ILogger) {
    this.cfg = {
      refreshIntervalMs: 60_000,
      maxDisplayFacts:   20,
      windowsMirror:     undefined as unknown as string,
      ...cfg,
    };
    this.logger = logger;
    this.db = new Database(cfg.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.datalog = new HeadlessDatalog(this.db, logger);

    this.ensureVaultDirs();
  }

  private ensureVaultDirs(): void {
    const dirs = [
      this.cfg.vaultRoot,
      path.join(this.cfg.vaultRoot, 'Journals'),
      path.join(this.cfg.vaultRoot, 'Facts'),
    ];
    for (const d of dirs) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    }
    if (this.cfg.windowsMirror) {
      for (const sub of ['', 'Journals', 'Facts']) {
        const d = path.join(this.cfg.windowsMirror, sub);
        if (!fs.existsSync(d)) {
          try { fs.mkdirSync(d, { recursive: true }); } catch { /* Windows path may not be accessible */ }
        }
      }
    }
  }

  // ── Dashboard materialization ─────────────────────────────────────────────

  /** Render and write the Sovereign_Dashboard.md to the vault. */
  materializeDashboard(): void {
    const now       = new Date().toISOString();
    const stats     = this.datalog.stats();
    const recentFacts = this.getRecentFacts(this.cfg.maxDisplayFacts);

    const factTable = recentFacts.length > 0
      ? [
          '| Subject | Predicate | Object | Updated |',
          '| :--- | :--- | :--- | :--- |',
          ...recentFacts.map(f =>
            `| ${f.subject} | ${f.predicate} | ${f.object} | ${f.updated} |`
          ),
        ].join('\n')
      : '_No facts in store._';

    const content = `---
tags: [sovereign-os, dashboard, auto-generated]
last_sync: "${now}"
triplets: ${stats.triplets}
subjects: ${stats.subjects}
predicates: ${stats.predicates}
---

# ◈ SOVEREIGN DASHBOARD

**Version:** v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS | **Engine:** HeadlessDatalog / SQLite
**Sync:** ${now}

---

## 📊 TRIPLE STORE STATS

| Metric | Value |
| :--- | :--- |
| **Total Triplets** | ${stats.triplets} |
| **Unique Subjects** | ${stats.subjects} |
| **Unique Predicates** | ${stats.predicates} |

---

## 🧠 RECENT FACTS

${factTable}

---

## 🔍 DATALOG QUICK QUERIES

\`\`\`datalog
;; Find all agents
[:find ?name
 :where [?e :is-a "agent"]
        [?e :name ?name]]

;; Find all shored skills
[:find ?skill ?status
 :where [?skill :is-a "skill"]
        [?skill :status ?status]]

;; Find recent decisions
[:find ?id ?verdict
 :where [?id :verdict ?verdict]
        [?id :is-a "decision"]]
\`\`\`

---
*::/5Y573M-N071C3 : DASHBOARD_AUTO_SYNCED. // 50V3R31GN-M4CH1N4*

**LINKS:** [[OS_CORE]] | [[KNOWLEDGE_BASE]]
`;

    this.writeVaultNote('Sovereign_Dashboard.md', content);
    this.logger?.info('SovereignDashboard', randomUUID(), `Dashboard materialized (${stats.triplets} triplets)`);
  }

  /** Query the N most recently updated triplets for dashboard display. */
  private getRecentFacts(limit: number): Array<{ subject: string; predicate: string; object: string; updated: string }> {
    try {
      return this.db.prepare(
        `SELECT subject_id AS subject, predicate, object_literal AS object,
                strftime('%Y-%m-%d %H:%M', last_updated) AS updated
         FROM os_triplets
         ORDER BY last_updated DESC
         LIMIT ?`
      ).all(limit) as Array<{ subject: string; predicate: string; object: string; updated: string }>;
    } catch {
      return [];
    }
  }

  // ── Journaling ─────────────────────────────────────────────────────────────

  /**
   * Engrave a structured journal entry into the daily Obsidian journal shard.
   * Format: `Journals/YYYY-MM-DD.md`
   */
  engraveJournal(entry: JournalEntry): void {
    const today     = new Date().toISOString().slice(0, 10);
    const filePath  = path.join('Journals', `${today}.md`);
    const fullPath  = path.join(this.cfg.vaultRoot, filePath);

    const timestamp = new Date().toISOString();
    const status    = entry.outcome ?? 'PENDING';
    const iconMap   = { SUCCESS: '✅', FAILURE: '❌', PENDING: '🔄' } as const;
    const icon      = iconMap[status as keyof typeof iconMap] ?? '🔄';

    const line = `- ${icon} **[${entry.agentId}]** \`${entry.action}\`` +
      (entry.traceId ? ` | trace: \`${entry.traceId}\`` : '') +
      (entry.payload ? ` | \`${JSON.stringify(entry.payload)}\`` : '') +
      ` _(${timestamp})_\n`;

    // Ensure day header exists
    const header = `---\ntags: [sovereign-os, journal]\ndate: "${today}"\n---\n\n# ◈ JOURNAL :: ${today}\n\n`;

    this.importLock.add(fullPath);
    if (!fs.existsSync(fullPath)) {
      this.writeVaultNote(filePath, header + line);
    } else {
      fs.appendFileSync(fullPath, line, 'utf8');
    }

    // Also upsert the fact into os_triplets for queryability
    this.datalog.upsertFact(
      `journal:${today}:${entry.traceId ?? randomUUID()}`,
      'agent-action',
      `${entry.agentId}:${entry.action}:${status}`,
      { sourceId: 'JOURNAL_ENGRAVER' },
    );
  }

  // ── Vault write helpers ───────────────────────────────────────────────────

  private writeVaultNote(relativePath: string, content: string): void {
    const targets = [path.join(this.cfg.vaultRoot, relativePath)];
    if (this.cfg.windowsMirror) targets.push(path.join(this.cfg.windowsMirror, relativePath));

    for (const p of targets) {
      try {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const existing = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
        if (existing === content) continue;
        this.importLock.add(p);
        fs.writeFileSync(p, content, 'utf8');
      } catch (err) {
        this.logger?.warn('SovereignDashboard', 'write', `Failed to write ${p}: ${err}`);
      }
    }
  }

  // ── Vault watcher (bidirectional sync) ────────────────────────────────────

  /**
   * Watch the Facts/ subfolder for external Obsidian edits and ingest
   * changed notes back into os_triplets.
   *
   * Fact note format (frontmatter):
   *   ---
   *   subject: "MyAgent"
   *   facts:
   *     - predicate: is-a
   *       object: agent
   *   ---
   */
  private startWatcher(): void {
    const factsDir = path.join(this.cfg.vaultRoot, 'Facts');
    this.watcher = chokidar.watch(path.join(factsDir, '**/*.md'), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 1500, pollInterval: 500 },
    });

    this.watcher.on('change', (filePath: string) => {
      if (this.importLock.has(filePath)) { this.importLock.delete(filePath); return; }
      this.ingestFactNote(filePath);
    });
  }

  private ingestFactNote(filePath: string): void {
    try {
      const raw  = fs.readFileSync(filePath, 'utf8');
      const fm   = this.parseFrontmatter(raw);
      if (!fm || !fm.subject) return;

      const facts = fm.facts as Array<{ predicate: string; object: string }> | undefined;
      if (!Array.isArray(facts)) return;

      for (const f of facts) {
        if (f.predicate && f.object) {
          this.datalog.upsertFact(String(fm.subject), f.predicate, f.object, { sourceId: 'VAULT_IMPORT' });
        }
      }
      this.logger?.info('SovereignDashboard', randomUUID(), `Vault import: ${facts.length} facts from ${path.basename(filePath)}`);
    } catch (err) {
      this.logger?.warn('SovereignDashboard', 'ingest', `Fact note ingest failed: ${err}`);
    }
  }

  private parseFrontmatter(content: string): Record<string, unknown> | null {
    const match = /^---\n([\s\S]*?)\n---/.exec(content);
    if (!match) return null;
    // Minimal YAML: parse key: value and nested arrays
    try {
      const lines = match[1]!.split('\n');
      const result: Record<string, unknown> = {};
      let currentKey: string | null = null;
      let currentList: unknown[] | null = null;

      for (const line of lines) {
        const mapMatch = /^(\w[\w-]*):\s*"?([^"]*)"?\s*$/.exec(line);
        const listMatch = /^\s+-\s+(.*)$/.exec(line);
        const subkeyMatch = /^\s+(\w[\w-]*):\s*(.*)$/.exec(line);

        if (mapMatch && !line.startsWith(' ')) {
          if (currentKey && currentList) result[currentKey] = currentList;
          currentList = null;
          if (mapMatch[2]) {
            result[mapMatch[1]!] = mapMatch[2].trim();
          } else {
            currentKey = mapMatch[1]!;
            currentList = [];
            result[currentKey] = currentList;
          }
        } else if (listMatch && currentList !== null) {
          const item: Record<string, string> = {};
          const kv = listMatch[1]!.trim();
          const kvMatch = /^(\w[\w-]*):\s*(.+)$/.exec(kv);
          if (kvMatch) {
            item[kvMatch[1]!] = kvMatch[2]!.trim().replace(/^"(.*)"$/, '$1');
            currentList.push(item);
          }
        } else if (subkeyMatch && currentList !== null && Array.isArray(currentList)) {
          const last = currentList[currentList.length - 1];
          if (last && typeof last === 'object') {
            (last as Record<string, string>)[subkeyMatch[1]!] = subkeyMatch[2]!.trim().replace(/^"(.*)"$/, '$1');
          }
        }
      }
      if (currentKey && currentList) result[currentKey] = currentList;
      return result;
    } catch {
      return null;
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  start(): void {
    this.materializeDashboard();
    this.timer = setInterval(() => this.materializeDashboard(), this.cfg.refreshIntervalMs);
    this.startWatcher();
    this.logger?.info('SovereignDashboard', randomUUID(), '◈ Sovereign Dashboard Service operational');
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.watcher) { void this.watcher.close(); this.watcher = null; }
    this.db.close();
  }
}
