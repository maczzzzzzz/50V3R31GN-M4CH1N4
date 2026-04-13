// scripts/gauntlet/phases/orch-52-1.ts
// Phase 52.1: Soul Capture Audit — Ability Shard
// Verifies data/logs/soul.jsonl exists and contains valid SoulEntry JSON
// with required semantic tags (id, timestamp, decision_type, training_value).

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readFileSync } from 'node:fs';

const PHASE_ID   = 521;
const PHASE_NAME = 'Soul-Capture';
const BLOCK      = 'ORCHESTRATION';
const SOUL_LOG   = 'data/logs/soul.jsonl';
const MIN_ENTRIES = 1;

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

interface SoulEntry {
  id:             string;
  timestamp:      string;
  decision_type:  string;
  content:        string;
  training_value: number;
  meta:           Record<string, unknown>;
}

const REQUIRED_FIELDS: (keyof SoulEntry)[] = ['id', 'timestamp', 'decision_type', 'content', 'training_value', 'meta'];

const VALID_DECISION_TYPES = new Set([
  'narrative', 'oracle_roll', 'governance', 'audit', 'reasoning', 'tool_call', 'strategy',
]);

function validateEntry(obj: Record<string, unknown>): string | null {
  for (const f of REQUIRED_FIELDS) {
    if (!(f in obj)) return `missing field: ${f}`;
  }
  if (typeof obj['training_value'] !== 'number') return 'training_value must be a number';
  const tv = obj['training_value'] as number;
  if (tv < 0 || tv > 1) return `training_value out of range: ${tv}`;
  if (!VALID_DECISION_TYPES.has(obj['decision_type'] as string)) {
    return `unknown decision_type: ${obj['decision_type']}`;
  }
  return null;
}

export const phase521: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Source module must exist
    if (!existsSync('src/core/soul-logger.ts')) {
      return fail('src/core/soul-logger.ts missing', details);
    }
    details['sourceFile'] = 'PRESENT';

    // 2. Soul log existence check (WARN if absent — daemon may not have run yet)
    if (!existsSync(SOUL_LOG)) {
      return warn(`${SOUL_LOG} not found — SoulLogger not yet active in any call path`, details);
    }
    details['logFile'] = 'PRESENT';

    // 3. Parse and validate entries
    const raw = readFileSync(SOUL_LOG, 'utf8').trim();
    const lines = raw.split('\n').filter(Boolean);
    details['totalEntries'] = lines.length;

    if (lines.length < MIN_ENTRIES) {
      return warn(`${SOUL_LOG} has ${lines.length} entries (min ${MIN_ENTRIES})`, details);
    }

    const errors: string[] = [];
    let highValueCount = 0;

    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      try {
        const obj = JSON.parse(lines[i]!) as Record<string, unknown>;
        const err = validateEntry(obj);
        if (err) errors.push(`line ${i + 1}: ${err}`);
        const tv = obj['training_value'] as number;
        if (tv >= 0.6) highValueCount++;
      } catch {
        errors.push(`line ${i + 1}: invalid JSON`);
      }
    }

    if (errors.length > 0) {
      return fail(`Soul log has ${errors.length} invalid entries`, { ...details, errors: errors.slice(0, 5) });
    }

    details['highValueEntries'] = highValueCount;
    details['highValueRatio']   = `${((highValueCount / lines.length) * 100).toFixed(1)}%`;

    return pass(
      `Soul log VALID — ${lines.length} entries, ${highValueCount} high-value (≥0.6)`,
      details,
    );
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Soul-Capture manifest: SoulLogger is passive — it captures via wrap()/capture() calls');
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Soul-Capture drift: soul.jsonl missing or corrupt — check SoulLogger integration');
  },
};
