// scripts/gauntlet/phases/orch-51-3.ts
// Phase 51.3: Sovereign Pulse Integrity — Ability Shard
// Verifies data/logs/vitals.log exists and has been updated within the last 60 seconds.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, statSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const PHASE_ID       = 513;
const PHASE_NAME     = 'Sovereign-Pulse';
const BLOCK          = 'ORCHESTRATION';
const VITALS_LOG     = 'data/logs/vitals.log';
const MAX_STALE_MS   = 90_000;   // 90s — 60s interval + 30s grace

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

export const phase513: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Script must exist
    if (!existsSync('scripts/dev/sovereign-pulse.ts')) {
      return fail('scripts/dev/sovereign-pulse.ts missing', details);
    }
    details['scriptPresent'] = true;

    // 2. Vitals log must exist
    if (!existsSync(VITALS_LOG)) {
      return warn(
        `${VITALS_LOG} not found — sovereign-pulse not yet started`,
        { ...details, vitalLog: 'ABSENT' },
      );
    }
    details['vitalLog'] = 'PRESENT';

    // 3. Log must have been updated within the last 90 seconds
    const stat    = statSync(VITALS_LOG);
    const ageMs   = Date.now() - stat.mtimeMs;
    details['ageMs'] = ageMs;

    if (ageMs > MAX_STALE_MS) {
      return fail(
        `${VITALS_LOG} stale (${Math.round(ageMs / 1000)}s old — max ${MAX_STALE_MS / 1000}s)`,
        details,
      );
    }

    if (ageMs > 75_000) {
      return warn(`${VITALS_LOG} approaching stale threshold (${Math.round(ageMs / 1000)}s)`, details);
    }

    return pass(`Sovereign Pulse ACTIVE — vitals updated ${Math.round(ageMs / 1000)}s ago`, details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Sovereign-Pulse manifest: spawning pulse daemon');
    await execAsync(
      'nix develop --impure --command bash -c "npx tsx scripts/dev/sovereign-pulse.ts >> data/logs/pulse.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Pulse daemon spawn failed', e.message));
    await new Promise(r => setTimeout(r, 3000));
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Sovereign-Pulse drift — restarting daemon');
    try {
      await execAsync("pkill -f 'sovereign-pulse.ts' 2>/dev/null");
    } catch { /* may not be running */ }
    await new Promise(r => setTimeout(r, 500));
    await execAsync(
      'nix develop --impure --command bash -c "npx tsx scripts/dev/sovereign-pulse.ts >> data/logs/pulse.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Pulse daemon restart failed', e.message));
    ctx.logger.info('Pulse daemon restarted');
  },
};
