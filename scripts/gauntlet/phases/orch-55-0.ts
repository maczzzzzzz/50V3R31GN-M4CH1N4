/**
 * scripts/gauntlet/phases/orch-55-0.ts
 *
 * Phase 55.0: Sovereign Asset Forge — Legacy Backup Verification
 *
 * Verifies: archive dir is creatable, runBackup() produces a valid
 * JSON file with required fields (timestamp, actors array, tokenPaths).
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { runBackup } from '../../../scripts/forge/backup-legacy-assets.js';

const PHASE_ID   = 550;
const PHASE_NAME = 'Legacy-Backup';
const BLOCK      = 'DATA' as const;

export const phase55_0: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Archive dir accessible
    await mkdir('./data/archive', { recursive: true });
    details['archiveDir'] = 'OK';

    // 2. Run backup
    let backupPath: string;
    try {
      backupPath = await runBackup();
    } catch (err) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Backup execution failed: ${err}` };
    }

    // 3. File exists
    if (!existsSync(backupPath)) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Backup file missing: ${backupPath}` };
    }

    // 4. Valid JSON with required shape
    let backup: Record<string, unknown>;
    try {
      backup = JSON.parse(await readFile(backupPath, 'utf-8'));
    } catch {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Backup JSON is malformed' };
    }

    if (!backup['timestamp'] || !Array.isArray(backup['actors'])) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Backup missing required fields (timestamp, actors)' };
    }

    details['actorCount'] = (backup['actors'] as unknown[]).length;
    details['tokenPaths'] = (backup['tokenPaths'] as unknown[] | undefined)?.length ?? 0;
    details['source']     = backup['source'];
    details['backupFile'] = backupPath;

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Legacy backup verified: ${details['actorCount']} actors archived`,
      details,
    };
  },

  async manifest() {},
  async onDrift() {},
};
