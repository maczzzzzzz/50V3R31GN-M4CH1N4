import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RollTableSchema } from '../../src/shared/schemas/roll-table.schema.js';

describe('RollTableSchema', () => {
  it('parses a real bounty employer table', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-1-employers-KirLdfCtBGJiHb8S.json',
        'utf-8',
      ),
    );
    const result = RollTableSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.formula).toBe('1d6');
    expect(raw.results.length).toBe(6);
  });

  it('parses a real bounty jobs table', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-3-jobs-CH0MZZJM7Kyzal9q.json',
        'utf-8',
      ),
    );
    const result = RollTableSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('validates result ranges are tuples of two numbers', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-1-employers-KirLdfCtBGJiHb8S.json',
        'utf-8',
      ),
    );
    const parsed = RollTableSchema.parse(raw);
    for (const result of parsed.results) {
      expect(result.range).toHaveLength(2);
      expect(typeof result.range[0]).toBe('number');
      expect(typeof result.range[1]).toBe('number');
    }
  });

  it('rejects an object missing formula', () => {
    const invalid = { name: 'Bad Table', results: [] };
    const result = RollTableSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
