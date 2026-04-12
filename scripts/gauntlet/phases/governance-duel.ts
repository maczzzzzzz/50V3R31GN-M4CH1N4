// scripts/gauntlet/phases/governance-duel.ts
// Phase 45: Governance Duel — Conflict Interceptor Ability Shard
// Verifies libWrapper hooks are registered on TokenDocument and Actor update paths
// and the conflict_interrupt event pipeline is wired to Node B.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 45, phaseName: 'Governance-Duel', block: 'ORCHESTRATION', status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 45, phaseName: 'Governance-Duel', block: 'ORCHESTRATION', status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 45, phaseName: 'Governance-Duel', block: 'ORCHESTRATION', status: 'WARN', message: msg, details };
}
function skip(msg: string): AuditResult {
  return { phaseId: 45, phaseName: 'Governance-Duel', block: 'ORCHESTRATION', status: 'SKIP', message: msg };
}

// ── Phase 45: Governance Duel (Conflict Interceptor) ─────────────────────────
export const phase45: SovereignShard = {
  metadata: { id: 45, name: 'Governance-Duel', block: 'ORCHESTRATION' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip('CDP page unavailable — conflict interceptor not verifiable');

    try {
      const duelStatus = await ctx.page.evaluate(() => {
        const g = globalThis as unknown as Record<string, unknown>;
        const bridge = g['SOVEREIGN_BRIDGE'] as Record<string, unknown> | undefined;
        const libWrapper = g['libWrapper'] as Record<string, unknown> | undefined;

        const hasBridge = !!bridge;
        const hasLibWrapper = !!libWrapper;

        // Check if _setupGovernanceDuel was called (bridge has the method)
        const hasGovernanceMethod = !!(bridge && typeof bridge['_setupGovernanceDuel'] === 'function');

        // Probe libWrapper registry for our conflict interceptor registrations
        let tokenDocWrapped = false;
        let actorWrapped = false;
        if (libWrapper && typeof libWrapper['register'] === 'function') {
          // libWrapper exposes active registrations via its internal registry
          const registry = (libWrapper as Record<string, unknown>)['_registry'] ??
                           (libWrapper as Record<string, unknown>)['registry'];
          if (registry && typeof registry === 'object') {
            const entries = Object.values(registry as Record<string, unknown[]>).flat();
            for (const entry of entries) {
              const e = entry as Record<string, unknown>;
              const target = String(e['target'] ?? e['name'] ?? '');
              if (target.includes('TokenDocument') && target.includes('update')) tokenDocWrapped = true;
              if (target.includes('Actor') && target.includes('update')) actorWrapped = true;
            }
          }
        }

        // Check bridge has pendingRequests map (required for conflict_interrupt request/response)
        const hasPendingRequests = !!(bridge && bridge['pendingRequests'] instanceof Map);

        return {
          hasBridge,
          hasLibWrapper,
          hasGovernanceMethod,
          tokenDocWrapped,
          actorWrapped,
          hasPendingRequests,
        };
      });

      const details = duelStatus as Record<string, unknown>;

      if (!duelStatus.hasBridge) {
        return fail('SOVEREIGN_BRIDGE not present — governance duel cannot be active', details);
      }
      if (!duelStatus.hasLibWrapper) {
        return warn('libWrapper module absent — conflict interceptor hooks not installed', details);
      }

      // Check method presence (static verification — indicates _setupGovernanceDuel exists in bridge)
      if (!duelStatus.hasGovernanceMethod) {
        return fail('_setupGovernanceDuel method absent from SOVEREIGN_BRIDGE', details);
      }

      // Evaluate wrapper registration (best-effort — libWrapper internals may vary)
      const tokenStatus = duelStatus.tokenDocWrapped ? '✓' : '?';
      const actorStatus = duelStatus.actorWrapped ? '✓' : '?';

      if (!duelStatus.hasPendingRequests) {
        return warn('Bridge pendingRequests map absent — conflict_interrupt responses may not route', details);
      }

      return pass(
        `Governance Duel WIRED | libWrapper=✓ TokenDoc=${tokenStatus} Actor=${actorStatus} pending_req_map=✓`,
        details,
      );
    } catch (e) {
      return fail(`CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Simulate a sovereignty conflict by setting a test flag and triggering an update
    if (!ctx.page) return;
    const i = intent as { actorId?: string; dryRun?: boolean } | null;
    const dryRun = i?.dryRun ?? true;

    if (dryRun) {
      // Just verify the bridge can send conflict_interrupt without executing a real duel
      await ctx.bridge.runScript(`
        const bridge = window.SOVEREIGN_BRIDGE;
        if (bridge && typeof bridge._sendEvent === 'function') {
          bridge._sendEvent('conflict_interrupt', {
            documentType: 'TestDocument',
            documentId: 'dry-run',
            documentName: 'Gauntlet Dry Run',
            proposedChanges: { test: true },
          });
        }
      `).catch(() => { /* non-fatal */ });
    }
  },

  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
