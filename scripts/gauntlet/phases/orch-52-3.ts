// scripts/gauntlet/phases/orch-52-3.ts
// Phase 52.3: Shard Forge Audit — Ability Shard
// Verifies skill-factory.ts can autonomously generate a valid SKILL.md
// from a synthetic log fixture. Tests cycle detection and proposal output.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { execSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const PHASE_ID   = 523;
const PHASE_NAME = 'Shard-Forge';
const BLOCK      = 'ORCHESTRATION';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}

// ── Synthetic log fixture ─────────────────────────────────────────────────────
// Two complete R→S→E cycles with the same research key to trip the threshold.

function makeSyntheticLog(): string {
  const ts = new Date().toISOString();
  const entries = [
    // Cycle 1
    { time: ts, level: 'INFO', msg: 'Searching codebase for infiltration scanner patterns' },
    { time: ts, level: 'INFO', msg: 'Planning: will implement infiltration-scanner in 3 steps' },
    { time: ts, level: 'INFO', msg: 'Completed: infiltration scanner committed to master' },
    // Cycle 2 (same research key → count=2 → triggers factory)
    { time: ts, level: 'INFO', msg: 'Searching codebase for infiltration scanner patterns' },
    { time: ts, level: 'INFO', msg: 'Strategy: designing infiltration scanner architecture' },
    { time: ts, level: 'INFO', msg: 'Success: all gauntlet shards pass for infiltration scanner' },
  ];
  return entries.map(e => JSON.stringify(e)).join('\n');
}

export const phase523: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Source files must exist
    if (!existsSync('scripts/forge/skill-factory.ts')) {
      return fail('scripts/forge/skill-factory.ts missing', details);
    }
    details['sourceFile'] = 'PRESENT';

    // 2. Create a temp workspace for the dry-run test
    const tmpDir    = mkdtempSync(path.join(os.tmpdir(), 'shard-forge-'));
    const tmpSkills = path.join(tmpDir, 'skills');

    try {
      mkdirSync(tmpDir, { recursive: true });
      mkdirSync(path.join(tmpDir, '.crush', 'logs'), { recursive: true });
      mkdirSync(tmpSkills, { recursive: true });
      writeFileSync(path.join(tmpDir, '.crush', 'logs', 'crush.log'), makeSyntheticLog());

      // 3. Run skill-factory in --once mode against the temp workspace
      const result = execSync(
        `PROJECT_ROOT="${tmpDir}" node --import tsx/esm scripts/forge/skill-factory.ts --once --dry-run 2>&1`,
        { encoding: 'utf8', timeout: 15_000, stdio: 'pipe' },
      );
      details['factoryOutput'] = result.trim().slice(0, 300);

      // 4. Check for PROPOSED line in output (dry-run prints instead of writing)
      const proposed = result.includes('[DRY-RUN] Would write:') || result.includes('PROPOSED:');
      if (!proposed) {
        // Check if threshold wasn't met — WARN rather than FAIL
        if (result.includes('0 proposals generated')) {
          details['factoryOutput'] = result.trim();
          return fail('Skill Factory generated 0 proposals from synthetic log — cycle detection broken', details);
        }
        return fail('Skill Factory output did not contain expected proposal line', details);
      }

      details['proposalDetected'] = true;
      details['patternsDetected'] = (result.match(/Scan complete.*?(\d+) patterns/)?.[1] ?? 'unknown');

      return pass(
        'Skill Factory correctly generated shard proposal from synthetic R→S→E cycles',
        details,
      );
    } catch (e) {
      return fail(`Skill Factory execution error: ${(e as Error).message}`, details);
    } finally {
      // Cleanup temp dir
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Shard-Forge manifest: run `npx tsx scripts/forge/skill-factory.ts --once` to scan current logs');
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Shard-Forge drift: skill-factory.ts may have regressed — review cycle detection patterns');
  },
};

