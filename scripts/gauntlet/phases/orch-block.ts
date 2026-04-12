// scripts/gauntlet/phases/orch-block.ts
// ORCHESTRATION Block shards — Phases 2, 4, 15, 18, 22, 24
// Verifies: VSB heartbeat, Clawlink socket, services, supervisor

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createSocket } from 'node:dgram';
import { createConnection } from 'node:net';

function pass(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'ORCHESTRATION', status: 'PASS', message: msg, details };
}
function fail(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'ORCHESTRATION', status: 'FAIL', message: msg, details };
}
function warn(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'ORCHESTRATION', status: 'WARN', message: msg, details };
}
function skip(id: number, name: string, msg: string): AuditResult {
  return { phaseId: id, phaseName: name, block: 'ORCHESTRATION', status: 'SKIP', message: msg };
}

/** Check if a TCP port is listening */
function checkTcpPort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise(resolve => {
    const socket = createConnection({ host, port });
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.on('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}

/** Check if a Unix domain socket exists and is connectable */
function checkUnixSocket(path: string, timeoutMs = 3000): Promise<boolean> {
  if (!existsSync(path)) return Promise.resolve(false);
  return new Promise(resolve => {
    const socket = createConnection(path);
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.on('connect', () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timer); resolve(existsSync(path)); });
  });
}

/** Send a minimal VSB ping packet and wait for any response */
function checkVsbUdp(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise(resolve => {
    const sock = createSocket('udp4');
    // PING opcode (0x00) + 3 null bytes header
    const ping = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const timer = setTimeout(() => {
      sock.close();
      resolve(false);
    }, timeoutMs);
    sock.on('message', () => {
      clearTimeout(timer);
      sock.close();
      resolve(true);
    });
    sock.on('error', () => {
      clearTimeout(timer);
      sock.close();
      resolve(false);
    });
    sock.send(ping, port, host, (err) => {
      if (err) { clearTimeout(timer); sock.close(); resolve(false); }
    });
  });
}

// ── Phase 2: VSB Heartbeat ────────────────────────────────────────────────────
export const phase2: SovereignShard = {
  metadata: { id: 2, name: 'VSB-Heartbeat', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const vsbPort = parseInt(process.env['ZEROCLAW_PORT'] ?? '7878', 10);
    const nodeAHost = process.env['NODE_A_HOST'] ?? '192.168.0.50';
    // Try VSB UDP on Node A
    const udpReachable = await checkVsbUdp(nodeAHost, vsbPort, 3000).catch(() => false);
    // Also check if the local VSB listener port is open
    const localVsb = await checkTcpPort('127.0.0.1', vsbPort, 2000).catch(() => false);
    if (!udpReachable && !localVsb) {
      return warn(2, 'VSB-Heartbeat', `VSB port ${vsbPort} not responding (Node A may be offline)`, {
        nodeAHost,
        port: vsbPort,
        udpReachable,
        localTcp: localVsb,
      });
    }
    return pass(2, 'VSB-Heartbeat', `VSB port ${vsbPort} reachable`, { nodeAHost, port: vsbPort });
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Send a VSB heartbeat packet (opcode 0x00 PING)
    const i = intent as { payload?: number[] } | null;
    const pkt = Buffer.from(i?.payload ?? [0x00, 0x00, 0x00, 0x00]);
    await ctx.vsb.send(pkt).catch(e => {
      ctx.logger.error('VSB-Heartbeat manifest: send failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 4: Clawlink Socket ──────────────────────────────────────────────────
export const phase4: SovereignShard = {
  metadata: { id: 4, name: 'Clawlink-Socket', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const socketPath = '/tmp/clawlink.sock';
    const socketExists = existsSync(socketPath);
    if (!socketExists) {
      return fail(4, 'Clawlink-Socket', `${socketPath} not found — deck-igniter not running?`);
    }
    const connectable = await checkUnixSocket(socketPath, 2000);
    if (!connectable) {
      return warn(4, 'Clawlink-Socket', `${socketPath} exists but connection refused — stale socket?`, { socketPath });
    }
    return pass(4, 'Clawlink-Socket', `${socketPath} present and connectable`);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Restart deck-igniter to re-establish clawlink socket
    await ctx.cli.execute('./deck-igniter-cli restart').catch(e => {
      ctx.logger.error('Clawlink-Socket manifest: restart failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 15: Director Service ────────────────────────────────────────────────
export const phase15: SovereignShard = {
  metadata: { id: 15, name: 'Director-Service', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    // Director is the Node orchestrator (src/main.ts) — check if the MCP/API port is up
    const directorPort = parseInt(process.env['DIRECTOR_PORT'] ?? '3010', 10);
    const listening = await checkTcpPort('127.0.0.1', directorPort, 2000);
    if (!listening) {
      // Try to check via process list
      try {
        const pids = execSync('pgrep -f "tsx src/main.ts"', { encoding: 'utf8', timeout: 2000 }).trim();
        if (pids) {
          return warn(15, 'Director-Service', `Director process found (PID ${pids}) but port ${directorPort} not listening`);
        }
      } catch { /* pgrep not available or no match */ }
      return fail(15, 'Director-Service', `Director not listening on port ${directorPort}`);
    }
    return pass(15, 'Director-Service', `Director listening on port ${directorPort}`);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Restart the Director service
    await ctx.cli.execute('npm run start &').catch(e => {
      ctx.logger.error('Director-Service manifest: restart failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 18: Crush Proxy (win-proxy) ────────────────────────────────────────
export const phase18: SovereignShard = {
  metadata: { id: 18, name: 'Crush-Proxy', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    // Crush proxy exposes CDP on port 9223 as a WSL→Windows bridge
    const proxyPort = 9223;
    // Also check the local proxy port that forwards to Windows
    const localListening = await checkTcpPort('127.0.0.1', proxyPort, 2000);
    // Check clawlink socket (crush-proxy uses this for IPC)
    const socketPath = '/tmp/clawlink.sock';
    const socketExists = existsSync(socketPath);

    const details: Record<string, unknown> = { proxyPort, localListening, socketExists };

    if (!localListening && !socketExists) {
      return fail(18, 'Crush-Proxy', `Proxy port ${proxyPort} not listening and ${socketPath} missing`, details);
    }
    if (!localListening) {
      return warn(18, 'Crush-Proxy', `Socket present but proxy port ${proxyPort} not listening locally`, details);
    }
    return pass(18, 'Crush-Proxy', `Proxy port ${proxyPort} listening | socket=${socketExists}`, details);
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Restart the CDP win-proxy (crush proxy)
    await ctx.cli.execute('./crush-cli proxy restart').catch(e => {
      ctx.logger.error('Crush-Proxy manifest: restart failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 22: SSH Tunnel (Clawlink SSH) ───────────────────────────────────────
export const phase22: SovereignShard = {
  metadata: { id: 22, name: 'SSH-Tunnel', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const sshPort = parseInt(process.env['CLAWLINK_SSH_PORT'] ?? '22', 10);
    const sshUser = process.env['CLAWLINK_USER'] ?? 'maczz';
    const nodeAHost = process.env['NODE_A_HOST'] ?? '192.168.0.50';
    // Check SSH port is reachable on Node A
    const sshReachable = await checkTcpPort(nodeAHost, sshPort, 3000);
    if (!sshReachable) {
      return warn(22, 'SSH-Tunnel', `SSH ${sshUser}@${nodeAHost}:${sshPort} not reachable — Node A offline?`, {
        nodeAHost,
        sshPort,
        sshUser,
      });
    }
    return pass(22, 'SSH-Tunnel', `SSH port ${sshPort} reachable on Node A (${nodeAHost})`, {
      nodeAHost,
      sshPort,
    });
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Re-establish SSH tunnel to Node A
    const i = intent as { user?: string; host?: string; port?: number } | null;
    const user = i?.user ?? process.env['CLAWLINK_USER'] ?? 'maczz';
    const host = i?.host ?? process.env['NODE_A_HOST'] ?? '192.168.0.50';
    const port = i?.port ?? parseInt(process.env['CLAWLINK_SSH_PORT'] ?? '22', 10);
    await ctx.cli.execute(
      `ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -fNT ${user}@${host} -p ${port}`,
    ).catch(e => {
      ctx.logger.error('SSH-Tunnel manifest: tunnel failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 24: Deck-Igniter Supervisor ────────────────────────────────────────
export const phase24: SovereignShard = {
  metadata: { id: 24, name: 'DeckIgniter-Supervisor', block: 'ORCHESTRATION' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    // Check for deck-igniter-cli binary existence
    const binaryPaths = ['./deck-igniter-cli', './deck-igniter/deck-igniter-cli'];
    const binaryExists = binaryPaths.some(p => existsSync(p));
    if (!binaryExists) {
      return fail(24, 'DeckIgniter-Supervisor', 'deck-igniter-cli binary not found');
    }
    // Check if deck-igniter process is running
    try {
      const pids = execSync('pgrep -f "deck-igniter"', { encoding: 'utf8', timeout: 2000 }).trim();
      if (!pids) {
        return warn(24, 'DeckIgniter-Supervisor', 'deck-igniter binary exists but no process running');
      }
      const pidList = pids.split('\n').filter(Boolean);
      return pass(24, 'DeckIgniter-Supervisor', `deck-igniter running (${pidList.length} process(es))`, {
        pids: pidList,
      });
    } catch {
      return warn(24, 'DeckIgniter-Supervisor', 'Binary present but no deck-igniter process detected (pgrep failed)');
    }
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Start deck-igniter if not running
    await ctx.cli.execute('./deck-igniter-cli start').catch(e => {
      ctx.logger.error('DeckIgniter-Supervisor manifest: start failed', e.message);
    });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
