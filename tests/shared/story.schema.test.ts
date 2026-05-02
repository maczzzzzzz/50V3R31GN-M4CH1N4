// tests/shared/story.schema.test.ts
import { describe, it, expect } from 'vitest';
import { StoryStateSchema } from '../../packages/hermes-core/src/shared/schemas/story.schema.js';

describe('StoryStateSchema', () => {
  it('validates a correct story state', () => {
    const valid = {
      currentArc: 'TttA Part 3 - Back Alley Boogey',
      currentBeat: 'Beat 1: Dustwalker',
      completedBeats: ['Beat 0'],
      worldState: { sprinters_gaff_searched: true },
      eagleBalance: 5,
    };
    const result = StoryStateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects negative eagle balance', () => {
    const invalid = {
      currentArc: 'Arc 1',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: -1,
    };
    const result = StoryStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
