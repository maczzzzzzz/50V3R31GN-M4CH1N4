// scripts/gauntlet/phases/motor-cortex.ts
// Phase 44: Bridge Sovereignty — Motor Cortex Ability Shard
// Verifies the SOVEREIGN_BRIDGE WebSocket dispatcher has privileged handlers
// (create_actor, run_script) required for direct world manipulation.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 44, phaseName: 'Motor-Cortex', block: 'ORCHESTRATION', status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 44, phaseName: 'Motor-Cortex', block: 'ORCHESTRATION', status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 44, phaseName: 'Motor-Cortex', block: 'ORCHESTRATION', status: 'WARN', message: msg, details };
}
function skip(msg: string): AuditResult {
  return { phaseId: 44, phaseName: 'Motor-Cortex', block: 'ORCHESTRATION', status: 'SKIP', message: msg };
}

// ── Phase 44: Motor Cortex (Bridge Sovereignty) ───────────────────────────────
export const phase44: SovereignShard = {
  metadata: { id: 44, name: 'Motor-Cortex', block: 'ORCHESTRATION' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip('CDP page unavailable — bridge handlers not verifiable');

    try {
      const bridgeStatus = await ctx.page.evaluate(() => {
        const bridge = (globalThis as unknown as Record<string, unknown>)['SOVEREIGN_BRIDGE'];
        if (!bridge) return { bridgePresent: false };

        const b = bridge as Record<string, unknown>;

        // Check if the bridge has a _dispatch method (routing core)
        const hasDispatch = typeof b['_dispatch'] === 'function';

        // Check handler registry — bridges register as _handlers map or check via duck-type
        const handlers = (b['_handlers'] ?? b['handlers']) as Record<string, unknown> | undefined;
        const hasCreateActor = !!(handlers?.['create_actor'] ?? typeof b['create_actor'] === 'function');
        const hasRunScript = !!(handlers?.['run_script'] ?? typeof b['run_script'] === 'function');
        const hasCreateScene = !!(handlers?.['create_scene'] ?? typeof b['create_scene'] === 'function');

        // Check Socketlib is available (required for GM-level run_script)
        const hasSocketlib = !!(globalThis as unknown as Record<string, unknown>)['socketlib'];

        return {
          bridgePresent: true,
          hasDispatch,
          hasCreateActor,
          hasRunScript,
          hasCreateScene,
          hasSocketlib,
          wsState: (b['ws'] as WebSocket | undefined)?.readyState ?? -1,
        };
      });

      if (!bridgeStatus.bridgePresent) {
        return fail('SOVEREIGN_BRIDGE not present in Foundry global scope');
      }

      const details = bridgeStatus as Record<string, unknown>;

      if (!bridgeStatus.hasCreateActor && !bridgeStatus.hasRunScript) {
        return fail('Motor Cortex handlers NOT registered: create_actor=✗ run_script=✗', details);
      }
      if (!bridgeStatus.hasCreateActor || !bridgeStatus.hasRunScript) {
        return warn(
          `Motor Cortex partial: create_actor=${bridgeStatus.hasCreateActor ? '✓' : '✗'} run_script=${bridgeStatus.hasRunScript ? '✓' : '✗'}`,
          details,
        );
      }
      if (!bridgeStatus.hasSocketlib) {
        return warn('Handlers registered but socketlib absent — run_script may lack GM permissions', details);
      }

      return pass(
        `Motor Cortex ONLINE | create_actor=✓ run_script=✓ socketlib=${bridgeStatus.hasSocketlib ? '✓' : '✗'}`,
        details,
      );
    } catch (e) {
      return fail(`CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Execute a safe test via run_script handler — dry run by default
    if (!ctx.page) return;
    const i = intent as { script?: string; dryRun?: boolean } | null;
    const dryRun = i?.dryRun ?? true;
    const script = i?.script ?? 'return "SOVEREIGN_MOTOR_CORTEX_ACK";';

    if (dryRun) {
      // Just verify bridge is reachable without executing
      await ctx.bridge.runScript(`
        const bridge = window.SOVEREIGN_BRIDGE;
        if (!bridge) throw new Error('SOVEREIGN_BRIDGE absent');
        // Emit a test event without side effects
        if (typeof bridge._sendEvent === 'function') {
          bridge._sendEvent('gauntlet_ping', { ts: Date.now() });
        }
      `).catch(() => { /* non-fatal */ });
    } else {
      // Execute the provided script via bridge run_script handler
      await ctx.bridge.runScript(`
        const bridge = window.SOVEREIGN_BRIDGE;
        if (!bridge || typeof bridge.run_script !== 'function') throw new Error('run_script handler absent');
        bridge.run_script({ script: ${JSON.stringify(script)} });
      `).catch(() => { /* non-fatal */ });
    }
  },

  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
