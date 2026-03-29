import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FoundryJsonParser } from '../../../src/db/seed/foundry-json-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal Foundry JSON fixtures
const JOURNAL_JSON = JSON.stringify({
  name: 'Sanctuary In The Afterlife',
  pages: [
    {
      name: 'Page One',
      type: 'text',
      text: {
        content: '<p>This is <strong>important</strong> lore text.</p><h3>Cost</h3><p>1 Eagle per visit.</p>',
      },
    },
    {
      name: 'Page Two',
      type: 'text',
      text: { content: '<p>Second page content with more details.</p>' },
    },
  ],
});

const ROLL_TABLE_JSON = JSON.stringify({
  name: 'Origin/Background',
  results: [
    { text: 'Night City Nobody - an up-and-comer.', range: [1, 1] },
    { text: 'Night City Legend - well established.', range: [2, 2] },
    { text: 'Corporate Affiliate - working the system.', range: [3, 5] },
  ],
});

const ACTOR_JSON = JSON.stringify({
  name: '6th Street Booster',
  type: 'mook',
  system: {
    stats: {
      int: { value: 4 },
      ref: { value: 6 },
      dex: { value: 6 },
      tech: { value: 4 },
      cool: { value: 5 },
      will: { value: 5 },
      luck: { value: 4 },
      move: { value: 4 },
      body: { value: 6 },
      emp: { value: 4 },
    },
    derivedStats: {
      hp: { value: 35, max: 35 },
      humanity: { value: 40 },
    },
  },
  items: [
    { name: 'Medium Pistol', type: 'weapon', system: { damage: { value: '2d6' } } },
    { name: 'Athletics', type: 'skill', system: { level: 4, stat: 'dex' } },
  ],
});

const ITEM_JSON = JSON.stringify({
  name: 'Afterlife Eagle - Personal Background Point',
  type: 'gear',
  system: {
    description: { value: '<p>An Eagle is the currency of the Afterlife bar.</p>' },
    price: { market: 100 },
  },
});

describe('FoundryJsonParser', () => {
  const parser = new FoundryJsonParser();

  describe('canParse', () => {
    it('should accept .json files', () => {
      expect(parser.canParse('some/path/file.json')).toBe(true);
    });

    it('should reject non-json files', () => {
      expect(parser.canParse('file.pdf')).toBe(false);
      expect(parser.canParse('file.txt')).toBe(false);
    });
  });

  describe('journal parsing', () => {
    it('should produce one chunk per page', async () => {
      const tmpPath = createTmpFile(JOURNAL_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks.length).toBe(2);
    });

    it('should strip HTML tags from journal content', async () => {
      const tmpPath = createTmpFile(JOURNAL_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.content).not.toContain('<p>');
      expect(chunks[0]!.content).not.toContain('<strong>');
      expect(chunks[0]!.content).toContain('important');
    });

    it('should use the page name as sectionHeading', async () => {
      const tmpPath = createTmpFile(JOURNAL_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.sectionHeading).toBe('Page One');
    });

    it('should set pageStart and pageEnd to 0 for JSON documents', async () => {
      const tmpPath = createTmpFile(JOURNAL_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.pageStart).toBe(0);
      expect(chunks[0]!.pageEnd).toBe(0);
    });

    it('should assign the correct namespace', async () => {
      const tmpPath = createTmpFile(JOURNAL_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.namespace).toBe('campaign_ttta');
    });
  });

  describe('roll table parsing', () => {
    it('should produce a single chunk for a roll table', async () => {
      const tmpPath = createTmpFile(ROLL_TABLE_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks.length).toBe(1);
    });

    it('should include all result texts in the chunk content', async () => {
      const tmpPath = createTmpFile(ROLL_TABLE_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.content).toContain('Night City Nobody');
      expect(chunks[0]!.content).toContain('Night City Legend');
      expect(chunks[0]!.content).toContain('Corporate Affiliate');
    });

    it('should use the table name as sectionHeading', async () => {
      const tmpPath = createTmpFile(ROLL_TABLE_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.sectionHeading).toBe('Origin/Background');
    });

    it('should include dice range in content', async () => {
      const tmpPath = createTmpFile(ROLL_TABLE_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.content).toContain('[1-1]');
    });
  });

  describe('actor (mook) parsing', () => {
    it('should produce at least one chunk for a mook', async () => {
      const tmpPath = createTmpFile(ACTOR_JSON);
      const chunks = await parser.parse(tmpPath, 'entities_mooks');
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should include the actor name in content', async () => {
      const tmpPath = createTmpFile(ACTOR_JSON);
      const chunks = await parser.parse(tmpPath, 'entities_mooks');
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).toContain('6th Street Booster');
    });

    it('should include stat values in content', async () => {
      const tmpPath = createTmpFile(ACTOR_JSON);
      const chunks = await parser.parse(tmpPath, 'entities_mooks');
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).toMatch(/REF|ref|reflex/i);
    });

    it('should include weapon names in content', async () => {
      const tmpPath = createTmpFile(ACTOR_JSON);
      const chunks = await parser.parse(tmpPath, 'entities_mooks');
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).toContain('Medium Pistol');
    });

    it('should set namespace to entities_mooks', async () => {
      const tmpPath = createTmpFile(ACTOR_JSON);
      const chunks = await parser.parse(tmpPath, 'entities_mooks');
      expect(chunks.every(c => c.namespace === 'entities_mooks')).toBe(true);
    });
  });

  describe('item parsing', () => {
    it('should produce at least one chunk for an item', async () => {
      const tmpPath = createTmpFile(ITEM_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should strip HTML from item description', async () => {
      const tmpPath = createTmpFile(ITEM_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).not.toContain('<p>');
      expect(combined).toContain('currency of the Afterlife');
    });

    it('should use item name as sectionHeading', async () => {
      const tmpPath = createTmpFile(ITEM_JSON);
      const chunks = await parser.parse(tmpPath, 'campaign_ttta');
      expect(chunks[0]!.sectionHeading).toBe('Afterlife Eagle - Personal Background Point');
    });
  });

  describe('error handling', () => {
    it('should throw on non-existent file', async () => {
      await expect(parser.parse('/nonexistent/path.json', 'core_rules')).rejects.toThrow();
    });

    it('should throw on invalid JSON', async () => {
      const tmpPath = createTmpFile('{ invalid json }');
      await expect(parser.parse(tmpPath, 'core_rules')).rejects.toThrow();
    });

    it('should throw on JSON without recognizable Foundry structure', async () => {
      const tmpPath = createTmpFile(JSON.stringify({ someRandomKey: 'value' }));
      await expect(parser.parse(tmpPath, 'core_rules')).rejects.toThrow();
    });
  });
});

// ── Test Helpers ──────────────────────────────────────────────────────────────

import fs from 'node:fs';
import os from 'node:os';

function createTmpFile(content: string): string {
  const tmpFile = path.join(os.tmpdir(), `asp-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(tmpFile, content, 'utf-8');
  return tmpFile;
}
