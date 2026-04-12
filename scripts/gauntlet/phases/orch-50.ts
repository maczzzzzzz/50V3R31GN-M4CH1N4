// scripts/gauntlet/phases/orch-50.ts
// Phase 50: CL4W Nucleus Command Deck — Ability Shard

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';

const NUCLEUS_WS_PORT = 3030;
const SPA_DIST        = 'dashboard/cl4w-nucleus/dist';
const NUCLEUS_SCRIPT  = 'dashboard/cl4w-nucleus/package.json';
const SHARD_FILES = [
  'crush/nucleus.go',
  'dashboard/cl4w-nucleus/src/components/CommandDeck.tsx',
  'dashboard/cl4w-nucleus/src/hooks/useFlushGate.ts',
  'dashboard/cl4w-nucleus/src/hooks/useNucleusWS.ts',
];

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 50, phaseName: 'CL4W-Nucleus', block: 'ORCHESTRATION', status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 50, phaseName: 'CL4W-Nucleus', block: 'ORCHESTRATION', status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 50, phaseName: 'CL4W-Nucleus', block: 'ORCHESTRATION', status: 'WARN', message: msg, details };
}

function checkPortOpen(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const sock = net.createConnection({ host: '127.0.0.1', port });
    const timer = setTimeout(() => { sock.destroy(); resolve(false); }, 1500);
    sock.once('connect', () => { clearTimeout(timer); sock.destroy(); resolve(true); });
    sock.once('error',   () => { clearTimeout(timer); resolve(false); });
  });
}

function checkWsEndpoint(): Promise<boolean> {
  return new Promise(resolve => {
    const req = http.get(`http://localhost:${NUCLEUS_WS_PORT}/ws`, (res) => {
      // WS upgrade should return 101 or 400 — either means the server is alive
      resolve(res.statusCode !== undefined);
      res.resume();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => { req.destroy(); resolve(false); });
  });
}

export const phase50: SovereignShard = {
  metadata: { id: 50, name: 'CL4W-Nucleus', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Core source files must exist
    for (const f of SHARD_FILES) {
      if (!existsSync(f)) {
        return fail(`Required file missing: ${f}`, details);
      }
    }
    details['sourceFiles'] = 'PRESENT';

    // 2. Frontend scaffold must exist
    if (!existsSync(NUCLEUS_SCRIPT)) {
      return fail('cl4w-nucleus package.json not found — frontend not scaffolded', details);
    }
    details['frontendScaffold'] = 'PRESENT';

    // 3. SPA dist (optional — not built in CI-only audits)
    details['spaBuilt'] = existsSync(SPA_DIST) ? 'YES' : 'NO (run npm run build)';

    // 4. Check if Nucleus Artery is live on :3030
    const portOpen = await checkPortOpen(NUCLEUS_WS_PORT);
    details['nucleusPort'] = portOpen ? 'OPEN' : 'CLOSED';

    if (!portOpen) {
      return warn(
        'Nucleus Artery not running (expected outside `crush nucleus`)',
        details,
      );
    }

    // 5. Verify WS endpoint responds
    const wsAlive = await checkWsEndpoint();
    details['wsEndpoint'] = wsAlive ? 'RESPONDING' : 'SILENT';

    if (!wsAlive) {
      return warn('Port open but /ws endpoint not responding', details);
    }

    return pass('CL4W Nucleus Artery LIVE | WebSocket endpoint RESPONDING', details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('CL4W-Nucleus manifest: starting Nucleus Artery');
    await ctx.cli.execute(
      `nix develop --impure --command bash -c "cd crush && go run . nucleus >> data/logs/nucleus.log 2>&1 &"`
    ).catch(e => ctx.logger.error('Nucleus Artery start failed', e.message));

    // Allow server to come up
    await new Promise(r => setTimeout(r, 3000));
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    const alive = await checkPortOpen(NUCLEUS_WS_PORT);
    if (!alive) {
      ctx.logger.info('CL4W-Nucleus onDrift: Artery down — restarting');
      await ctx.cli.execute(
        `nix develop --impure --command bash -c "cd crush && go run . nucleus >> data/logs/nucleus.log 2>&1 &"`
      ).catch(() => { /* silent */ });
      await new Promise(r => setTimeout(r, 3000));
    }
  },
};
