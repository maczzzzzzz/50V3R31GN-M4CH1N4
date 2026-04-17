/**
 * src/core/ingest/WikiHandler.ts
 * Phase 57: Refactored from scrape-fandom.js — recursive Fandom/MediaWiki scraper.
 *
 * Follows links from the Night City master table, scrapes each district page,
 * converts HTML paragraphs to Markdown chunks, and inserts into chronicle_seeds.
 */

import { JSDOM } from 'jsdom';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { IIngestHandler, IngestResult } from './types.js';
import { semanticHash } from './hash.js';
import { chunkMarkdown, injectContext } from './markdown-chunker.js';

const WIKI_API = 'https://cyberpunk.fandom.com/api.php';
const RATE_LIMIT_MS = 500;

async function fetchWikiMarkdown(pageName: string): Promise<string | null> {
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(pageName)}&format=json&prop=text`;
  try {
    const res = await fetch(url);
    const data = await res.json() as { error?: { info: string }; parse?: { text: { '*': string } } };
    if (data.error) {
      console.error(`  [WikiHandler] API Error for "${pageName}": ${data.error.info}`);
      return null;
    }
    if (!data.parse?.text['*']) return null;

    const dom = new JSDOM(data.parse.text['*']);
    const doc = dom.window.document;

    // Strip nav boxes, references, edit spans
    doc.querySelectorAll('.navbox, .reference, .mw-editsection, sup').forEach(el => el.remove());

    // Convert to rough Markdown: headings + paragraphs
    const parts: string[] = [];
    doc.querySelectorAll('h1,h2,h3,p').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const text = el.textContent?.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim() ?? '';
      if (!text) return;
      if (tag === 'h1') parts.push(`# ${text}`);
      else if (tag === 'h2') parts.push(`## ${text}`);
      else if (tag === 'h3') parts.push(`### ${text}`);
      else if (text.length > 30) parts.push(text);
    });

    return parts.join('\n\n');
  } catch (e) {
    console.error(`  [WikiHandler] Fetch error for "${pageName}": ${(e as Error).message}`);
    return null;
  }
}

async function discoverDistrictPages(): Promise<Map<string, string>> {
  const mainMarkdown = await fetchWikiMarkdown('Night_City');
  if (!mainMarkdown) return new Map();

  // Re-fetch raw HTML to extract district link titles from the distribution table
  const url = `${WIKI_API}?action=parse&page=Night_City&format=json&prop=text`;
  const res = await fetch(url);
  const data = await res.json() as { parse?: { text: { '*': string } } };
  if (!data.parse?.text['*']) return new Map();

  const dom = new JSDOM(data.parse.text['*']);
  const doc = dom.window.document;
  const heading = doc.getElementById('2030s_-_2040s_Distribution');
  const districtLinks = new Map<string, string>();

  if (!heading) {
    console.warn('  [WikiHandler] Could not find 2030s_-_2040s_Distribution heading — scraping all district links from page');
    doc.querySelectorAll('a[title]').forEach(a => {
      const title = a.getAttribute('title') ?? '';
      if (title && !title.includes('edit') && !title.includes('Night City') && !title.includes('Cyberpunk')) {
        districtLinks.set(title, title);
      }
    });
    return districtLinks;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let el: any = heading.parentElement?.nextElementSibling ?? null;
  while (el && !['H2', 'H3'].includes(el.tagName as string)) {
    if ((el.tagName as string) === 'TABLE') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      el.querySelectorAll('a[title]').forEach((a: any) => {
        const title = (a.getAttribute('title') as string | null) ?? '';
        if (title && !title.includes('edit') && !title.includes('Night City') && !title.includes('Cyberpunk')) {
          districtLinks.set(title, title);
        }
      });
    }
    el = el.nextElementSibling;
  }
  return districtLinks;
}

export class WikiHandler implements IIngestHandler {
  readonly name = 'WikiHandler';

  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  canHandle(source: string): boolean {
    return source === 'WIKI' || source.startsWith('https://cyberpunk.fandom.com');
  }

  async run(_source: string): Promise<IngestResult> {
    console.log('::/5Y573M-N071C3 : WikiHandler — initiating recursive district scrape...');

    const stmt = this.db.prepare(`
      INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, district_id, semantic_hash, status)
      VALUES (@id, @title, @content, @source, @category, @era_grounding, @district_id, @semantic_hash, @status)
      ON CONFLICT(semantic_hash) DO NOTHING
    `);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    const districtPages = await discoverDistrictPages();
    console.log(`  >> Discovered ${districtPages.size} district pages`);

    for (const [districtName, pageName] of districtPages.entries()) {
      console.log(`  >> Scraping: ${districtName}`);
      try {
        const markdown = await fetchWikiMarkdown(pageName);
        if (!markdown) { errors++; continue; }

        const chunks = chunkMarkdown(markdown, { maxChunkWords: 300, minChunkWords: 20 });
        const districtId = districtName.toLowerCase().replace(/\s+/g, '-');

        this.db.transaction(() => {
          for (const chunk of chunks) {
            const content = injectContext(chunk);
            const hash = semanticHash(content);
            const result = stmt.run({
              id: randomUUID(),
              title: `${districtName} — ${chunk.heading}`,
              content,
              source: 'WIKI',
              category: '#Historical',
              era_grounding: '2045',
              district_id: districtId,
              semantic_hash: hash,
              status: 'approved',
            });
            if ((result.changes ?? 0) > 0) inserted++;
            else skipped++;
          }
        })();

        await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      } catch (e) {
        console.error(`  [WikiHandler] Error processing ${districtName}: ${(e as Error).message}`);
        errors++;
      }
    }

    console.log(`  >> WikiHandler done: inserted=${inserted} skipped=${skipped} errors=${errors}`);
    return { inserted, skipped, errors, source: 'WIKI' };
  }
}
