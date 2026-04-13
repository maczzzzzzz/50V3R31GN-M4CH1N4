/**
 * scripts/gauntlet/phases/orch-54-2.ts
 *
 * Phase 54.2: Atlas Forge — Blueprint Engine Layout Connectivity
 *
 * Verifies: all layout presets assemble without errors, connectivity is valid,
 * and the custom 3x3 megabuilding preset places a hub at centre slot (1,1).
 */

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { assemble, renderAscii, LAYOUT_PRESETS } from '../../../scripts/forge/blueprint-engine.js';
import { areCompatible } from '../../../scripts/forge/topology-lib/index.js';
import { getTileById } from '../../../scripts/forge/topology-lib/index.js';

const PHASE_ID   = 542;
const PHASE_NAME = 'Blueprint-Connectivity';
const BLOCK      = 'ATLAS_FORGE';

export const phase54_2: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. At least one preset defined
    if (LAYOUT_PRESETS.length === 0) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'No layout presets defined' };
    }
    details['presetCount'] = LAYOUT_PRESETS.length;

    // 2. All presets assemble without errors
    for (const preset of LAYOUT_PRESETS) {
      const bp = assemble(preset);
      if (!bp.valid) {
        return {
          phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK,
          status: 'FAIL',
          message: `Preset '${preset.id}' failed: ${bp.errors.join('; ')}`,
          details: { ascii: renderAscii(bp) },
        };
      }
      details[`preset_${preset.id}`] = 'VALID';
    }

    // 3. Megabuilding 3x3: centre slot must be hub
    const mb = LAYOUT_PRESETS.find(p => p.id === 'megabuilding-3x3');
    if (!mb) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'megabuilding-3x3 preset missing' };
    }
    const mbBp = assemble(mb);
    const centre = mbBp.grid[1]?.[1];
    if (!centre || centre.tile.id !== 'hub') {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: `Centre slot (1,1) expected hub, got ${centre?.tile.id ?? 'null'}` };
    }
    details['centreSlot'] = 'hub';
    details['ascii_3x3'] = renderAscii(mbBp);

    // 4. Connectivity spot-check: hub(1,1) N-exit must be compatible with gaff(0,1)
    const hub  = getTileById('hub');
    const gaff = getTileById('gaff');
    if (!hub || !gaff || !areCompatible(hub, 'N', gaff)) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'hub(N) ↔ gaff connectivity failed' };
    }
    details['connectivity'] = 'hub(N)↔gaff(S) PASS';

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Blueprint engine assembled ${LAYOUT_PRESETS.length} presets with valid connectivity`,
      details,
    };
  }
};
