import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { JournalEntrySchema } from '../../src/shared/schemas/journal.schema.js';

describe('JournalEntrySchema', () => {
  it('parses a real single-page journal (Afterlife Entrance Fee)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Services Of The Afterlife/fvtt-JournalEntry-01.-entrance-fee-sanctuary-and-reputation-yt2ffG5B0uqTKi1z.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.pages.length).toBeGreaterThan(0);
  });

  it('parses a real multi-page journal (Introduction & GM Resources)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Ticket To The Afterlife/Part 0 - Introduction/0. Introduction & GM Resources - START HERE/fvtt-JournalEntry-0.-introduction-and-gm-resources-start-here-AicipeEFVWBWOM1F.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.pages.length).toBe(2);
  });

  it('validates that page text content is a string', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Services Of The Afterlife/fvtt-JournalEntry-01.-entrance-fee-sanctuary-and-reputation-yt2ffG5B0uqTKi1z.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.parse(raw);
    const firstPage = result.pages[0];
    if (firstPage?.text) {
      expect(typeof firstPage.text.content).toBe('string');
      expect(firstPage.text.content.length).toBeGreaterThan(0);
    }
  });

  it('rejects an object missing pages array', () => {
    const invalid = { name: 'Bad Journal' };
    const result = JournalEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
