#!/usr/bin/env tsx
/**
 * mcp-daemon.ts
 *
 * Phase 48: Sovereign Triad MCP Bridge
 *
 * Background sidecar that exposes filesystem and git MCP tools over a
 * Unix Domain Socket (.gemini/tmp/sovereign-mcp.sock).
 *
 * Lifecycle:
 *   - Spawned by flake.nix shellHook on `nix develop`
 *   - PID written to .gemini/tmp/mcp-bridge.pid
 *   - Errors logged to data/logs/mcp-bridge.log (critical-only)
 *   - SIGTERM / SIGINT trigger graceful shutdown
 *
 * Transport: Each Unix socket connection gets its own McpServer instance
 *            backed by a StdioServerTransport(socket, socket).
 */

import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const execAsync = promisify(exec);

// ── Paths ──────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.env['PROJECT_ROOT'] ?? process.cwd();
const SOCKET_PATH  = path.join(PROJECT_ROOT, '.gemini/tmp/sovereign-mcp.sock');
const PID_PATH     = path.join(PROJECT_ROOT, '.gemini/tmp/mcp-bridge.pid');
const LOG_PATH     = path.join(PROJECT_ROOT, 'data/logs/mcp-bridge.log');

// ── Critical-only logger ───────────────────────────────────────────────────────

function logError(msg: string): void {
  const line = `${new Date().toISOString()} ERROR ${msg}\n`;
  try {
    fs.appendFileSync(LOG_PATH, line);
  } catch { /* log dir may not exist */ }
}

