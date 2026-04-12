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
import { VisionClient } from './vision-client.js';
import type { GauntletContext, SovereignShard, GauntletReport, AuditResult } from './types.js';

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
    `http://${wslGw}:9223`,
    'http://192.168.0.51:9223',
    'http://192.168.0.51:9222',
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
          .replace('127.0.0.1:9222', `${bridgeHost}:${bridgePort}`)
          .replace('192.168.0.51:9222', `${bridgeHost}:${bridgePort}`);
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

async function discoverShards(): Promise<SovereignShard[]> {
  const phasesDir = join(__dirname, 'phases');
  let files: string[];
  try {
    files = readdirSync(phasesDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  } catch {
    console.warn('  [shards] phases/ directory empty or missing — zero shards loaded');
    return [];
  }

  const shards: SovereignShard[] = [];
  for (const file of files.sort()) {
    const modPath = `./phases/${file.replace(/\.(ts|js)$/, '.js')}`;
    try {
      const mod = await import(modPath) as Record<string, unknown>;
      for (const exp of Object.values(mod)) {
        if (
          exp !== null &&
          typeof exp === 'object' &&
          'metadata' in exp &&
          'audit' in exp &&
          typeof (exp as SovereignShard).audit === 'function'
        ) {
          shards.push(exp as SovereignShard);
        }
      }
    } catch (e) {
      console.warn(`  [shards] failed to load ${file}: ${(e as Error).message}`);
    }
  }
  return shards.sort((a, b) => a.metadata.id - b.metadata.id);
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

  if (!noCdp) {
    try {
      console.log('[cdp] Resolving endpoint...');
      const wsUrl = await fetchCdpWsUrl();
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

  const ctx: GauntletContext = { page, browser, db, vision, cdpEndpoint: '' };

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
      const result = await shard.audit(ctx);
      result.durationMs = Date.now() - ts;
      const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : result.status === 'WARN' ? '⚠' : '-';
      console.log(`${icon} ${result.message} (${result.durationMs}ms)`);
      results.push(result);
    } catch (e) {
      const durationMs = Date.now() - ts;
      console.log(`✗ EXCEPTION: ${(e as Error).message}`);
      results.push({
        phaseId: shard.metadata.id,
        phaseName: shard.metadata.name,
        block: shard.metadata.block,
        status: 'FAIL',
        message: `Unhandled: ${(e as Error).message}`,
        durationMs,
      });
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
