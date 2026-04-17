/**
 * src/core/ingest/SovereignIngestService.ts
 * Phase 57: Polymorphic orchestrator — dispatches source files to specialized handlers.
 *
 * Usage:
 *   nix develop --impure --command tsx src/core/ingest/SovereignIngestService.ts [source...]
 *
 * Sources:
 *   WIKI             — triggers recursive Fandom scrape
 *   /path/to/file.json or dir/  — JsonFoundryHandler
 *   /path/to/file.pdf or dir/   — HifiPdfHandler
 *   /path/to/file.db            — CompendiumDbHandler
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import type { IIngestHandler, IngestResult } from './types.js';
import { WikiHandler } from './WikiHandler.js';
import { JsonFoundryHandler } from './JsonFoundryHandler.js';
import { HifiPdfHandler } from './HifiPdfHandler.js';
import { CompendiumDbHandler } from './CompendiumDbHandler.js';

const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

/** Peek first line of a file to detect NDJSON (FoundryVTT NeDB format). */
function isNdjsonDb(filePath: string): boolean {
  try {
    const buf = Buffer.alloc(256);
    const fh = fs.openSync(filePath, 'r');
    fs.readSync(fh, buf, 0, 256, 0);
    fs.closeSync(fh);
    const firstLine = buf.toString('utf-8').split('\n')[0]?.trim() ?? '';
    return firstLine.startsWith('{');
  } catch { return false; }
}

/** Sniff the dominant file type inside a directory (first match wins). */
function sniffDirType(dirPath: string): 'json' | 'pdf' | 'db' | 'unknown' {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = sniffDirType(`${dirPath}/${entry.name}`);
        if (sub !== 'unknown') return sub;
      } else if (entry.name.endsWith('.json')) return 'json';
      else if (entry.name.toLowerCase().endsWith('.pdf')) return 'pdf';
      else if (entry.name.endsWith('.db') || entry.name.endsWith('.sqlite')) {
        // FoundryVTT NeDB .db files are NDJSON — route to json handler
        const full = `${dirPath}/${entry.name}`;
        return isNdjsonDb(full) ? 'json' : 'db';
      }
    }
  } catch { /* ignore */ }
  return 'unknown';
}

export class SovereignIngestService {
  private readonly db: Database.Database;
  private readonly wikiHandler: WikiHandler;
  private readonly jsonHandler: JsonFoundryHandler;
  private readonly pdfHandler: HifiPdfHandler;
  private readonly dbHandler: CompendiumDbHandler;

  constructor(dbPath: string = DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.wikiHandler = new WikiHandler(this.db);
    this.jsonHandler = new JsonFoundryHandler(this.db);
    this.pdfHandler = new HifiPdfHandler(this.db);
    this.dbHandler = new CompendiumDbHandler(this.db);
  }

  private resolveHandler(source: string): IIngestHandler | null {
    if (source === 'WIKI' || source.startsWith('https://cyberpunk.fandom.com')) return this.wikiHandler;
    if (source.endsWith('.json')) return this.jsonHandler;
    if (source.toLowerCase().endsWith('.pdf')) return this.pdfHandler;
    if (source.endsWith('.db') || source.endsWith('.sqlite') || source.endsWith('.sqlite3')) return this.dbHandler;

    // Directory: sniff content
    if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      const type = sniffDirType(source);
      if (type === 'json') return this.jsonHandler;
      if (type === 'pdf') return this.pdfHandler;
      if (type === 'db') return this.dbHandler;
    }
    return null;
  }

  async ingest(sources: string[]): Promise<void> {
    console.log('::/5Y573M-N071C3 : SovereignIngestService — INITIATING PHASE 57 INGESTION...');
    console.log(`  >> Sources: ${sources.join(', ')}`);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const source of sources) {
      const handler = this.resolveHandler(source);
      if (!handler) {
        console.warn(`  [SovereignIngestService] No handler for source: ${source}`);
        totalErrors++;
        continue;
      }
      console.log(`  >> Dispatching "${source}" → ${handler.name}`);
      try {
        const result = await handler.run(source);
        totalInserted += result.inserted;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
      } catch (e) {
        console.error(`  [SovereignIngestService] Handler ${handler.name} threw: ${(e as Error).message}`);
        totalErrors++;
      }
    }

    this.db.close();

    console.log('\n::/5Y573M-N071C3 : ═══════════════════════════════════════');
    console.log(`::/5Y573M-N071C3 : INGESTION COMPLETE`);
    console.log(`::/5Y573M-N071C3 :   Inserted : ${totalInserted}`);
    console.log(`::/5Y573M-N071C3 :   Skipped  : ${totalSkipped} (dedup)`);
    console.log(`::/5Y573M-N071C3 :   Errors   : ${totalErrors}`);
    console.log('::/5Y573M-N071C3 : ═══════════════════════════════════════');
  }

  close(): void {
    try { this.db.close(); } catch { /* already closed */ }
  }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
if (process.argv[1]?.endsWith('SovereignIngestService.ts') ||
    process.argv[1]?.endsWith('SovereignIngestService.js')) {
  const sources = process.argv.slice(2);
  if (sources.length === 0) {
    console.error('Usage: tsx SovereignIngestService.ts [source...]\n  source: WIKI | path/to/file.json | path/to/dir/ | path/to/file.pdf | path/to/file.db');
    process.exit(1);
  }
  const svc = new SovereignIngestService();
  svc.ingest(sources).catch(err => {
    console.error('❌ FATAL:', err);
    process.exit(1);
  });
}
