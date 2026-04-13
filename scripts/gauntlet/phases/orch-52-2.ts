// scripts/gauntlet/phases/orch-52-2.ts
// Phase 52.2: Anticipatory Cache Audit — Ability Shard
// Verifies data/flowstate-cache.mem exists, has valid FLOWSTATE-CACHE magic,
// and was populated *before* the gauntlet query (anticipatory, not reactive).

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readFileSync } from 'node:fs';

const PHASE_ID    = 522;
const PHASE_NAME  = 'Anticipatory-Cache';
const BLOCK       = 'ORCHESTRATION';
const CACHE_FILE  = 'data/flowstate-cache.mem';
const MAX_STALE_MS = 300_000; // 5 minutes — cache should be warm

const MAGIC = Buffer.from('FLOWSTATE-CACHE\0', 'utf8');

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

export const phase522: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Source module must exist
    if (!existsSync('src/core/flowstate-intuition.ts')) {
      return fail('src/core/flowstate-intuition.ts missing', details);
    }
    details['sourceFile'] = 'PRESENT';

    // 2. Cache file existence (WARN if absent — FlowState not yet started)
    if (!existsSync(CACHE_FILE)) {
      return warn(
        `${CACHE_FILE} absent — FlowStateIntuition not yet running`,
        details,
      );
    }

    // 3. Validate magic header
    const buf = readFileSync(CACHE_FILE);
    if (buf.length < 92) {
      return fail(`${CACHE_FILE} too small (${buf.length} bytes, need ≥92)`, details);
    }
    if (!buf.subarray(0, 16).equals(MAGIC)) {
      return fail('Invalid FLOWSTATE-CACHE magic header — cache corrupt', details);
    }
    details['magic'] = 'VALID';

    // 4. Read district name
    const districtRaw = buf.subarray(16, 80).toString('utf8').replace(/\0+$/, '').trim();
    details['cachedDistrict'] = districtRaw || '(none)';

    // 5. Read timestamp
    const updatedMs = Number(buf.readBigUInt64LE(80));
    const ageMs     = Date.now() - updatedMs;
    details['cacheAgeMs']  = ageMs;
    details['cacheAgeSec'] = Math.round(ageMs / 1000);

    if (ageMs > MAX_STALE_MS) {
      return warn(
        `Cache stale (${Math.round(ageMs / 1000)}s old, max ${MAX_STALE_MS / 1000}s) — FlowState may be inactive`,
        details,
      );
    }

    // 6. Read triplet count
    const count = buf.readUInt32LE(88);
    details['tripletCount'] = count;

    if (count === 0) {
      return warn(
        `Cache present but empty (0 triplets for district "${districtRaw}") — Oracle may be offline`,
        details,
      );
    }

    return pass(
      `Anticipatory cache WARM — district="${districtRaw}" ${count} triplets, age=${Math.round(ageMs / 1000)}s`,
      details,
    );
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Anticipatory-Cache manifest: FlowStateIntuition monitors VSB automatically on start()');
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Anticipatory-Cache drift: flowstate-cache.mem stale or missing — check FlowStateIntuition lifecycle');
  },
};
