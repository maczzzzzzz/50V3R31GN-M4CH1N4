import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ItemSchema } from '../../packages/hermes-core/src/shared/schemas/item.schema.js';

describe('ItemSchema', () => {
  it('parses a real gear item (Afterlife Eagle)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Items/fvtt-Item-afterlife-eagle_personal-background-point-ueTVClKghjJ4vxzN.json',
        'utf-8',
      ),
    );
    const result = ItemSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real gear item (Underground Gala Invite)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Items/fvtt-Item-underground-gala-invite-VOFnxBgH9hPlezuT.json',
        'utf-8',
      ),
    );
    const result = ItemSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses an embedded skill item from an actor', () => {
    const actorRaw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- edgerunner npcs -/fvtt-Actor-ariandel,-fleet-footed-AnbbyHGpme70qLSA.json',
        'utf-8',
      ),
    );
    const skillItem = actorRaw.items[0];
    const result = ItemSchema.safeParse(skillItem);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('rejects an object missing name', () => {
    const invalid = { type: 'gear' };
    const result = ItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
