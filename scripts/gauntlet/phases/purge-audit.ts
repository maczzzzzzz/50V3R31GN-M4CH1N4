// scripts/gauntlet/phases/purge-audit.ts
// Phase 52: Purge Verification — Ability Shard
// Fails if Sovereign Bridge settings are detectable in the Foundry module settings UI via CDP.
// Also performs static analysis of 50v3r31gn-bridge.js for config:true regression.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readFileSync } from 'node:fs';

const PHASE_ID   = 52;
const PHASE_NAME = 'Purge-Verification';
const BLOCK      = 'ORCHESTRATION';
const BRIDGE_JS  = '50v3r31gn-bridge/50v3r31gn-bridge.js';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

export const phase52: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Bridge file must exist
    if (!existsSync(BRIDGE_JS)) {
      return fail(`${BRIDGE_JS} not found`, details);
    }

    // 2. Static analysis: bridge must NOT register any setting with config:true
    const source = readFileSync(BRIDGE_JS, 'utf8');

    // Detect config:true in settings.register blocks (multiline-aware simple check)
    const configTruePattern = /game\.settings\.register\s*\([^)]*config\s*:\s*true/s;
    if (configTruePattern.test(source)) {
      return fail(
        'Bridge registers a setting with config:true — Sovereign Bridge UI still visible in Foundry settings',
        { ...details, regression: 'config:true detected in bridge source' },
      );
    }
    details['staticAnalysis'] = 'PASS — no config:true in settings.register';

    // 3. Static analysis: no registerMenu calls
    if (/game\.settings\.registerMenu\s*\(/.test(source)) {
      return fail('Bridge registers a settings menu — UI elements still present', details);
    }
    details['noSettingsMenu'] = true;

    // 4. CDP verification (if Foundry page is available)
    if (ctx.page) {
      try {
        const uiElements = await ctx.page.evaluate(() => {
          // Check if the Sovereign Bridge module has any visible settings items
          const settingRows = document.querySelectorAll('.form-group label');
          const sovereignRows: string[] = [];
          settingRows.forEach(el => {
            const text = el.textContent?.toLowerCase() ?? '';
            if (text.includes('sovereign') || text.includes('node b') || text.includes('websocket url')) {
              sovereignRows.push(el.textContent?.trim() ?? '');
            }
          });
          return sovereignRows;
        });

        if (uiElements.length > 0) {
          return fail(
            `Sovereign Bridge UI elements still visible via CDP: [${uiElements.join(', ')}]`,
            { ...details, cdpElements: uiElements },
          );
        }
        details['cdpVerification'] = 'CLEAN — no Sovereign Bridge settings in DOM';
      } catch (e) {
        details['cdpVerification'] = `SKIPPED (${(e as Error).message})`;
      }
    } else {
      details['cdpVerification'] = 'SKIPPED (no CDP page available)';
    }

    return pass('Foundry module settings PURGED — no Sovereign Bridge UI elements detected', details);
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> {
    // No manifest action — purge is a static code change, not a runtime operation.
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.error(
      'Purge-Verification drift: Sovereign Bridge settings re-appeared. ' +
      'Check 50v3r31gn-bridge.js for config:true regression.',
    );
  },
};
