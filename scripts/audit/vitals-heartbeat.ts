import net from 'node:net';
import fs from 'node:fs';
import path from 'node:fs';
import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

interface Probe {
  name: string;
  type: 'port' | 'file' | 'socket' | 'http';
  target: string;
  repair: string;
}

const PROBES: Probe[] = [
  { name: 'Nucleus Artery', type: 'port', target: '3030', repair: 'npm run crush nucleus' },
  { name: 'VSB Telemetry', type: 'port', target: '9090', repair: 'Managed by Artery' },
  { name: 'Director (Node B)', type: 'port', target: '3010', repair: 'npm start' },
  { name: 'Foundry CDP', type: 'port', target: '9222', repair: 'Launch Foundry with --remote-debugging-port=9222' },
  { name: 'ZeroClaw VSB', type: 'port', target: '7878', repair: 'Managed by Node A Kernel' },
  { name: 'VSB Mmap File', type: 'file', target: 'black_ice_state.mem', repair: 'crush initialize' },
  { name: 'MCP Bridge Socket', type: 'socket', target: '.gemini/tmp/sovereign-mcp.sock', repair: 'npm run mcp:start' }
];

async function checkPort(port: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 500;
    
    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(parseInt(port), '127.0.0.1');
  });
}

function checkFile(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

async function runAudit() {
  console.log(`\n${CYAN}://50V3R31GN-M4CH1N4 // V174L5-H34R7B347 // 4UD17-1N171473D${RESET}\n`);
  
  let allPass = true;
  const results = [];

  for (const probe of PROBES) {
    let status = false;
    if (probe.type === 'port') {
      status = await checkPort(probe.target);
    } else if (probe.type === 'file' || probe.type === 'socket') {
      status = checkFile(probe.target);
    }

    results.push({ ...probe, status });
    if (!status) allPass = false;
  }

  // Print results
  console.log(`${'SERVICE'.padEnd(20)} | ${'STATUS'.padEnd(10)} | ${'TARGET'.padEnd(15)}`);
  console.log('-'.repeat(50));

  for (const r of results) {
    const statusText = r.status ? `${GREEN}● ONLINE${RESET}` : `${RED}✗ OFFLINE${RESET}`;
    console.log(`${r.name.padEnd(20)} | ${statusText.padEnd(19)} | ${r.target.padEnd(15)}`);
    if (!r.status) {
      console.log(`  ${YELLOW}↳ Repair: ${r.repair}${RESET}`);
    }
  }

  console.log(`\n${allPass ? GREEN + '::/4LL-5Y573M5-N0M1N4L' : RED + '::/C0MMP0N3N7-F41LUR3-D373C73D'}${RESET}`);
  console.log(`${CYAN}::/4UD17-C0MPL373 // 5747U5-P1N-537.${RESET}\n`);

  process.exit(allPass ? 0 : 1);
}

runAudit();
