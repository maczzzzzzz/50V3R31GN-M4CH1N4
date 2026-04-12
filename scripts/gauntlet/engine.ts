#!/usr/bin/env tsx
// scripts/gauntlet/engine.ts
// Sovereign Manifest Engine — Gauntlet Runner
// Usage: npm run gauntlet [--no-cdp]

import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import Database from 'better-sqlite3';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSocket } from 'node:dgram';
import { exec } from 'node:child_process';
import { VisionClient } from './vision-client.js';
import { Logger } from '../../src/shared/logger.js';
import type { GauntletContext, SovereignShard, PhaseShard, GauntletReport, AuditResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CDP resolution ─────────────────────────────────────────────────────────
function getWslGateway(): string {
  try {
    const resolvConf = readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of resolvConf.split('\n')) {
      if (line.trim().startsWith('nameserver ')) {
        return line.trim().replace('nameserver ', '').trim();
      }
    }
  } catch { /* */ }
  return '172.26.208.1';
}

async function fetchCdpWsUrl(): Promise<string> {
  const bridgeHost = process.env['CDP_BRIDGE_HOST'] ?? '192.168.0.51';
  const bridgePort = process.env['CDP_BRIDGE_PORT'] ?? '9223';
  const wslGw = getWslGateway();

  const candidates = [...new Set([
    `http://${bridgeHost}:${bridgePort}`,
    `http://${wslGw}:${bridgePort}`,
    `http://${wslGw}:9222`,
  ])];

  for (let attempt = 0; attempt < 5; attempt++) {
    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/json/version`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        const data = await res.json() as { webSocketDebuggerUrl: string };
        return data.webSocketDebuggerUrl
          .replace('localhost:9222', `${bridgeHost}:${bridgePort}`)
          .replace('127.0.0.1:9222', `${bridgeHost}:${bridgePort}`);
      } catch { /* try next candidate */ }
    }
    if (attempt < 4) {
      console.log(`  [CDP] retry ${attempt + 1}/5...`);
      await new Promise<void>(r => setTimeout(r, 2000));
    }
  }
  throw new Error('CDP: exhausted all candidates');
}

/**
 * recursivePageHunt — polls all CDP targets until one has `game.ready === true`.
 * Survives Foundry world reloads where the target page is destroyed and respawned.
 */
async function recursivePageHunt(
  browser: Browser,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<Page> {
  for (let i = 0; i < maxAttempts; i++) {
    for (const ctx of browser.contexts()) {
      for (const pg of ctx.pages()) {
        const url = pg.url();
        if (!url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('192.168')) continue;
        if (url.includes('devtools')) continue;
        try {
          const ready = await pg.evaluate(() => {
            const g = (globalThis as unknown as Record<string, unknown>)['game'];
            return typeof g !== 'undefined' && (g as Record<string, unknown>)['ready'] === true;
          }).catch(() => false);
          if (ready) return pg;
        } catch { /* page may be closing */ }
      }
    }
    if (i < maxAttempts - 1) {
      process.stdout.write(`  [hunt] waiting for game.ready (${i + 1}/${maxAttempts})...\r`);
      await new Promise<void>(r => setTimeout(r, intervalMs));
    }
  }
  // Fallback: return first available non-devtools page
  for (const ctx of browser.contexts()) {
    for (const pg of ctx.pages()) {
      if (!pg.url().includes('devtools')) return pg;
    }
  }
  throw new Error('recursivePageHunt: no usable pages found');
}

type AnyShard = SovereignShard | PhaseShard;

function isSovereignShard(s: AnyShard): s is SovereignShard {
  return typeof (s as SovereignShard).audit === 'function';
}

async function discoverShards(): Promise<AnyShard[]> {
  const phasesDir = join(__dirname, 'phases');
  let files: string[];
  try {
    files = readdirSync(phasesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  } catch {
    console.warn('  [shards] phases/ directory empty or missing — zero shards loaded');
    return [];
  }

  // Deduplicate shards by phase ID — block files take priority over individual files
  const shardMap = new Map<number, AnyShard>();

  for (const file of files.sort()) {
    const modPath = `./phases/${file.replace(/\.(ts|js)$/, '.js')}`;
    try {
      const mod = await import(modPath) as Record<string, unknown>;
      for (const exp of Object.values(mod)) {
        if (exp === null || typeof exp !== 'object' || !('metadata' in exp)) continue;
        const candidate = exp as AnyShard;
        const hasSovereignAudit = typeof (candidate as SovereignShard).audit === 'function';
        const hasPhaseVerify = typeof (candidate as PhaseShard).verify === 'function';
        if (!hasSovereignAudit && !hasPhaseVerify) continue;
        const id = candidate.metadata.id;
        // Block files (ending in -block.ts) take priority; individual files fill gaps
        if (!shardMap.has(id) || file.endsWith('-block.ts') || file.endsWith('-block.js')) {
          shardMap.set(id, candidate);
        }
      }
    } catch (e) {
      console.warn(`  [shards] failed to load ${file}: ${(e as Error).message}`);
    }
  }
  return [...shardMap.values()].sort((a, b) => a.metadata.id - b.metadata.id);
}

function renderMarkdown(report: GauntletReport): string {
  const sym = (s: string) => s === 'PASS' ? '🟢' : s === 'FAIL' ? '🔴' : s === 'WARN' ? '🟡' : '⚪';
  return [
    '# 50V3R31GN-M4CH1N4 // SOVEREIGN MANIFEST ENGINE',
    `**Run:** ${report.timestamp}  |  **Duration:** ${report.durationMs}ms`,
    `**Result:** ${report.passed}/${report.totalPhases} PASS  |  ${report.failed} FAIL  |  ${report.warned} WARN  |  ${report.skipped} SKIP`,
    '',
    '| Phase | Block | Status | Message | ms |',
    '|------:|-------|--------|---------|---:|',
    ...report.results.map(r =>
      `| ${r.phaseId} | ${r.block} | ${sym(r.status)} ${r.status} | ${r.message} | ${r.durationMs ?? '-'} |`,
    ),
  ].join('\n');
}

async function main() {
  console.log('\n◈ 50V3R31GN-M4CH1N4 // SOVEREIGN MANIFEST ENGINE\n');
  const t0 = Date.now();
  const noCdp = process.argv.includes('--no-cdp') || process.env['GAUNTLET_NO_CDP'] === '1';

  // ── Vision Client ─────────────────────────────────────────────────────────
  const vision = new VisionClient();
  const visionHealth = await vision.healthCheck().catch(() => ({ nodeA: false, nodeB: false }));
  console.log(`[vision] Node A (Tactical): ${visionHealth.nodeA ? '✓' : '✗ offline'}`);
  console.log(`[vision] Node B (Aesthetic): ${visionHealth.nodeB ? '✓' : '✗ offline'}`);

  // ── SQLite ────────────────────────────────────────────────────────────────
  const worldDbPath = process.env['WORLD_DB_PATH'] ?? './data/world.db';
  let db: Database.Database | null = null;
  try {
    db = new Database(worldDbPath, { readonly: true });
    console.log(`[db] Opened: ${worldDbPath}`);
  } catch (e) {
    console.warn(`[db] Could not open ${worldDbPath}: ${(e as Error).message}`);
  }

  // ── CDP ───────────────────────────────────────────────────────────────────
  let browser: Browser | null = null;
  let page: Page | null = null;
  let resolvedCdpEndpoint = '';

  if (!noCdp) {
    try {
      console.log('[cdp] Resolving endpoint...');
      const wsUrl = await fetchCdpWsUrl();
      resolvedCdpEndpoint = wsUrl;
      console.log(`  → ${wsUrl}`);
      browser = await chromium.connectOverCDP(wsUrl);
      console.log('[cdp] Hunting for game.ready page...');
      page = await recursivePageHunt(browser);
      console.log(`  → ${page.url()}`);
    } catch (e) {
      console.warn(`[cdp] Unavailable — (${(e as Error).message})`);
      console.warn('      CDP-dependent shards will SKIP');
    }
  } else {
    console.log('[cdp] Skipped (--no-cdp)');
  }

  // ── Context helpers ───────────────────────────────────────────────────────
  const sovereignLogger = Logger.getInstance();
  const logger = {
    info: (msg: string, data?: unknown) =>
      sovereignLogger.info('GAUNTLET', 'engine', msg, data as Record<string, unknown> | undefined),
    error: (msg: string, data?: unknown) =>
      sovereignLogger.error('GAUNTLET', 'engine', msg, data as Record<string, unknown> | undefined),
  };
  const stabilize = (ms = 2000): Promise<void> => new Promise(r => setTimeout(r, ms));
  const manifestError = async (msg: string): Promise<void> => {
    if (!page) return;
    await page.evaluate((m: string) => {
      const bridge = (globalThis as unknown as Record<string, unknown>)['SOVEREIGN_BRIDGE'];
      if (bridge && typeof (bridge as Record<string, unknown>)['showErrorOverlay'] === 'function') {
        (bridge as Record<string, (arg: unknown) => void>)['showErrorOverlay']({
          code: 'S1GN4L_L055', message: m, severity: 'CRITICAL',
        });
      }
    }, msg).catch(() => { /* page may be closed */ });
  };

  // ── Write-hooks (Control API) ─────────────────────────────────────────────
  const vsbSend = (pkt: Buffer): Promise<void> =>
    new Promise((resolve, reject) => {
      const vsbPort = parseInt(process.env['ZEROCLAW_PORT'] ?? '7878', 10);
      const nodeAHost = process.env['NODE_A_HOST'] ?? '192.168.0.50';
      const sock = createSocket('udp4');
      sock.send(pkt, vsbPort, nodeAHost, (err) => {
        sock.close();
        if (err) reject(err); else resolve();
      });
    });

  const bridgeRunScript = (js: string): Promise<unknown> => {
    if (!page) return Promise.reject(new Error('CDP page unavailable'));
    return page.evaluate(`(async () => { ${js} })()`);
  };

  const bridgeInjectCSS = async (css: string): Promise<void> => {
    if (!page) throw new Error('CDP page unavailable');
    await page.addStyleTag({ content: css });
  };

  const cliExecute = (cmd: string): Promise<string> =>
    new Promise((resolve, reject) => {
      exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
        if (err) reject(new Error(`${err.message.slice(0, 200)}\n${stderr.slice(0, 200)}`));
        else resolve(stdout);
      });
    });

  const ctx: GauntletContext = {
    page, browser, db, vision,
    cdpEndpoint: resolvedCdpEndpoint,
    logger,
    stabilize,
    manifestError,
    vsb: { send: vsbSend },
    bridge: { runScript: bridgeRunScript, injectCSS: bridgeInjectCSS },
    cli: { execute: cliExecute },
  };

  // ── Discover & run shards ─────────────────────────────────────────────────
  console.log('\n[shards] Discovering...');
  const shards = await discoverShards();
  console.log(`  Loaded ${shards.length} shards\n`);
  console.log('[audit] Running all phases...\n');

  const results: AuditResult[] = [];
  for (const shard of shards) {
    const id = String(shard.metadata.id).padStart(2, '0');
    process.stdout.write(`  [${id}] ${shard.metadata.block}::${shard.metadata.name}... `);
    const ts = Date.now();
    try {
      let result: AuditResult;
      if (isSovereignShard(shard)) {
        // SovereignShard pattern: returns structured AuditResult
        result = await shard.audit(ctx);
      } else {
        // PhaseShard pattern: returns boolean — wrap into AuditResult
        const ok = await (shard as PhaseShard).verify(ctx);
        result = {
          phaseId: shard.metadata.id,
          phaseName: shard.metadata.name,
          block: shard.metadata.block,
          status: ok ? 'PASS' : 'FAIL',
          message: ok ? 'VERIFIED' : 'VERIFICATION FAILED',
        };
      }
      result.durationMs = Date.now() - ts;
      const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : result.status === 'WARN' ? '⚠' : '-';
      console.log(`${icon} ${result.message} (${result.durationMs}ms)`);
      sovereignLogger.audit(result);
      results.push(result);
    } catch (e) {
      const durationMs = Date.now() - ts;
      console.log(`✗ EXCEPTION: ${(e as Error).message}`);
      const failResult: AuditResult = {
        phaseId: shard.metadata.id,
        phaseName: shard.metadata.name,
        block: shard.metadata.block,
        status: 'FAIL',
        message: `Unhandled: ${(e as Error).message}`,
        durationMs,
      };
      sovereignLogger.audit(failResult);
      results.push(failResult);
    }
  }

  // ── Manifest mode (Intent Delivery) ──────────────────────────────────────
  const runManifest = process.argv.includes('--manifest');
  if (runManifest) {
    console.log('\n[manifest] Running manifest() on all SovereignShards...\n');
    for (const shard of shards) {
      if (!isSovereignShard(shard)) continue;
      const id = String(shard.metadata.id).padStart(2, '0');
      process.stdout.write(`  [${id}] ${shard.metadata.block}::${shard.metadata.name} manifest... `);
      try {
        await shard.manifest(ctx, {});
        console.log('✓');
      } catch (e) {
        console.log(`✗ ${(e as Error).message.slice(0, 80)}`);
      }
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const durationMs = Date.now() - t0;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  const report: GauntletReport = {
    timestamp: new Date().toISOString(),
    totalPhases: results.length,
    passed,
    failed,
    warned,
    skipped,
    results,
    durationMs,
  };

  mkdirSync('./data/logs', { recursive: true });
  writeFileSync('./data/logs/gauntlet-report.json', JSON.stringify(report, null, 2));
  writeFileSync('./data/logs/gauntlet-report.md', renderMarkdown(report));

  console.log('\n' + '─'.repeat(60));
  const icon = failed > 0 ? '🔴' : warned > 0 ? '🟡' : '🟢';
  console.log(`${icon} ${passed}/${results.length} PHASES VERIFIED  (${durationMs}ms)`);
  if (failed > 0) console.log(`   ✗ ${failed} FAILED`);
  if (warned > 0) console.log(`   ⚠  ${warned} WARNED`);
  console.log('   Reports → data/logs/gauntlet-report.{json,md}');
  console.log('─'.repeat(60) + '\n');

  // ── Cleanup ───────────────────────────────────────────────────────────────
  db?.close();
  try { await browser?.close(); } catch { /* ignore */ }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[engine] Fatal:', err);
  process.exit(1);
});
