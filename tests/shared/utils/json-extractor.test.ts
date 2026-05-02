import { describe, expect, it } from 'vitest';
import { extractJsonObject } from '../../../packages/hermes-core/src/shared/utils/json-extractor.js';

describe('extractJsonObject', () => {
  it('should find JSON amidst LLM fluff', () => {
    const fluff = 'Sure! Here is the data: {"key": "value"} Hope this helps!';
    expect(extractJsonObject(fluff)).toEqual({ key: 'value' });
  });

  it('should return null for invalid strings', () => {
    expect(extractJsonObject('no json here')).toBeNull();
  });
});
