import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ActorSchema } from '../../src/shared/schemas/actor.schema.js';

describe('ActorSchema', () => {
  it('parses a real edgerunner NPC actor', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- edgerunner npcs -/fvtt-Actor-ariandel,-fleet-footed-AnbbyHGpme70qLSA.json',
        'utf-8',
      ),
    );
    const result = ActorSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real cover object actor', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- cover -/Thick/fvtt-Actor-thick-bulletproof-glass-fpv7RjrofwVCLlk5.json',
        'utf-8',
      ),
    );
    const result = ActorSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('rejects an object missing required stats', () => {
    const invalid = { name: 'Bad Actor', type: 'character' };
    const result = ActorSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
