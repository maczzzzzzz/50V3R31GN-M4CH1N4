// scripts/gauntlet/phases/orch-51-1.ts
// Phase 51.1: Declarative Identity — Ability Shard
// Verifies SOUL.md and AGENTS.md are present and match SOVEREIGN_SOUL / SOVEREIGN_AGENTS env vars.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readFileSync } from 'node:fs';

const PHASE_ID   = 511;
const PHASE_NAME = 'Declarative-Identity';
const BLOCK      = 'ORCHESTRATION';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

export const phase511: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Identity files must exist on disk
    if (!existsSync('SOUL.md')) {
      return fail('SOUL.md is absent — shell not entered via `nix develop`?', details);
    }
    if (!existsSync('AGENTS.md')) {
      return fail('AGENTS.md is absent — shell not entered via `nix develop`?', details);
    }
    details['filesOnDisk'] = 'PRESENT';

    // 2. Env vars must be set (only verifiable when launched inside nix develop)
    const envSoul   = process.env['SOVEREIGN_SOUL'];
    const envAgents = process.env['SOVEREIGN_AGENTS'];

    if (!envSoul || !envAgents) {
      return warn(
        'SOVEREIGN_SOUL / SOVEREIGN_AGENTS not in env — run inside `nix develop` for full verification',
        { ...details, envSoul: envSoul ? 'SET' : 'MISSING', envAgents: envAgents ? 'SET' : 'MISSING' },
      );
    }
    details['envVars'] = 'SET';

    // 3. Disk content must match env var content
    const diskSoul   = readFileSync('SOUL.md',   'utf8');
    const diskAgents = readFileSync('AGENTS.md', 'utf8');

    if (diskSoul.trim() !== envSoul.trim()) {
      return fail('SOUL.md on disk does not match SOVEREIGN_SOUL env var — re-run `nix develop`', details);
    }
    if (diskAgents.trim() !== envAgents.trim()) {
      return fail('AGENTS.md on disk does not match SOVEREIGN_AGENTS env var — re-run `nix develop`', details);
    }
    details['contentMatch'] = 'VERIFIED';

    return pass('Identity manifest PRESENT and VERIFIED against Nix-exported env vars', details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Declarative-Identity manifest: re-enter `nix develop` to regenerate SOUL.md and AGENTS.md');
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Declarative-Identity drift detected — SOUL.md / AGENTS.md may be stale');
  },
};
