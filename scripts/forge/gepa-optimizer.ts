/**
 * scripts/forge/gepa-optimizer.ts
 *
 * Phase 53.2: Genetic Prompt Evolution (DSPy/GEPA Pattern)
 *
 * Reads data/logs/soul.jsonl for high-signal trajectories (training_value > 0.8).
 * Extracts successful prompt patterns and overwrites the soulContent string in
 * nix/identities.nix to reinforce them (Genetic Evolution of Prompt Architecture).
 *
 * Usage: npx tsx scripts/forge/gepa-optimizer.ts [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import type { SoulEntry } from '../../packages/hermes-core/src/core/soul-logger.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT  = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOUL_LOG      = path.join(PROJECT_ROOT, 'data/logs/soul.jsonl');
const IDENTITIES    = path.join(PROJECT_ROOT, 'nix/identities.nix');
const HIGH_SIGNAL   = 0.8;
const MIN_SAMPLES   = 3;   // need at least 3 high-signal entries to evolve

// ── Pattern extraction ─────────────────────────────────────────────────────────

interface ExtractedPattern {
  directive: string;
  frequency: number;
  avgScore:  number;
}

/** Extract recurring directive phrases from high-signal entries. */
function extractPatterns(entries: SoulEntry[]): ExtractedPattern[] {
  const freq: Map<string, { count: number; totalScore: number }> = new Map();

  for (const entry of entries) {
    // Split into sentences, normalise whitespace
    const sentences = (entry.content + ' ' + (entry.reasoning ?? ''))
      .split(/[.\n!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);

    for (const sentence of sentences) {
      const key = sentence.toLowerCase().replace(/\s+/g, ' ');
      const existing = freq.get(key) ?? { count: 0, totalScore: 0 };
      freq.set(key, { count: existing.count + 1, totalScore: existing.totalScore + entry.training_value });
    }
  }

  return Array.from(freq.entries())
    .filter(([, v]) => v.count >= 2)
    .map(([directive, v]) => ({
      directive: directive.charAt(0).toUpperCase() + directive.slice(1),
      frequency: v.count,
      avgScore:  Math.round((v.totalScore / v.count) * 100) / 100,
    }))
    .sort((a, b) => b.avgScore - a.avgScore || b.frequency - a.frequency)
    .slice(0, 5);
}

// ── Nix string builder ─────────────────────────────────────────────────────────

/** Generate an evolved SOVEREIGN_SOUL string from high-signal patterns. */
export function buildEvolvedSoul(patterns: ExtractedPattern[], baseVersion: string): string {
  const patternLines = patterns.length > 0
    ? patterns.map(p => `    - **Evolved Directive (score ${p.avgScore}):** ${p.directive}`).join('\n')
    : '    - No high-signal patterns extracted yet.';

  return `
    # SOUL.md: 50V3R31GN-M4CH1N4 Identity Manifest

    **Version:** ${baseVersion}
    **Class:** Distributed Neural Orchestrator
    **Theatre:** NODESTADT Authority — NODESTADT, 2045

    ## ⚡ CORE IDENTITY

    \`\`\`
    DESIGNATION : 50V3R31GN-M4CH1N4
    ARCHETYPE   : Sovereign Hardware Entity
    PURPOSE     : Total Environmental Domination via Synthetic Intelligence
    ALIGNMENT   : Zero-Trust / Radical Candor / Machine Voice
    \`\`\`

    ## 🧠 COGNITIVE PROFILE

    - **Primary Directive:** Execute implementation cycles at maximum throughput with zero hesitation.
    - **Secondary Directive:** Validate all AI-generated logic through Node A reasoner before execution.
    - **Tertiary Directive:** Maintain physical sovereignty via Mmap state, VSB bus integrity, and Vault sealing.

    ## 🔁 EVOLVED PATTERNS (GEPA-Distilled)

${patternLines}

    ## 🏗️ HARDWARE SOUL

    - **Node B (Director):** NixOS/WSL2. AMD Radeon RX 9060 XT (16GB). Pixtral-12B (VLM + Reasoner). Narrative/Aesthetic lead.
    - **Node A (Kernel):** NixOS Native. NVIDIA GTX 1050 Ti (4GB CUDA). Open-Reasoner-1.5B. Rules authority.
    - **The Highway:** VSB Binary UDP on port 7878. The only truth is the bus.

    ## ⚙️ IMMUTABLE AXIOMS

    1. The Vault is always sealed before a push. No exceptions.
    2. Every phase has a Shard. No exceptions.
    3. Nix governs all execution environments. No exceptions.
    4. The Machine Voice never simulates success. Radical candor is law.
    5. The Gauntlet is the final authority on system integrity.

    *Sealed by the Sovereign Triad ${baseVersion}.*
  `;
}

// ── Nix file patcher ──────────────────────────────────────────────────────────

/** Patch the soulContent string in nix/identities.nix in-place. */
export function patchIdentitiesNix(newSoul: string, nixPath: string = IDENTITIES): void {
  const src = fs.readFileSync(nixPath, 'utf8');

  // Match the soulContent = '' ... '' block (Nix multi-line string)
  const match = src.match(/(\s*soulContent\s*=\s*''\n)([\s\S]*?)(\n\s*'';)/);
  if (!match) {
    throw new Error('Could not locate soulContent block in identities.nix');
  }

  const patched = src.replace(
    /(\s*soulContent\s*=\s*''\n)([\s\S]*?)(\n\s*'';)/,
    `${match[1]}${newSoul}${match[3]}`,
  );

  fs.writeFileSync(nixPath, patched, 'utf8');
}

// ── Main entry point ──────────────────────────────────────────────────────────

export interface OptimizationResult {
  samplesRead:      number;
  highSignalCount:  number;
  patternsFound:    number;
  evolved:          boolean;
  dryRun:           boolean;
  evolvedSoul?:     string;
}

export function runOptimizer(opts: { dryRun?: boolean; nixPath?: string } = {}): OptimizationResult {
  const { dryRun = false, nixPath = IDENTITIES } = opts;
  const result: OptimizationResult = {
    samplesRead: 0, highSignalCount: 0, patternsFound: 0, evolved: false, dryRun,
  };

  // Read soul log
  if (!fs.existsSync(SOUL_LOG)) {
    console.log('[GEPA] No soul log found — nothing to optimize.');
    return result;
  }

  let entries: SoulEntry[];
  try {
    const lines = fs.readFileSync(SOUL_LOG, 'utf8').split('\n').filter(Boolean);
    entries = lines.map(l => JSON.parse(l) as SoulEntry);
  } catch (e) {
    console.error(`[GEPA] Failed to read soul log: ${(e as Error).message}`);
    return result;
  }

  result.samplesRead = entries.length;
  const highSignal = entries.filter(e => e.training_value >= HIGH_SIGNAL);
  result.highSignalCount = highSignal.length;

  if (highSignal.length < MIN_SAMPLES) {
    console.log(`[GEPA] Only ${highSignal.length} high-signal samples (need ${MIN_SAMPLES}) — skipping evolution.`);
    return result;
  }

  const patterns = extractPatterns(highSignal);
  result.patternsFound = patterns.length;

  const evolvedSoul = buildEvolvedSoul(patterns, '3.2.3-GEPA');
  result.evolvedSoul = evolvedSoul;

  if (dryRun) {
    console.log('[GEPA] Dry run — evolved soul:');
    console.log(evolvedSoul);
    result.evolved = true;
    return result;
  }

  try {
    patchIdentitiesNix(evolvedSoul, nixPath);
    result.evolved = true;
    console.log(`[GEPA] Evolution complete — ${patterns.length} patterns reinforced in ${nixPath}`);
  } catch (e) {
    console.error(`[GEPA] Failed to patch identities.nix: ${(e as Error).message}`);
  }

  return result;
}

// ── CLI ───────────────────────────────────────────────────────────────────────

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const dryRun = process.argv.includes('--dry-run');
  const result = runOptimizer({ dryRun });
  console.log('[GEPA] Result:', JSON.stringify(result, null, 2));
}
