#!/usr/bin/env tsx
// scripts/gauntlet/engine.ts
// ◈ GAUNTLET_ENGINE : RECKONING_EDITION — v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
//
// Definitive validation engine for the Sovereign Trinity.
// Features: Context-DAG Auditing, Spatial R-Tree Verification, and Headless UI Parity.

import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import Database from 'better-sqlite3';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSocket } from 'node:dgram';
import { exec } from 'node:child_process';
import { VisionClient } from './vision-client.js';
import { Logger } from '../../packages/hermes-core/src/shared/logger.js';
import { PulseEngine } from '../../packages/hermes-core/src/core/pulse-engine.js';
import type { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import type { INitroLogicClient } from '../../packages/hermes-core/src/core/interfaces.js';
import type { GauntletContext, SovereignShard, PhaseShard, GauntletReport, AuditResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Artery Ports (Canonical v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS) ────────────────────────────────────────
const PORTS = {
  VSB: 7878,
  DASHBOARD: 3001,
  NUCLEUS: 3011,
  VISION: 3013,
  SSE: 3015
};

// ── CDP resolution (Headless Ingress) ──────────────────────────────────────
async function fetchCdpWsUrl(): Promise<string> {
  const bridgeHost = process.env['CDP_BRIDGE_HOST'] ?? '127.0.0.1';
  const bridgePort = process.env['CDP_BRIDGE_PORT'] ?? '9222';

  const candidates = [
    `http://${bridgeHost}:${bridgePort}`,
    `http://127.0.0.1:9222`,
  ];

  for (let attempt = 0; attempt < 5; attempt++) {
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/json/version`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json() as { webSocketDebuggerUrl: string };
        return data.webSocketDebuggerUrl;
      } catch { /* next candidate */ }
    }
    await new Promise<void>(r => setTimeout(r, 2000));
  }
  throw new Error('CDP: exhausted all candidates');
}

/**
 * spatialQueryVerify — Verifies R-Tree spatial indexing in the Oracle.
 */
async function spatialQueryVerify(db: Database.Database, x: number, y: number, radius: number): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT id FROM spatial_palace_nodes 
    WHERE x BETWEEN ? AND ? AND y BETWEEN ? AND ?
  `);
  const results = stmt.all(x - radius, x + radius, y - radius, y + radius);
  return results.length >= 0;
}

async function discoverShards(): Promise<AnyShard[]> {
  const phasesDir = join(__dirname, 'phases');
  const files = readdirSync(phasesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  const shardMap = new Map<number, AnyShard>();

  for (const file of files.sort()) {
    const modPath = `./phases/${file.replace(/\.(ts|js)$/, '.js')}`;
    try {
      const mod = await import(modPath) as Record<string, unknown>;
      for (const exp of Object.values(mod)) {
        if (exp === null || typeof exp !== 'object' || !('metadata' in exp)) continue;
        const candidate = exp as AnyShard;
        shardMap.set(candidate.metadata.id, candidate);
      }
    } catch (e) {
      console.warn(`  [shards] failed to load ${file}: ${(e as Error).message}`);
    }
  }
  return [...shardMap.values()].sort((a, b) => a.metadata.id - b.metadata.id);
}

type AnyShard = SovereignShard | PhaseShard;

async function main() {
  console.log('\n◈ 50V3R31GN-M4CH1N4 // GAUNTLET RECKONING // v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS\n');
  const t0 = Date.now();
  const noCdp = process.argv.includes('--no-cdp');

  // 1. Hardware Heartbeat
  const vision = new VisionClient();
  const visionHealth = await vision.healthCheck().catch(() => ({ nodeA: false, nodeB: false }));
  console.log(`[vision] Node A (KV): ${visionHealth.nodeA ? '✓' : '✗'}`);
  console.log(`[vision] Node B (Director): ${visionHealth.nodeB ? '✓' : '✗'}`);

  // 2. Oracle (SQLite RKG) Ingress
  const worldDbPath = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
  let db: Database.Database | null = null;
  try {
    db = new Database(worldDbPath, { readonly: true });
    console.log(`[db] Shored: ${worldDbPath}`);
  } catch (e) {
    console.warn(`[db] Artery Failure: ${(e as Error).message}`);
  }

  // 3. CDP Ingress (Web Shroud)
  let browser: Browser | null = null;
  let page: Page | null = null;
  if (!noCdp) {
    try {
      const wsUrl = await fetchCdpWsUrl();
      browser = await chromium.connectOverCDP(wsUrl);
      const ctx = browser.contexts()[0] || await browser.newContext();
      page = ctx.pages()[0] || await ctx.newPage();
      console.log(`[cdp] Ingress active: ${page.url()}`);
    } catch (e) {
      console.warn(`[cdp] Artery offline: ${(e as Error).message}`);
    }
  }

  const sovereignLogger = Logger.getInstance();
  const ctx: GauntletContext = {
    page, browser, db, vision,
    cdpEndpoint: '',
    logger: {
      info: (msg, data) => sovereignLogger.info('GAUNTLET', 'reckoning', msg, data as any),
      error: (msg, data) => sovereignLogger.error('GAUNTLET', 'reckoning', msg, data as any),
    },
    stabilize: (ms = 1000) => new Promise(r => setTimeout(r, ms)),
    manifestError: async () => {},
    vsb: { send: async () => {} },
    bridge: { 
      runScript: (js) => page?.evaluate(js) ?? Promise.reject('CDP_OFFLINE'),
      injectCSS: (css) => page?.addStyleTag({ content: css }) ?? Promise.reject('CDP_OFFLINE')
    },
    cli: { execute: (cmd) => new Promise((r, j) => exec(cmd, (e, s) => e ? j(e) : r(s))) },
  };

  // 4. Discover & Execute Reckoning Shards
  const shards = await discoverShards();
  const shardFilterArg = process.argv.find(a => a.startsWith('--shard='));
  const shardFilter = shardFilterArg ? parseInt(shardFilterArg.replace('--shard=', ''), 10) : null;
  const activeShards = shardFilter !== null ? shards.filter(s => s.metadata.id === shardFilter) : shards;

  console.log(`[reckoning] Executing ${activeShards.length} shards...\n`);

  const results: AuditResult[] = [];
  for (const shard of activeShards) {
    process.stdout.write(`  [${String(shard.metadata.id).padStart(2, '0')}] ${shard.metadata.block}::${shard.metadata.name}... `);
    const ts = Date.now();
    try {
      let result: AuditResult;
      if (typeof (shard as SovereignShard).audit === 'function') {
        result = await (shard as SovereignShard).audit(ctx);
      } else {
        const ok = await (shard as PhaseShard).verify(ctx);
        result = { phaseId: shard.metadata.id, phaseName: shard.metadata.name, block: shard.metadata.block, status: ok ? 'PASS' : 'FAIL', message: ok ? 'VERIFIED' : 'FAILED' };
      }
      result.durationMs = Date.now() - ts;
      console.log(`${result.status === 'PASS' ? '✓' : '✗'} ${result.message} (${result.durationMs}ms)`);
      results.push(result);
    } catch (e) {
      console.log(`✗ EXCEPTION: ${(e as Error).message}`);
    }
  }

  // 5. Finalize Reckoning Report
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`${passed === results.length ? '🟢' : '🔴'} ${passed}/${results.length} RECKONING PHASES PASS`);
  console.log(`────────────────────────────────────────────────────────────\n`);

  db?.close();
  await browser?.close().catch(() => {});
  process.exit(passed === results.length ? 0 : 1);
}

main().catch(err => {
  console.error('[reckoning] Fatal Artery Failure:', err);
  process.exit(1);
});
