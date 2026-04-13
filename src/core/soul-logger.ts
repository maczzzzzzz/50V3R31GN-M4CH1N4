/**
 * src/core/soul-logger.ts
 *
 * Phase 52.1: Soul Logger — Icarus Pattern
 *
 * Captures Node B <think> streams and agent decisions. Applies heuristic
 * training_value tagging (0.0–1.0) and writes structured JSONL to
 * data/logs/soul.jsonl for future fine-tuning and identity persistence.
 *
 * Usage: wrap generateNarrative / NitroLogic calls with SoulLogger.capture().
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DecisionType =
  | 'narrative'      // generateNarrative output
  | 'oracle_roll'    // dice / probability decision
  | 'governance'     // governance duel outcome
  | 'audit'          // gauntlet shard result
  | 'reasoning'      // extracted <think> block
  | 'tool_call'      // agent tool invocation
  | 'strategy';      // high-level planning decision

export interface SoulEntry {
  id:             string;
  timestamp:      string;
  decision_type:  DecisionType;
  /** Raw content of the decision or think block */
  content:        string;
  /** Extracted <think>...</think> reasoning if present */
  reasoning?:     string;
  /** Heuristic quality score 0.0–1.0 for future fine-tuning */
  training_value: number;
  /** Optional metadata (district, actor, phase, etc.) */
  meta:           Record<string, unknown>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOUL_LOG     = path.join(PROJECT_ROOT, 'data/logs/soul.jsonl');

// ── Training value heuristics ─────────────────────────────────────────────────
// Higher scores = more "surprising" or high-signal decisions worth learning from.

const HIGH_VALUE_SIGNALS = [
  /critical success/i,
  /critical failure/i,
  /governance.*veto/i,
  /governance.*defer/i,
  /sovereignty.*breach/i,
  /intrusion.*detected/i,
  /black ice/i,
  /soul.*integrity/i,
  /shard.*generated/i,
  /pattern.*detected/i,
];

const LOW_VALUE_SIGNALS = [
  /no response/i,
  /timeout/i,
  /error:/i,
  /fallback/i,
  /skipping/i,
];

function scoreTrainingValue(content: string, reasoning?: string): number {
  const combined = `${content} ${reasoning ?? ''}`;

  // Penalise low-signal entries
  if (LOW_VALUE_SIGNALS.some(r => r.test(combined))) return 0.1;

  let score = 0.4; // baseline

  // Award points for high-signal content
  for (const sig of HIGH_VALUE_SIGNALS) {
    if (sig.test(combined)) score += 0.1;
  }

  // Boost for non-trivial reasoning blocks
  if (reasoning && reasoning.length > 200) score += 0.15;
  if (reasoning && reasoning.length > 500) score += 0.1;

  // Cap at 1.0
  return Math.min(1.0, Math.round(score * 100) / 100);
}

// ── Think-block extractor ─────────────────────────────────────────────────────

function extractThinkBlock(text: string): { reasoning: string | undefined; clean: string } {
  const match = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (!match) return { reasoning: undefined, clean: text };
  return {
    reasoning: match[1]!.trim(),
    clean: text.replace(/<think>[\s\S]*?<\/think>/i, '').trim(),
  };
}

// ── SoulLogger ────────────────────────────────────────────────────────────────

export class SoulLogger {
  private readonly logPath: string;
  private enabled: boolean;

  constructor(logPath: string = SOUL_LOG, enabled = true) {
    this.logPath  = logPath;
    this.enabled  = enabled;
    if (enabled) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }
  }

  /** Enable or disable logging at runtime. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Capture a raw narrative or decision string.
   * Extracts <think> blocks and computes training_value automatically.
   */
  capture(
    content: string,
    decisionType: DecisionType = 'narrative',
    meta: Record<string, unknown> = {},
  ): SoulEntry {
    const { reasoning, clean } = extractThinkBlock(content);
    const training_value = scoreTrainingValue(clean, reasoning);

    const entry: SoulEntry = {
      id:             randomUUID(),
      timestamp:      new Date().toISOString(),
      decision_type:  decisionType,
      content:        clean,
      training_value,
      meta,
      ...(reasoning !== undefined ? { reasoning } : {}),
    };

    if (this.enabled) {
      this.write(entry);
    }

    return entry;
  }

  /**
   * Wrap an async function that returns a string, capturing its output.
   * Usage: const result = await soulLogger.wrap(() => narrativeClient.generateNarrative(...), 'narrative', { district });
   */
  async wrap<T extends string>(
    fn: () => Promise<T>,
    decisionType: DecisionType = 'narrative',
    meta: Record<string, unknown> = {},
  ): Promise<T> {
    const result = await fn();
    this.capture(result, decisionType, meta);
    return result;
  }

  /** Write a pre-constructed entry directly. */
  write(entry: SoulEntry): void {
    if (!this.enabled) return;
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    } catch {
      // Non-fatal — soul logging must never crash the main path
    }
  }

  /**
   * Read the last N entries from the soul log.
   * Returns [] if the log doesn't exist yet.
   */
  readTail(n = 50): SoulEntry[] {
    try {
      const lines = fs.readFileSync(this.logPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .slice(-n);
      return lines.map(l => JSON.parse(l) as SoulEntry);
    } catch {
      return [];
    }
  }

  /**
   * Read entries with training_value >= threshold.
   * Used by the Skill Factory to identify high-signal cycles.
   */
  readHighValue(threshold = 0.6, limit = 100): SoulEntry[] {
    return this.readTail(limit * 4).filter(e => e.training_value >= threshold).slice(-limit);
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────

export const soulLogger = new SoulLogger();
