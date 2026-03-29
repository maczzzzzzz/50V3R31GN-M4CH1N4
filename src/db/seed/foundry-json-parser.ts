import fs from 'node:fs/promises';
import path from 'node:path';
import type { IDocumentParser, RawChunk } from './interfaces.js';
import type { Namespace } from '../../shared/types/index.js';

// ── Foundry document type discriminator shapes ────────────────────────────────

interface FoundryJournalPage {
  name: string;
  type: string;
  text?: { content?: string };
}

interface FoundryJournalEntry {
  name: string;
  pages: FoundryJournalPage[];
}

interface FoundryRollTableResult {
  text: string;
  range: [number, number];
}

interface FoundryRollTable {
  name: string;
  results: FoundryRollTableResult[];
}

interface FoundryActorStats {
  [stat: string]: { value: number };
}

interface FoundryActorDerivedStats {
  hp?: { value: number; max?: number };
  humanity?: { value: number };
}

interface FoundryActorSystem {
  stats?: FoundryActorStats;
  derivedStats?: FoundryActorDerivedStats;
}

interface FoundryActorItem {
  name: string;
  type: string;
  system?: {
    damage?: { value?: string };
    level?: number;
    stat?: string;
    description?: { value?: string };
  };
}

interface FoundryActor {
  name: string;
  type: string;
  system?: FoundryActorSystem;
  items?: FoundryActorItem[];
}

interface FoundryItemSystem {
  description?: { value?: string };
  price?: { market?: number };
  [key: string]: unknown;
}

interface FoundryItem {
  name: string;
  type: string;
  system?: FoundryItemSystem;
}

type FoundryDocument =
  | FoundryJournalEntry
  | FoundryRollTable
  | FoundryActor
  | FoundryItem;

// ── Parser ───────────────────────────────────────────────────────────────────

/**
 * FoundryJsonParser — parses Foundry VTT JSON exports into RawChunk[].
 *
 * Handles four document types discriminated from the JSON structure:
 *   - JournalEntry  (has `pages` array)
 *   - RollTable     (has `results` array)
 *   - Actor/Mook    (has `type` of 'mook'/'character' + `system.stats`)
 *   - Item/Gear     (has `system.description` without the above)
 */
export class FoundryJsonParser implements IDocumentParser {
  canParse(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.json';
  }

  async parse(filePath: string, namespace: Namespace): Promise<RawChunk[]> {
    let raw: string;
    try {
      raw = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`FoundryJsonParser: failed to read file "${filePath}": ${msg}`);
    }

    let doc: unknown;
    try {
      doc = JSON.parse(raw);
    } catch {
      throw new Error(`FoundryJsonParser: invalid JSON in "${filePath}"`);
    }

    if (!doc || typeof doc !== 'object') {
      throw new Error(`FoundryJsonParser: unexpected non-object JSON in "${filePath}"`);
    }

    const relPath = this.toRelativePath(filePath);
    const contextType = namespace === 'core_rules' ? 'mechanic' : 'lore';
    const capabilityReq = 'none';

    if (isJournalEntry(doc)) return this.parseJournal(doc, relPath, namespace, contextType, capabilityReq);
    if (isRollTable(doc)) return this.parseRollTable(doc, relPath, namespace, contextType, capabilityReq);
    if (isActor(doc)) return this.parseActor(doc, relPath, namespace, contextType, capabilityReq);
    if (isItem(doc)) return this.parseItem(doc, relPath, namespace, contextType, capabilityReq);

