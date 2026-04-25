/**
 * scripts/gauntlet/phases/orch-53-2.ts
 *
 * Phase 53.2: Ouroboros Evolution — Genetic Prompt Audit
 *
 * Verifies the GEPA optimizer can generate a syntactically valid Nix
 * identity string from a high-signal log sample, and that patchIdentitiesNix
 * correctly rewrites the soulContent block.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { buildEvolvedSoul, patchIdentitiesNix } from '../../../scripts/forge/gepa-optimizer.js';

const PHASE_ID   = 532;
const PHASE_NAME = 'Evolution-Verification';
const BLOCK      = 'ORCHESTRATION';

// Minimal valid identities.nix template for patching test
const NIX_FIXTURE = `# test fixture
{ lib }:
let
  soulContent = ''
    # SOUL.md: original content
    Old soul content here.
  '';
  agentsContent = ''
    # AGENTS.md
    Agents here.
  '';
in {
  soul   = soulContent;
  agents = agentsContent;
}
`;

export const phase53_2: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Source file check
    if (!existsSync('scripts/forge/gepa-optimizer.ts')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'GEPA Optimizer source missing' };
    }
    details['sourceFile'] = 'PRESENT';

    // 2. Generate evolved soul from synthetic patterns
    const evolvedSoul = buildEvolvedSoul(
      [
        { directive: 'Execute with zero hesitation and maximum throughput', frequency: 4, avgScore: 0.92 },
        { directive: 'Validate all logic through Node A before execution', frequency: 3, avgScore: 0.88 },
      ],
      '3.2.3-TEST',
    );

    // 3. Validate Nix syntactic requirements
    //    - Must contain the version string
    //    - Must contain GEPA-Distilled section
    //    - Must not contain unescaped '' (Nix string delimiters mid-block)
    if (!evolvedSoul.includes('3.7.0-TEST')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Evolved soul missing version string', details };
    }
    if (!evolvedSoul.includes('GEPA-Distilled')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Evolved soul missing GEPA-Distilled section', details };
    }
    // Nix multi-line strings use '' delimiters — we must not have bare '' inside
    if ((evolvedSoul.match(/''/g) ?? []).length > 0) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Evolved soul contains bare Nix string delimiters (syntax error)', details };
    }
    details['nixSyntax'] = 'VALID';

    // 4. Test patchIdentitiesNix against the fixture
    const tmpDir  = tmpdir();
    const tmpFile = join(tmpDir, `gauntlet-gepa-${randomUUID()}.nix`);
    try {
      writeFileSync(tmpFile, NIX_FIXTURE, 'utf8');
      patchIdentitiesNix(evolvedSoul, tmpFile);
      const patched = readFileSync(tmpFile, 'utf8');

      if (!patched.includes('GEPA-Distilled')) {
        return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Patched nix file missing GEPA content', details };
      }
      if (!patched.includes('agentsContent')) {
        return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Patched nix file corrupted — agentsContent block missing', details };
      }
      details['patchTest'] = 'PASS';
    } catch (e) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Patch failed: ${(e as Error).message}`, details };
    } finally {
      try { unlinkSync(tmpFile); } catch { /* cleanup */ }
    }

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: 'GEPA optimizer produces valid Nix soul string and patches identities.nix correctly',
      details,
    };
  }
};
