/**
 * src/core/seed-controller.ts
 *
 * SeedController — Phase 19 Latent Seeding (R00TS Pattern)
 *
 * Manages conceptual seeds that bias NPC narrative generation.
 * Seeds represent weighted mood/atmosphere concepts ("Despair", "Paranoia")
 * scoped to NODESTADT districts. getPromptBias() assembles a compact bias
 * string for injection into Mistral-Nemo's system prompt.
 */

import { randomUUID } from 'node:crypto';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface ConceptualSeed {
  id: string;
  word: string;
  weight: number;
  category: 'mood' | 'faction' | 'event';
  district: string | null;
  vectorJson?: string;
}

export class SeedController {
  constructor(private readonly oracle: UnifiedOracleClient) {}

  /**
   * Upsert a seed by word+district key.
   * If a seed with matching word+district already exists, updates weight and category.
   * Generates a stable id from word+district for idempotency.
   */
  upsertSeed(seed: Omit<ConceptualSeed, 'id'>): string {
    const id = this.stableId(seed.word, seed.district);
    this.oracle.upsertSeed({ ...seed, id });
    return id;
  }

  /**
   * Retrieve the top-N seeds active for a district and format them as a
   * bias string for injection into LLM system prompts.
   *
   * Example output for Watson with high Despair + Paranoia:
   *   "[DISTRICT ATMOSPHERE: Watson] DOMINANT THEMES: Despair (0.90), Paranoia (0.75)"
   *
   * Returns an empty string when no seeds are found.
   *
   * @param district NODESTADT district name, or null for global seeds.
   * @param topN Max number of seeds to include. Defaults to 5.
   */
  getPromptBias(district: string | null, topN = 5): string {
    const seeds = this.oracle.getSeedsForDistrict(district, topN);
    if (seeds.length === 0) return '';

    const scope = district !== null ? `DISTRICT ATMOSPHERE: ${district}` : 'GLOBAL ATMOSPHERE';
    const themes = seeds
      .map((s) => `${s.word} (${s.weight.toFixed(2)})`)
      .join(', ');

    return `[${scope}] DOMINANT THEMES: ${themes}`;
  }

  /**
   * Generate a stable, deterministic id from word + district.
   * Ensures upsert semantics without requiring callers to track ids.
   */
  private stableId(word: string, district: string | null): string {
    // Use first 16 chars of a hash-like string for readability + uniqueness.
    // randomUUID is not deterministic, so we derive from content instead.
    const raw = `${word.toLowerCase()}:${(district ?? 'global').toLowerCase()}`;
    // Simple djb2-style hash → hex string
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
      hash >>>= 0; // keep unsigned 32-bit
    }
    return `seed_${hash.toString(16).padStart(8, '0')}`;
  }
}