// ── MCP server factory ────────────────────────────────────────────────────────

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: 'sovereign-triad-mcp',
    version: '1.0.0',
  });

  // ── Filesystem tools ─────────────────────────────────────────────────────────

  server.tool(
    'read_file',
    'Read the contents of a file relative to the project root',
    { path: z.string().describe('File path relative to project root') },
    async ({ path: relPath }) => {
      const abs = path.resolve(PROJECT_ROOT, relPath);
      if (!abs.startsWith(PROJECT_ROOT)) {
        return { content: [{ type: 'text', text: 'ERROR: Path traversal rejected' }] };
      }
      try {
        const content = fs.readFileSync(abs, 'utf8');
        return { content: [{ type: 'text', text: content }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `ERROR: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    'list_directory',
    'List files in a directory relative to the project root',
    {
      path: z.string().describe('Directory path relative to project root'),
      recursive: z.boolean().optional().describe('Recurse into subdirectories (default false)'),
    },
    async ({ path: relPath, recursive = false }) => {
      const abs = path.resolve(PROJECT_ROOT, relPath);
      if (!abs.startsWith(PROJECT_ROOT)) {
        return { content: [{ type: 'text', text: 'ERROR: Path traversal rejected' }] };
      }
      try {
        const entries: string[] = [];
        function walk(dir: string, prefix = ''): void {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            const rel = prefix ? `${prefix}/${item.name}` : item.name;
            entries.push(item.isDirectory() ? `${rel}/` : rel);
            if (recursive && item.isDirectory()) walk(path.join(dir, item.name), rel);
          }
        }
        walk(abs);
        return { content: [{ type: 'text', text: entries.join('\n') }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `ERROR: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    'search_files',
    'Search for a pattern in files using ripgrep (or grep fallback)',
    {
      pattern: z.string().describe('Regex pattern to search for'),
      path: z.string().optional().describe('Subdirectory to search in (default: project root)'),
      glob: z.string().optional().describe('File glob filter, e.g. "*.ts"'),
    },
    async ({ pattern, path: relPath = '.', glob }) => {
      const abs = path.resolve(PROJECT_ROOT, relPath);
      if (!abs.startsWith(PROJECT_ROOT)) {
        return { content: [{ type: 'text', text: 'ERROR: Path traversal rejected' }] };
      }
      const globFlag = glob ? `--glob '${glob.replace(/'/g, '')}'` : '';
      const cmd = `rg --line-number --no-heading ${globFlag} '${pattern.replace(/'/g, "'\\''")}' '${abs}' 2>/dev/null || grep -rn '${pattern.replace(/'/g, "'\\''")}' '${abs}' 2>/dev/null`;
      try {
        const { stdout } = await execAsync(cmd, { cwd: PROJECT_ROOT, timeout: 10_000 });
        return { content: [{ type: 'text', text: stdout.slice(0, 50_000) || '(no matches)' }] };
      } catch (e) {
        return { content: [{ type: 'text', text: '(no matches)' }] };
      }
    },
  );

  // ── Git tools ─────────────────────────────────────────────────────────────────

  server.tool(
    'git_status',
    'Show the working tree status',
    {},
    async () => {
      try {
        const { stdout } = await execAsync('git status', { cwd: PROJECT_ROOT, timeout: 10_000 });
        return { content: [{ type: 'text', text: stdout }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `ERROR: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    'git_log',
    'Show recent git commit history',
    {
      n: z.number().int().min(1).max(100).optional().describe('Number of commits to show (default 20)'),
      oneline: z.boolean().optional().describe('One-line format (default true)'),
    },
    async ({ n = 20, oneline = true }) => {
      const format = oneline ? '--oneline' : '';
      try {
        const { stdout } = await execAsync(`git log -${n} ${format}`, { cwd: PROJECT_ROOT, timeout: 10_000 });
        return { content: [{ type: 'text', text: stdout }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `ERROR: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  server.tool(
    'git_diff',
    'Show git diff for staged or unstaged changes',
    {
      staged: z.boolean().optional().describe('Show staged diff (default false = unstaged)'),
      path: z.string().optional().describe('Limit diff to specific file/directory'),
    },
    async ({ staged = false, path: relPath }) => {
      const staged_flag = staged ? '--staged' : '';
      const path_arg = relPath ? `-- '${relPath.replace(/'/g, '')}'` : '';
      try {
        const { stdout } = await execAsync(`git diff ${staged_flag} ${path_arg}`, {
          cwd: PROJECT_ROOT, timeout: 15_000,
        });
        return { content: [{ type: 'text', text: stdout.slice(0, 100_000) || '(no diff)' }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `ERROR: ${(e as Error).message}` }], isError: true };
      }
    },
  );

  return server;
}

// ── Unix socket server ────────────────────────────────────────────────────────

async function startDaemon(): Promise<void> {
  // Ensure directories exist
  fs.mkdirSync(path.dirname(SOCKET_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

  // Remove stale socket if it exists
  try { fs.unlinkSync(SOCKET_PATH); } catch { /* ok if missing */ }

  // Write PID file
  fs.writeFileSync(PID_PATH, String(process.pid), 'utf8');

  const socketServer = net.createServer(async (socket) => {
    const mcpServer = buildMcpServer();
    const transport = new StdioServerTransport(socket, socket);

    socket.on('error', (err) => {
      // Only log non-routine connection errors
      if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
        logError(`socket: ${err.message}`);
      }
    });

    try {
      await mcpServer.connect(transport);
    } catch (e) {
      logError(`McpServer.connect failed: ${(e as Error).message}`);
    }
  });

  socketServer.on('error', (err) => {
    logError(`server: ${err.message}`);
    process.exit(1);
  });

  await new Promise<void>((resolve, reject) => {
    socketServer.listen(SOCKET_PATH, () => resolve());
    socketServer.once('error', reject);
  });

  // Single terminal notification per spec
  process.stdout.write('[Sovereign-Bridge]: IMPURE_UNFREE_ACTIVE\n');

  // Graceful shutdown
  const shutdown = async () => {
    socketServer.close();
    try { fs.unlinkSync(SOCKET_PATH); } catch { /* ok */ }
    try { fs.unlinkSync(PID_PATH); } catch { /* ok */ }
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT',  () => void shutdown());
}

startDaemon().catch(e => {
  logError(`startup: ${(e as Error).message}`);
  process.exit(1);
});
