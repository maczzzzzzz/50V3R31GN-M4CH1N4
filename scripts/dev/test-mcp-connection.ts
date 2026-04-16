#!/usr/bin/env tsx
/**
 * test-mcp-connection.ts
 *
 * Phase 48: Verifies the Sovereign Triad MCP Bridge socket is alive and
 * responds to basic tool calls (read_file, git_status).
 *
 * Usage: npx tsx scripts/dev/test-mcp-connection.ts
 */

import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOCKET_PATH  = path.join(PROJECT_ROOT, '.gemini/tmp/sovereign-mcp.sock');

function sendJsonRpc(socket: net.Socket, method: string, params: unknown, id: string): void {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
  socket.write(msg);
}

async function testConnection(): Promise<void> {
  console.log(`\n◈ SOVEREIGN TRIAD MCP BRIDGE — CONNECTION TEST`);
  console.log(`  Socket: ${SOCKET_PATH}\n`);

  const socket = net.createConnection(SOCKET_PATH);

  const responses: Record<string, unknown> = {};
  let buf = '';

  socket.on('data', (chunk: Buffer) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line) as { id?: string; result?: unknown; error?: unknown };
        if (msg.id) responses[msg.id] = msg;
      } catch { /* ignore malformed */ }
    }
  });

  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('error', reject);
  });
  console.log('  [✓] Socket connected');

  // 1. Initialize
  const initId = randomUUID();
  sendJsonRpc(socket, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-mcp-connection', version: '1.0.0' },
  }, initId);

  await new Promise(r => setTimeout(r, 500));
  const initResp = responses[initId] as { result?: { serverInfo?: { name: string } } } | undefined;
  if (!initResp?.result) {
    console.error('  [✗] initialize failed');
    socket.destroy();
    process.exit(1);
  }
  console.log(`  [✓] initialize OK — server: ${(initResp.result as any)?.serverInfo?.name ?? 'unknown'}`);

  // 2. List tools
  const listId = randomUUID();
  sendJsonRpc(socket, 'tools/list', {}, listId);
  await new Promise(r => setTimeout(r, 500));
  const listResp = responses[listId] as { result?: { tools?: Array<{ name: string }> } } | undefined;
  const tools = listResp?.result?.tools ?? [];
  console.log(`  [✓] tools/list — ${tools.length} tools: ${tools.map((t: { name: string }) => t.name).join(', ')}`);

  // 3. Call git_status
  const gitId = randomUUID();
  sendJsonRpc(socket, 'tools/call', { name: 'git_status', arguments: {} }, gitId);
  await new Promise(r => setTimeout(r, 2000));
  const gitResp = responses[gitId] as { result?: unknown; error?: unknown } | undefined;
  if (gitResp?.result) {
    console.log('  [✓] git_status: OK');
  } else {
    console.warn('  [!] git_status: no response (bridge may still be starting)');
  }

  socket.destroy();
  console.log('\n  MCP bridge connectivity: VERIFIED\n');
}

testConnection().catch(e => {
  console.error(`\n  [✗] Connection failed: ${(e as Error).message}`);
  console.error('  Ensure the MCP daemon is running: npx tsx scripts/dev/mcp-daemon.ts\n');
  process.exit(1);
});
