// scripts/gauntlet/phases/orch-48.ts
// Phase 48: Sovereign Triad MCP Bridge — Ability Shard

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOCKET_PATH  = path.join(PROJECT_ROOT, '.gemini/tmp/sovereign-mcp.sock');
const PID_PATH     = path.join(PROJECT_ROOT, '.gemini/tmp/mcp-bridge.pid');

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 48, phaseName: 'Sovereign-Triad-MCP', block: 'ORCHESTRATION', status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 48, phaseName: 'Sovereign-Triad-MCP', block: 'ORCHESTRATION', status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: 48, phaseName: 'Sovereign-Triad-MCP', block: 'ORCHESTRATION', status: 'WARN', message: msg, details };
}

async function checkSocket(): Promise<boolean> {
  return new Promise(resolve => {
    const sock = net.createConnection(SOCKET_PATH);
    const timer = setTimeout(() => { sock.destroy(); resolve(false); }, 2000);
    sock.once('connect', () => { clearTimeout(timer); sock.destroy(); resolve(true); });
    sock.once('error',   () => { clearTimeout(timer); resolve(false); });
  });
}

export const phase48: SovereignShard = {
  metadata: { id: 48, name: 'Sovereign-Triad-MCP', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Daemon script must exist
    if (!existsSync('scripts/dev/mcp-daemon.ts')) {
      return fail('mcp-daemon.ts not found at scripts/dev/mcp-daemon.ts');
    }
    details['daemonScript'] = 'PRESENT';

    // 2. flake.nix must export NIXPKGS_ALLOW_UNFREE
    try {
      const flake = readFileSync('flake.nix', 'utf8');
      if (!flake.includes('NIXPKGS_ALLOW_UNFREE')) {
        return fail('flake.nix shellHook missing NIXPKGS_ALLOW_UNFREE=1 export');
      }
      details['nixpkgsAllowUnfree'] = 'PRESENT';
    } catch {
      return fail('flake.nix not readable');
    }

    // 3. flake.nix must reference the mcp-daemon
    try {
      const flake = readFileSync('flake.nix', 'utf8');
      if (!flake.includes('mcp-daemon.ts')) {
        return warn('flake.nix shellHook does not reference mcp-daemon.ts — daemon may not auto-start', details);
      }
      details['shellHookDaemon'] = 'WIRED';
    } catch { /* already caught above */ }

    // 4. Check if socket is live (daemon running)
    if (existsSync(SOCKET_PATH)) {
      const alive = await checkSocket();
      details['socketPath'] = SOCKET_PATH;
      details['socketAlive'] = alive;
      if (!alive) {
        return warn('Socket exists but daemon not responding — may be stale', details);
      }
      // Check PID
      if (existsSync(PID_PATH)) {
        details['pidFile'] = 'PRESENT';
      }
      return pass('MCP Bridge socket LIVE | daemon operational', details);
    }

    // Socket absent — daemon not started (expected outside nix develop)
    details['socketAlive'] = false;
    return warn('MCP socket not present — daemon starts automatically via nix develop', details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Sovereign-Triad-MCP manifest: starting MCP daemon');
    // Start daemon in background via CLI
    await ctx.cli.execute(
      `mkdir -p .gemini/tmp data/logs && npx tsx scripts/dev/mcp-daemon.ts >> data/logs/mcp-bridge.log 2>&1 &`
    ).catch(e => {
      ctx.logger.error('MCP daemon start failed', e.message);
    });
    // Give it a moment then run connection test
    await new Promise(r => setTimeout(r, 2000));
    await ctx.cli.execute('npx tsx scripts/dev/test-mcp-connection.ts').catch(() => { /* best-effort */ });
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    // Restart daemon if socket is dead
    const alive = existsSync(SOCKET_PATH) && await checkSocket();
    if (!alive) {
      ctx.logger.info('Sovereign-Triad-MCP onDrift: restarting daemon');
      await ctx.cli.execute(
        `mkdir -p .gemini/tmp data/logs && npx tsx scripts/dev/mcp-daemon.ts >> data/logs/mcp-bridge.log 2>&1 &`
      ).catch(() => { /* silent */ });
    }
  },
};