    throw new Error(
      `FoundryJsonParser: unrecognized Foundry document structure in "${filePath}". ` +
      `Expected pages[], results[], actor type, or system.description.`
    );
  }

  // ── Document-type parsers ───────────────────────────────────────────────────

  private parseJournal(
    doc: FoundryJournalEntry,
    sourceFile: string,
    namespace: Namespace,
    contextType: 'mechanic' | 'lore',
    capabilityReq: string,
  ): RawChunk[] {
    return doc.pages
      .filter(page => page.type === 'text' && page.text?.content)
      .map(page => ({
        sourceFile,
        sourceRef: `JOURNAL-${doc.name.replace(/\s+/g, '-').toUpperCase()}-${page.name.replace(/\s+/g, '-').toUpperCase()}`,
        namespace,
        contextType,
        capabilityReq,
        sectionHeading: page.name,
        pageStart: 0,
        pageEnd: 0,
        content: stripHtml(page.text!.content!),
      }))
      .filter(chunk => chunk.content.trim().length > 0);
  }

  private parseRollTable(
    doc: FoundryRollTable,
    sourceFile: string,
    namespace: Namespace,
    contextType: 'mechanic' | 'lore',
    capabilityReq: string,
  ): RawChunk[] {
    const lines = doc.results
      .map(r => `[${r.range[0]}-${r.range[1]}] ${r.text.trim()}`)
      .join('\n');

    return [{
      sourceFile,
      sourceRef: `TABLE-${doc.name.replace(/\s+/g, '-').toUpperCase()}`,
      namespace,
      contextType,
      capabilityReq,
      sectionHeading: doc.name,
      pageStart: 0,
      pageEnd: 0,
      content: `Roll Table: ${doc.name}\n\n${lines}`,
    }];
  }

  private parseActor(
    doc: FoundryActor,
    sourceFile: string,
    namespace: Namespace,
    contextType: 'mechanic' | 'lore',
    capabilityReq: string,
  ): RawChunk[] {
    const lines: string[] = [`Actor: ${doc.name} (${doc.type})`];

    // Stats block
    if (doc.system?.stats) {
      const statLine = Object.entries(doc.system.stats)
        .map(([k, v]) => `${k.toUpperCase()}: ${v.value}`)
        .join(' | ');
      lines.push(`Stats: ${statLine}`);
    }

    // Derived stats
    if (doc.system?.derivedStats) {
      const ds = doc.system.derivedStats;
      if (ds.hp) lines.push(`HP: ${ds.hp.value}/${ds.hp.max ?? ds.hp.value}`);
      if (ds.humanity) lines.push(`Humanity: ${ds.humanity.value}`);
    }

    // Weapons
    const weapons = (doc.items ?? []).filter(i => i.type === 'weapon');
    if (weapons.length > 0) {
      lines.push('Weapons: ' + weapons.map(w =>
        `${w.name}${w.system?.damage?.value ? ` (${w.system.damage.value})` : ''}`
      ).join(', '));
    }

    // Skills (only named/leveled skills)
    const skills = (doc.items ?? [])
      .filter(i => i.type === 'skill' && (i.system?.level ?? 0) > 0);
    if (skills.length > 0) {
      lines.push('Skills: ' + skills.map(s =>
        `${s.name} ${s.system?.level ?? 0}`
      ).join(', '));
    }

    return [{
      sourceFile,
      sourceRef: `ACTOR-${doc.name.replace(/\s+/g, '-').toUpperCase()}`,
      namespace,
      contextType,
      capabilityReq,
      sectionHeading: doc.name,
      pageStart: 0,
      pageEnd: 0,
      content: lines.join('\n'),
    }];
  }

  private parseItem(
    doc: FoundryItem,
    sourceFile: string,
    namespace: Namespace,
    contextType: 'mechanic' | 'lore',
    capabilityReq: string,
  ): RawChunk[] {
    const descriptionHtml = doc.system?.description?.value ?? '';
    const description = stripHtml(descriptionHtml);
    const price = doc.system?.price !== undefined
      ? `\nPrice: ${JSON.stringify(doc.system.price)}`
      : '';

    const content = `Item: ${doc.name} (${doc.type})${description ? `\n\n${description}` : ''}${price}`;

    return [{
      sourceFile,
      sourceRef: `ITEM-${doc.name.replace(/\s+/g, '-').toUpperCase()}`,
      namespace,
      contextType,
      capabilityReq,
      sectionHeading: doc.name,
      pageStart: 0,
      pageEnd: 0,
      content: content.trim(),
    }];
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  private toRelativePath(filePath: string): string {
    const marker = 'raw_data';
    const idx = filePath.replace(/\\/g, '/').lastIndexOf(marker);
    return idx === -1 ? path.basename(filePath) : filePath.slice(idx + marker.length + 1).replace(/\\/g, '/');
  }
}

// ── Type guards ───────────────────────────────────────────────────────────────

function isJournalEntry(doc: unknown): doc is FoundryJournalEntry {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'pages' in doc &&
    Array.isArray((doc as Record<string, unknown>)['pages'])
  );
}

function isRollTable(doc: unknown): doc is FoundryRollTable {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    'results' in doc &&
    Array.isArray((doc as Record<string, unknown>)['results'])
  );
}

function isActor(doc: unknown): doc is FoundryActor {
  if (typeof doc !== 'object' || doc === null) return false;
  const d = doc as Record<string, unknown>;
  return (
    typeof d['type'] === 'string' &&
    ['mook', 'character', 'npc'].includes(d['type'])
  );
}

function isItem(doc: unknown): doc is FoundryItem {
  if (typeof doc !== 'object' || doc === null) return false;
  const d = doc as Record<string, unknown>;
  return (
    'name' in d &&
    'type' in d &&
    'system' in d &&
    typeof d['system'] === 'object'
  );
}

// ── HTML stripping ────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and normalizes whitespace.
 * Converts block-level tags to newlines before stripping.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<\/?(h[1-6]|p|div|ul|ol|li|br)[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
