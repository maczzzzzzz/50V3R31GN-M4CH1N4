/**
 * src/core/ingest/HifiPdfHandler.ts
 * Phase 57: High-fidelity PDF extraction.
 *
 * Primary: @opendataloader/pdf (XY-Cut reading order, requires Java).
 * Fallback: pdf-parse (Node-native, no Java required).
 *
 * Both paths feed the same inline MarkdownChunker for semantic splitting
 * with context injection (breadcrumb prepend per spec).
 */

import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';
import { semanticHash } from './hash.js';
import { chunkMarkdown, injectContext } from './markdown-chunker.js';

async function javaAvailable(): Promise<boolean> {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  try {
    await promisify(execFile)('java', ['-version']);
    return true;
  } catch {
    return false;
  }
}

async function extractWithOpendataloader(filePath: string, tmpDir: string): Promise<string | null> {
  const { convert } = await import('@opendataloader/pdf');
  await convert(filePath, {
    outputDir: tmpDir,
    format: 'markdown',
    readingOrder: 'xycut',
    useStructTree: true,
    imageOutput: 'off',
    quiet: true,
  });
  const mdFile = path.join(tmpDir, path.basename(filePath, '.pdf') + '.md');
  return fs.readFile(mdFile, 'utf-8').catch(() => null);
}

async function extractWithPdfParse(filePath: string): Promise<string> {
  // pdf-parse is a CJS module; dynamic import handles ESM interop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as any)).default as
    (buf: Buffer, opts?: Record<string, unknown>) => Promise<{ text: string }>;

  const buf = await fs.readFile(filePath);
  const { text } = await pdfParse(buf);
  // Produce rough Markdown — section boundaries heuristically from ALL-CAPS lines or blank-line-delimited blocks
  const lines = text.split('\n');
  const mdLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { mdLines.push(''); continue; }
    // Heuristic: short ALL-CAPS lines (≤80 chars) → H2 heading
    if (trimmed.length <= 80 && trimmed === trimmed.toUpperCase() && /[A-Z]{3}/.test(trimmed)) {
      mdLines.push(`## ${trimmed}`);
    } else {
      mdLines.push(trimmed);
    }
  }
  return mdLines.join('\n');
}

export class HifiPdfHandler implements IIngestHandler {
  readonly name = 'HifiPdfHandler';
  private readonly db: Database.Database;
  private javaOk: boolean | null = null;

  constructor(db: Database.Database) {
    this.db = db;
  }

  canHandle(_source: string): boolean {
    // Routing is handled by SovereignIngestService via sniffDirType
    return false;
  }

  async run(source: string): Promise<IngestResult> {
    console.log(`::/5Y573M-N071C3 : HifiPdfHandler — processing: ${source}`);

    if (this.javaOk === null) {
      this.javaOk = await javaAvailable();
      console.log(`  >> PDF backend: ${this.javaOk ? '@opendataloader/pdf (XY-Cut)' : 'pdf-parse (fallback)'}`);
    }

    const files = await this.#resolvePdfs(source);
    if (files.length === 0) {
      console.warn(`  [HifiPdfHandler] No PDF files found at: ${source}`);
      return { inserted: 0, skipped: 0, errors: 0, source: 'PDF' };
    }
    console.log(`  >> Found ${files.length} PDF file(s)`);

    const stmt = this.db.prepare(`
      INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, district_id, semantic_hash, status)
      VALUES (@id, @title, @content, @source, @category, @era_grounding, @district_id, @semantic_hash, @status)
      ON CONFLICT(semantic_hash) DO NOTHING
    `);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
      const tmpDir = this.javaOk
        ? await fs.mkdtemp(path.join(os.tmpdir(), 'sovereign-pdf-'))
        : null;
      try {
        let markdown: string | null = null;

        if (this.javaOk && tmpDir) {
          markdown = await extractWithOpendataloader(file, tmpDir);
          if (!markdown) {
            console.warn(`  [HifiPdfHandler] opendataloader produced no output, falling back: ${path.basename(file)}`);
            markdown = await extractWithPdfParse(file);
          }
        } else {
          markdown = await extractWithPdfParse(file);
        }

        if (!markdown?.trim()) {
          console.warn(`  [HifiPdfHandler] Empty extraction: ${path.basename(file)}`);
          errors++;
          continue;
        }

        const baseName = path.basename(file, '.pdf');
        const chunks = chunkMarkdown(markdown, { maxChunkWords: 300, minChunkWords: 20 });

        if (chunks.length === 0) {
          // No header structure — insert whole text as single chunk
          const content = markdown.slice(0, 8000); // cap at ~8k chars
          const hash = semanticHash(content);
          const result = stmt.run({
            id: randomUUID(),
            title: baseName,
            content,
            source: 'PDF',
            category: '#Technical',
            era_grounding: '2045',
            district_id: null,
            semantic_hash: hash,
            status: 'pending',
          });
          if ((result.changes ?? 0) > 0) inserted++;
          else skipped++;
        } else {
          this.db.transaction(() => {
            for (const chunk of chunks) {
              const content = injectContext(chunk);
              const hash = semanticHash(content);
              const result = stmt.run({
                id: randomUUID(),
                title: `${baseName} — ${chunk.heading}`,
                content,
                source: 'PDF',
                category: '#Technical',
                era_grounding: '2045',
                district_id: null,
                semantic_hash: hash,
                status: 'pending',
              });
              if ((result.changes ?? 0) > 0) inserted++;
              else skipped++;
            }
          })();
        }

        console.log(`  >> ${baseName}: ${chunks.length || 1} chunks extracted`);
      } catch (e) {
        console.error(`  [HifiPdfHandler] Error: ${path.basename(file)}: ${(e as Error).message}`);
        errors++;
      } finally {
        if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
      }
    }

    // suppress unused import warning (createHash imported from hash.ts instead)
    void createHash;

    console.log(`  >> HifiPdfHandler done: inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { inserted, skipped, errors, source: 'PDF' };
  }

  async #resolvePdfs(source: string): Promise<string[]> {
    const stat = await fs.stat(source).catch(() => null);
    if (!stat) return [];
    if (stat.isDirectory()) {
      const entries = await fs.readdir(source, { withFileTypes: true });
      const files: string[] = [];
      for (const e of entries) {
        if (!e.isDirectory() && e.name.toLowerCase().endsWith('.pdf') && !e.name.includes(':Zone.Identifier')) {
          files.push(path.join(source, e.name));
        } else if (e.isDirectory()) {
          // Recurse one level for dlcs/ subdirectory
          const sub = await fs.readdir(path.join(source, e.name), { withFileTypes: true });
          for (const s of sub) {
            if (!s.isDirectory() && s.name.toLowerCase().endsWith('.pdf') && !s.name.includes(':Zone.Identifier')) {
              files.push(path.join(source, e.name, s.name));
            }
          }
        }
      }
      return files;
    }
    return source.toLowerCase().endsWith('.pdf') ? [source] : [];
  }
}
