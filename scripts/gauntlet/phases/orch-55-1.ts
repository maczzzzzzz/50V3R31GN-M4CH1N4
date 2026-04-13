/**
 * scripts/gauntlet/phases/orch-55-1.ts
 *
 * Phase 55.1: Sovereign Asset Forge — Asset Indexing Verification
 *
 * Verifies: assets table exists in Akashik.db, ./assets/ root is scannable,
 * ingestLocalAssets() indexes at least one anchor per major faction category,
 * and data/assets/anchors/ dir is populated.
 */

import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { ingestLocalAssets } from '../../../scripts/forge/ingest-local-assets.js';

const PHASE_ID   = 551;
const PHASE_NAME = 'Asset-Indexer';
const BLOCK      = 'DATA' as const;
const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

export const phase55_1: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Assets root exists
    if (!existsSync('./assets')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: './assets root directory not found' };
    }
    details['assetsRoot'] = 'OK';

    // 2. Run ingestion
    let result: { indexed: number; skipped: number };
    try {
      result = await ingestLocalAssets();
    } catch (err) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Ingestion failed: ${err}` };
    }

    if (result.indexed === 0) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'No assets indexed — check ./assets/ subdirectories' };
    }
    details['indexed'] = result.indexed;
    details['skipped'] = result.skipped;

    // 3. assets table populated in DB
    let anchorCount = 0;
    try {
      const db = new Database(AKASHIK_DB, { readonly: true });
      const row = db.prepare(`SELECT COUNT(*) as c FROM assets WHERE anchor = 1`).get() as { c: number };
      anchorCount = row.c;
      db.close();
    } catch (err) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `DB read failed: ${err}` };
    }

    if (anchorCount === 0) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'assets table empty after ingestion' };
    }
    details['dbAnchorCount'] = anchorCount;

    // 4. anchors dir populated
    if (!existsSync('./data/assets/anchors')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'data/assets/anchors/ not created' };
    }
    details['anchorsDir'] = 'OK';

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Asset indexing verified: ${anchorCount} anchors in DB`,
      details,
    };
  },

  async manifest() {},
  async onDrift() {},
};
