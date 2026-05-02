/**
 * aaak-compressor.ts — Phase 34: AAAK Identity Compression
 *
 * Generates the ~170-token "Wake-Up Block" — a compressed identity and mission
 * status string in the AAAK dialect that is sent as a prompt prefix for every
 * narrative turn. When paired with llama-server's KV cache (cache_prompt=true),
 * this block is pre-processed at 0ms latency.
 *
 * The AAAK dialect is a lossless-in-meaning compression scheme:
 *   - Drops articles ("the", "a", "an")
 *   - Uses 1337-speak abbreviations for repeated terms
 *   - Encodes booleans as 1/0
 *   - Timestamps as epoch seconds
 *   - Separates fields with pipe (|) and sections with double-pipe (||)
 *
 * Target: ≤170 tokens (~680 characters). Compression ratio ~4:1 over plaintext.
 */

import type { SovereignProfile } from './interfaces.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AaakIdentity {
  /** Agent designation, e.g. "48L173R473D M1ND v2.0" */
  designation: string;
  /** Current mission / session goal */
  mission: string;
  /** Current Wing name */
  activeWing: string | null;
  /** Current Room name */
  activeRoom: string | null;
  /** Critical facts to keep in working memory (max 5) */
  criticalFacts: string[];
  /** Whether Vesper Shadow Mode is active */
  vesperActive: boolean;
  /** Current threat level: 0=low 1=medium 2=high */
  threatLevel: 0 | 1 | 2;
}

export interface AaakBlock {
  /** The compressed prompt prefix string */
  text: string;
  /** Approximate token count (chars / 4) */
  estimatedTokens: number;
}

// ── Compression helpers ───────────────────────────────────────────────────────

const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or']);

/** Compress a phrase by removing stop words and applying AAAK abbreviations. */
export function compress(text: string): string {
  return text
    .split(/\s+/)
    .filter(w => !STOP_WORDS.has(w.toLowerCase()))
    .join(' ')
    .replace(/faction/gi, 'FCT')
    .replace(/identity/gi, 'ID')
    .replace(/telemetry/gi, 'TLM')
    .replace(/command/gi, 'CMD')
    .replace(/active/gi, 'ACT')
    .replace(/current/gi, 'CUR')
    .replace(/memory/gi, 'MEM')
    .replace(/palace/gi, 'PAL4C3')
    .replace(/sovereign/gi, '50V3R31GN')
    .trim();
}

// ── Compressor ────────────────────────────────────────────────────────────────

/**
 * Compress an AaakIdentity into the ~170-token Wake-Up Block.
 */
export function compressIdentity(identity: AaakIdentity, profile: SovereignProfile = 'SOVEREIGN_OS'): AaakBlock {
  const ts = Math.floor(Date.now() / 1000);

  const mandate = '[MANDATE]Relentless Construction.Zero-Trust.Air-Gap.';

  const sections: string[] = [
    `[SYS:IDENTITY]${compress(identity.designation)}|ts=${ts}`,
    `[M1SSN]${compress(identity.mission)}`,
    `[PAL4C3]${identity.activeWing ? compress(identity.activeWing) : 'NULL'}>${identity.activeRoom ? compress(identity.activeRoom) : 'NULL'}`,
    `[FACTS]${identity.criticalFacts.slice(0, 5).map(compress).join('|') || 'NONE'}`,
    `[ST4T]V35P3R=${identity.vesperActive ? 1 : 0}|THR=${identity.threatLevel}`,
    mandate,
  ];

  const text = sections.join('||');
  const estimatedTokens = Math.ceil(text.length / 4);

  return { text, estimatedTokens };
}

/**
 * Build the full prompt prefix string to inject as the system message prefix.
 * Wraps the AAAK block in a sentinel so the model recognizes identity context.
 */
export function buildPrefixPrompt(block: AaakBlock): string {
  return `<<<AAAK_WAKE_UP>>>\n${block.text}\n<<<END_AAAK>>>\n`;
}

/**
 * Validate that a generated block is within the 170-token budget.
 * Logs a warning if over budget; does not throw.
 */
export function validateBudget(block: AaakBlock, budgetTokens = 170): boolean {
  if (block.estimatedTokens > budgetTokens) {
    process.stderr.write(
      `[AAAK] WARNING: block exceeds ${budgetTokens}-token budget (est. ${block.estimatedTokens} tokens, ${block.text.length} chars)\n`
    );
    return false;
  }
  return true;
}
