/**
 * sovereign-live-audit.ts — Phase 42+ comprehensive live-fire audit
 */
import { chromium } from 'playwright-core';
import type { Page, Browser } from 'playwright-core';
import { readFileSync } from 'fs';

const BRIDGE_HOST = '192.168.0.51';
const BRIDGE_PORT = 9223;
const CDP_HTTP = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`;

async function fetchWsUrl(): Promise<string> {
  const maxRetries = 10;
  const candidates = [
    'http://172.26.208.1:9223', // Direct WSL Gateway
    'http://192.168.0.51:9223', // LAN IP
    CDP_HTTP,
    'http://192.168.0.51:9222',
    'http://172.26.208.1:9222'
  ];

  for (let i = 0; i < maxRetries; i++) {
    for (const base of candidates) {
      try {
        process.stdout.write(`      [CDP] Trying ${base}/json/version... `);
        const res = await fetch(`${base}/json/version`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) {
          console.log(`HTTP ${res.status}`);
          continue;
        }
        const data = await res.json() as { webSocketDebuggerUrl: string };
        console.log("OK");
        const url = data.webSocketDebuggerUrl
          .replace('localhost:9222', `${BRIDGE_HOST}:${BRIDGE_PORT}`)
          .replace('127.0.0.1:9222', `${BRIDGE_HOST}:${BRIDGE_PORT}`)
          .replace('192.168.0.51:9222', `${BRIDGE_HOST}:${BRIDGE_PORT}`);
        console.log(`      [CDP] Found WS URL: ${url}`);
        return url;
      } catch (e) {
        console.log(`ERR: ${(e as Error).message}`);
      }
    }
    console.log(`      [CDP] retry ${i+1}/${maxRetries}...`);
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Failed to fetch WS URL from any candidate');
}

async function findPage(browser: Browser): Promise<Page | null> {
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      if (page.url().includes('localhost') && !page.url().includes('devtools')) return page;
    }
  }
  return browser.contexts()[0]?.pages()[0] ?? null;
}

function getToken(): string | null {
  if (process.env.FOUNDRY_BRIDGE_TOKEN) return process.env.FOUNDRY_BRIDGE_TOKEN;
  try {
    const log = readFileSync('/home/nixos/50V3R31GN-M4CH1N4/data/logs/crush.log', 'utf8');
    const matches = log.match(/Token: ([a-f0-9]{64})/g);
    return matches?.pop()?.replace('Token: ', '') ?? null;
  } catch { return null; }
}

async function main() {
  console.log('\n◈ 50V3R31GN-M4CH1N4 // SOVEREIGN LIVE AUDIT\n');
  const errors: string[] = [];

  // ── 1. CDP connect ────────────────────────────────────────────────────────
  console.log('[1/9] CDP connect...');
  const wsUrl = await fetchWsUrl();
  console.log(`      WS: ${wsUrl}`);
  let browser: Browser;
  try {
    console.log('      Connecting to browser via CDP...');
    browser = await chromium.connectOverCDP(wsUrl);
  } catch (e) {
    console.error('[1/9] ✗ FATAL:', (e as Error).message); process.exit(1);
  }
  const page = await findPage(browser);
  if (!page) { console.error('[1/9] ✗ FATAL: no page'); await browser.close(); process.exit(1); }
  console.log(`[1/9] ✓ page: ${page.url()}`);

  // Capture ALL console messages including errors
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === 'error') errors.push(text);
  });
  page.on('pageerror', err => { errors.push(`[pageerror] ${err.message}`); });

  // ── 1.5. REFRESH (F5) via CDP ─────────────────────────────────────────────
  console.log('[1.5/9] Refreshing Foundry (F5)...');
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('[1.5/9] ✓ Page reloaded');
  } catch (e) {
    console.warn('[1.5/9] ⚠  Reload timeout or error (continuing):', (e as Error).message);
  }

  // ── 2. game.ready ─────────────────────────────────────────────────────────
  console.log('[2/9] Waiting for game.ready...');
  try {
    // @ts-ignore
    await page.waitForFunction(() => typeof game !== 'undefined' && game.ready === true, { timeout: 30000 });
    console.log('[2/9] ✓ game.ready');
  } catch {
    console.warn('[2/9] ⚠  timeout — continuing');
  }

  // ── 3. Module check ───────────────────────────────────────────────────────
  console.log('[3/9] Bridge module...');
  const mod = await page.evaluate(() => {
    // @ts-ignore
    const m = game?.modules?.get('50v3r31gn-bridge');
    return { exists: !!m, active: m?.active, version: m?.version };
  });
  console.log(`[3/9] ${mod.active ? '✓' : '✗'} exists=${mod.exists} active=${mod.active} v=${mod.version}`);
  if (!mod.active) errors.push('Bridge module not active');

  // ── 4. Bridge init deep check ─────────────────────────────────────────────
  console.log('[4/9] Bridge runtime state...');
  const state = await page.evaluate(() => {
    // @ts-ignore
    const b = window.SOVEREIGN_BRIDGE;
    // @ts-ignore
    const u = game?.user;
    return {
      bridgeExists: !!b,
      isGm: u?.isGM,
      userName: u?.name,
      wsReady: b?.ws?.readyState ?? -1,
      leet: b?.journalCorruptionActive,
      // Check if the bridge hooks are registered
      // @ts-ignore
      hooksRegistered: !!(Hooks.events?.renderMainMenu || Hooks._hooks?.renderMainMenu),
    };
  });
  console.log(`[4/9] user=${state.userName} isGM=${state.isGm} bridge=${state.bridgeExists} ws=${state.wsReady} leet=${state.leet} hooks=${state.hooksRegistered}`);

  // ── 5. Force bridge re-init if missing ────────────────────────────────────
  if (!state.bridgeExists && state.isGm) {
    console.log('[5/9] Bridge missing — forcing re-init via CDP...');
    await page.evaluate(() => {
      // @ts-ignore
      if (!window.SOVEREIGN_BRIDGE) {
        // @ts-ignore
        Hooks.call('ready'); // Try to re-trigger
      }
    });
    await page.waitForTimeout(1000);
    const b2 = await page.evaluate(() => !!window.SOVEREIGN_BRIDGE);
    console.log(`[5/9] ${b2 ? '✓' : '✗'} bridge after re-trigger: ${b2}`);
  } else {
    console.log('[5/9] — skipped (bridge ok or not GM)');
  }

  // ── 6. Inject WS token & Configure Bridge ───────────────────────────────
  console.log('[6/9] Configuring Bridge module via CDP...');
  const token = getToken();
  if (token) {
    // WSL IP of the orchestrator
    const nixosIp = '172.26.211.136';
    const wsUrl = `ws://${nixosIp}:3010?token=${token}`;
    
    await page.evaluate(async (url) => {
      // @ts-ignore
      if (typeof game !== 'undefined' && game.settings) {
        await game.settings.set('50v3r31gn-bridge', 'nodeBWsUrl', url);
        console.log(`[audit-injected] nodeBWsUrl set to: ${url}`);
      }
    }, wsUrl);

    console.log('[6/9] Reloading page to apply configuration...');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('[6/9] Waiting for game.ready after reload...');
    await page.waitForFunction(() => typeof game !== 'undefined' && game.ready === true, { timeout: 30000 });

    // Bridge WS reconnects asynchronously after game.ready — poll up to 10s
    const wsState: number = await page.evaluate(`new Promise(resolve => {
      var deadline = Date.now() + 10000;
      (function check() {
        var state = window.SOVEREIGN_BRIDGE && window.SOVEREIGN_BRIDGE.ws ? window.SOVEREIGN_BRIDGE.ws.readyState : -1;
        if (state === 1 || Date.now() > deadline) resolve(state);
        else setTimeout(check, 500);
      })();
    })`);
    const wsStr = ['CONNECTING','OPEN','CLOSING','CLOSED'][wsState as number] ?? `state=${wsState}`;
    console.log(`[6/9] Bridge WS state: ${wsStr}`);
    if (wsState !== 1) errors.push(`Bridge WS not OPEN after reload (state=${wsStr})`);
  } else {
    console.warn('[6/9] ⚠  no token found');
  }

  // ── 7. CSS audit ──────────────────────────────────────────────────────────
  console.log('[7/9] CSS audit...');
  const css = await page.evaluate(() => {
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const whiteApps = Array.from(document.querySelectorAll('.window-app, .app')).filter(el => {
      const bg = getComputedStyle(el).backgroundColor;
      return bg.includes('255, 255, 255') || bg.includes('255,255,255');
    }).map(el => (el as HTMLElement).dataset?.appid ?? el.className.split(' ').slice(0,3).join('.'));
    const hasVtClass = document.body.classList.contains('vtt');
    return { bodyBg, whiteApps, hasVtClass };
  });
  console.log(`[7/9] body=${css.bodyBg} body.vtt=${css.hasVtClass}`);
  if (css.whiteApps.length) {
    console.warn(`[7/9] ⚠  ${css.whiteApps.length} white apps: ${css.whiteApps.slice(0,5).join(', ')}`);
  } else {
    console.log('[7/9] ✓ no white window backgrounds');
  }

  // ── 8. Module error scan ──────────────────────────────────────────────────
  console.log('[8/9] Error scan...');
  // Get recent Foundry notifications
  const notifications = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#notifications .notification'))
      .map(el => (el as HTMLElement).innerText?.trim())
      .filter(Boolean)
      .slice(-10);
  });
  if (notifications.length) {
    notifications.forEach(n => {
      if (n.includes('failed') || n.includes('error') || n.includes('Error')) {
        console.error(`[8/9] ✗ NOTIFICATION: ${n}`);
        errors.push(n);
      } else {
        console.log(`[8/9]   notif: ${n}`);
      }
    });
  } else {
    console.log('[8/9] ✓ no active notifications');
  }
  if (errors.length) {
    console.warn(`[8/9] ⚠  ${errors.length} error(s) captured during session`);
    errors.forEach(e => console.warn(`      ${e}`));
  }

  // ── 9. Screenshot ─────────────────────────────────────────────────────────
  console.log('[9/9] Screenshot...');
  await page.screenshot({ path: 'data/logs/sovereign-audit-baseline.png' });
  console.log('[9/9] ✓ → data/logs/sovereign-audit-baseline.png');

  await browser.close(); // CDP mode: closes connection only, does not kill Foundry process
  console.log('\n◈ AUDIT COMPLETE\n');
}

main().catch(err => { console.error('[audit] Fatal:', err.message); process.exit(1); });
