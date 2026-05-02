import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SceneSchema } from '../../packages/hermes-core/src/shared/schemas/scene.schema.js';

describe('SceneSchema', () => {
  it('parses a real environment scene (Afterlife Exterior)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Maps/Afterlife Evergreen/Maps/fvtt-Scene-1.-afterlife-exterior-environment-VCbthP8Ez4uhtdkr.json',
        'utf-8',
      ),
    );
    const result = SceneSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real combat scene with walls and lights (6th Street Shootout)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Maps/Part 1 - Grand Opening/fvtt-Scene-6th-street-shootout-XcdL7EiMCNgtQHHt.json',
        'utf-8',
      ),
    );
    const result = SceneSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.walls.length).toBeGreaterThan(0);
    expect(raw.lights.length).toBeGreaterThan(0);
  });

  it('rejects an object missing required grid', () => {
    const invalid = { name: 'Bad Scene', width: 100, height: 100 };
    const result = SceneSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
