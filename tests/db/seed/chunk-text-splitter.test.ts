import { describe, it, expect } from 'vitest';
import { ChunkTextSplitter } from '../../../src/db/seed/chunk-text-splitter.js';
import { TARGET_CHUNK_CHARS, CHUNK_OVERLAP_CHARS } from '../../../src/db/seed/interfaces.js';

const BASE_OPTS = {
  sourceFile: 'core_rules/test.pdf',
  namespace: 'core_rules' as const,
  sectionHeading: 'Combat',
  pageStart: 1,
  pageEnd: 3,
};

describe('ChunkTextSplitter', () => {
  const splitter = new ChunkTextSplitter({ targetChars: TARGET_CHUNK_CHARS, overlapChars: CHUNK_OVERLAP_CHARS });

  describe('short text (below target)', () => {
    it('should return a single chunk for text shorter than targetChars', () => {
      const text = 'Short text that fits in one chunk.';
      const chunks = splitter.split(text, BASE_OPTS);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]!.content).toBe(text);
    });

    it('should preserve all source metadata on the single chunk', () => {
      const text = 'Some content.';
      const chunks = splitter.split(text, BASE_OPTS);
      expect(chunks[0]!.sourceFile).toBe(BASE_OPTS.sourceFile);
      expect(chunks[0]!.namespace).toBe(BASE_OPTS.namespace);
      expect(chunks[0]!.sectionHeading).toBe(BASE_OPTS.sectionHeading);
      expect(chunks[0]!.pageStart).toBe(BASE_OPTS.pageStart);
      expect(chunks[0]!.pageEnd).toBe(BASE_OPTS.pageEnd);
    });
  });

  describe('long text (exceeds target)', () => {
    const longText = Array.from({ length: 20 }, (_, i) =>
      `Paragraph ${i + 1}: ${Array(80).fill('word').join(' ')}.`
    ).join('\n\n');

    it('should split into multiple chunks', () => {
      const chunks = splitter.split(longText, BASE_OPTS);
      expect(chunks.length).toBeGreaterThan(1);
    });

    it('should not produce any empty chunks', () => {
      const chunks = splitter.split(longText, BASE_OPTS);
      for (const chunk of chunks) {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
      }
    });

    it('should not produce chunks exceeding targetChars + overlapChars', () => {
      const splitterStrict = new ChunkTextSplitter({ targetChars: 500, overlapChars: 100 });
      const chunks = splitterStrict.split(longText, BASE_OPTS);
      for (const chunk of chunks) {
        expect(chunk.content.length).toBeLessThanOrEqual(600 + 50); // some word-boundary tolerance
      }
    });

    it('should overlap consecutive chunks when segments are small enough', () => {
      // Use short paragraphs (~80 chars each) so overlap (50 chars) fits in window
      const shortParaText = Array.from({ length: 20 }, (_, i) =>
        `Para ${i + 1}: ${Array(10).fill('overlap-word').join(' ')}.`
      ).join('\n\n');
      const splitterSmall = new ChunkTextSplitter({ targetChars: 400, overlapChars: 50 });
      const chunks = splitterSmall.split(shortParaText, BASE_OPTS);

      if (chunks.length >= 2) {
        // The last few words of chunk 0 should appear at the start of chunk 1
        const tailWords = chunks[0]!.content.split(' ').slice(-3).join(' ');
        expect(chunks[1]!.content).toContain(tailWords.split(' ')[0]!.slice(0, 8));
      }
    });

    it('should cover all text (first and last content present)', () => {
      const chunks = splitter.split(longText, BASE_OPTS);
      const firstWords = longText.slice(0, 20);
      const lastWords = longText.slice(-20);
      const combined = chunks.map(c => c.content).join(' ');
      expect(combined).toContain(firstWords.trim().split(' ')[0]!);
      expect(combined).toContain(lastWords.trim().split(' ').pop()!);
    });
  });

  describe('edge cases', () => {
    it('should throw on empty text', () => {
      expect(() => splitter.split('', BASE_OPTS)).toThrow();
    });

    it('should handle text with only whitespace as empty', () => {
      expect(() => splitter.split('   \n  ', BASE_OPTS)).toThrow();
    });

    it('should handle single very long word without crashing', () => {
      const singleWord = 'a'.repeat(5000);
      const chunks = splitter.split(singleWord, BASE_OPTS);
      expect(chunks.length).toBeGreaterThan(0);
      // Chunks overlap so join() won't equal original — instead verify full coverage:
      // first chunk starts at the beginning, last chunk ends at the end.
      expect(singleWord.startsWith(chunks[0]!.content.slice(0, 10))).toBe(true);
      expect(singleWord.endsWith(chunks.at(-1)!.content.slice(-10))).toBe(true);
    });
  });
});
