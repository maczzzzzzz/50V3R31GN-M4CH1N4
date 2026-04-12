/**
 * src/core/linguistic-service.ts
 *
 * Phase 46: Linguistic Drift — Conlang Mutation Propagation
 *
 * Links `_hijackJournal` corruption probabilities to the current sovereignty_depth
 * from system_state. Duel outcomes shift the active dialect:
 *   - Machina dominant (depth > 0.6): authoritative/monolithic dialect
 *   - Balanced (0.4–0.6):             standard leet
 *   - Human dominant (depth < 0.4):   rebellious/fragmented dialect
 */

import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export type DialectMode = 'authoritative' | 'leet' | 'rebellious';

export interface LinguisticState {
  sovereigntyDepth: number;
  dialect: DialectMode;
  corruptionProbability: number;
}

export class LinguisticService {
  constructor(private readonly oracle: UnifiedOracleClient) {}

  /**
   * Compute the current dialect and corruption probability from duel_history
   * via the sovereignty_depth stored in system_state.
   */
  getLinguisticState(): LinguisticState {
    const db = this.oracle.getRawDatabase();

    const row = db.prepare(`SELECT value FROM system_state WHERE key = 'sovereignty_depth'`)
      .get() as { value: string } | undefined;

    const depth = row ? parseFloat(row.value) : 0.5;

    let dialect: DialectMode;
    let corruptionProbability: number;

    if (depth > 0.6) {
      // Machina dominant — monolithic, controlled corruption
      dialect = 'authoritative';
      corruptionProbability = 0.6 + (depth - 0.6) * 0.5; // 0.60 → 0.80
    } else if (depth < 0.4) {
      // Human dominant — rebellious, high-entropy corruption
      dialect = 'rebellious';
      corruptionProbability = 0.5 + (0.4 - depth) * 1.0; // 0.50 → 0.90
    } else {
      // Balanced — standard leet
      dialect = 'leet';
      corruptionProbability = 0.4;
    }

    return { sovereigntyDepth: depth, dialect, corruptionProbability };
  }

  /**
   * Apply linguistic drift to a text string using the current dialect rules.
   * Maps sovereignty_depth → mutation bias applied to journal/overlay text.
   */
  mutateText(text: string): string {
    const { dialect, corruptionProbability } = this.getLinguisticState();

    const leetMap: Record<string, string> = {
      a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '6', b: '8',
    };
    // Authoritative: controlled angular replacements (uppercase + limited leet)
    const authoritativeMap: Record<string, string> = {
      o: '0', e: '3', a: '4', i: '!', s: '$',
    };
    // Rebellious: high-entropy parsel/glitch characters
    const parselChars = '0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\░▒▓█';

    let out = '';
    for (const char of text) {
      const lo = char.toLowerCase();
      const roll = Math.random();

      if (roll > corruptionProbability) {
        out += char;
        continue;
      }

      switch (dialect) {
        case 'authoritative':
          out += authoritativeMap[lo] ?? char.toUpperCase();
          break;
        case 'rebellious':
          out += parselChars[Math.floor(Math.random() * parselChars.length)];
          break;
        case 'leet':
        default:
          out += leetMap[lo] ?? char;
          break;
      }
    }

    return out;
  }
}
