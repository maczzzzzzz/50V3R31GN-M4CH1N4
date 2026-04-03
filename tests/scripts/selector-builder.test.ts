import { describe, it, expect } from 'vitest';
import { buildSelector } from '../../scripts/lib/selector-builder.js';

describe('buildSelector', () => {
  it('builds a selector from a single class', () => {
    expect(buildSelector(['cpr-actor'])).toBe('body.vtt .cpr-actor');
  });

  it('builds a selector from multiple classes', () => {
    expect(buildSelector(['actor-sheet', 'character'])).toBe('body.vtt .actor-sheet.character');
  });

  it('returns null for empty classList', () => {
    expect(buildSelector([])).toBeNull();
  });

  it('filters out empty string entries', () => {
    expect(buildSelector(['actor-sheet', '', 'character'])).toBe('body.vtt .actor-sheet.character');
  });

  it('filters out positional/dynamic class names (numbers, svelte hashes)', () => {
    expect(buildSelector(['actor-sheet', 'svelte-abc123', 'character'])).toBe('body.vtt .actor-sheet.character');
  });
});
