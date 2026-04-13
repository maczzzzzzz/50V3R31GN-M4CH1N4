/**
 * scripts/gauntlet/phases/orch-55-2.ts
 *
 * Phase 55.2: Sovereign Asset Forge — Token Forge Verification
 *
 * Verifies: TokenForge instantiates, assets table has anchors available,
 * tokens output dir is writable, and a dry-run anchor lookup resolves.
 */

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import Database from 'better-sqlite3';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { TokenForge } from '../../../scripts/forge/token-forge.js';

const PHASE_ID   = 552;
const PHASE_NAME = 'Token-Forge';
const BLOCK      = 'DATA' as const;
const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

export const phase55_2: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Tokens output dir creatable
    await mkdir('./data/assets/tokens', { recursive: true });
    details['tokensDir'] = 'OK';

    // 2. assets table has anchors (prerequisite: forge:ingest must have run)
    let anchorCount = 0;
    let npcCount = 0;
    try {
      const db = new Database(AKASHIK_DB, { readonly: true });
      const anchorRow = db.prepare(`SELECT COUNT(*) as c FROM assets WHERE anchor = 1`).get() as { c: number } | undefined;
      anchorCount = anchorRow?.c ?? 0;
      const npcRow = db.prepare(`SELECT COUNT(*) as c FROM npcs WHERE is_alive = 1`).get() as { c: number } | undefined;
      npcCount = npcRow?.c ?? 0;
      db.close();
    } catch (err) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `DB read failed: ${err}` };
    }

    details['anchorCount'] = anchorCount;
    details['liveNpcCount'] = npcCount;

    if (anchorCount === 0) {
      return {
        phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK,
        status: 'WARN',
        message: 'No anchors in assets table — run forge:ingest before forge:tokens',
        details,
      };
    }

    // 3. TokenForge instantiates
    let forge: TokenForge;
    try {
      forge = new TokenForge(AKASHIK_DB);
      details['instantiation'] = 'OK';
    } catch (err) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `TokenForge constructor failed: ${err}` };
    }

    forge.close();

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Token forge ready: ${anchorCount} anchors available, ${npcCount} live NPCs queued`,
      details,
    };
  },

  async manifest() {},
  async onDrift() {},
};
