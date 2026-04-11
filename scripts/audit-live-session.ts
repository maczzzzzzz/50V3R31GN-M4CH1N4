import { chromium } from 'playwright-core';
import type { Page, Browser, BrowserContext } from 'playwright-core';
import { readFileSync } from 'fs';
import { pathToFileURL } from 'node:url';

// Foundry VTT Electron binds CDP strictly to Windows 127.0.0.1:9222 and ignores
// --remote-debugging-address=0.0.0.0. From WSL2 we cannot reach Windows localhost
// directly. win-proxy.cjs must be running on the Windows host — it listens on
// 0.0.0.0:9223 and forwards to 127.0.0.1:9222.
// We resolve the Windows host IP from the WSL2 gateway (default nameserver).
export function getWindowsHostIP(): string {
  try {
    const resolvConf = readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of resolvConf.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('nameserver ')) {
        return trimmed.replace('nameserver ', '').trim();
      }
    }
  } catch {
    // fall through
  }
  return '127.0.0.1';
}

const WINDOWS_HOST = process.env.WINDOWS_HOST_IP ?? getWindowsHostIP();
// Port 9223 = win-proxy.cjs (0.0.0.0:9223 → 127.0.0.1:9222)
const CDP_ENDPOINT = `http://${WINDOWS_HOST}:9223`;

async function main() {
  console.log(`[audit-live-session] Connecting to Foundry CDP at ${CDP_ENDPOINT}...`);
  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(CDP_ENDPOINT);
  } catch (e) {
    console.error('[audit-live-session] FATAL: Failed to connect to CDP. Is Foundry running with --remote-debugging-port=9222?');
    process.exit(1);
  }

  // 1. Find the Foundry page
  const contexts: BrowserContext[] = browser.contexts();
  let foundryPage: Page | undefined;

  for (const ctx of contexts) {
    for (const pg of ctx.pages()) {
      const url = pg.url();
      if (url.includes('localhost') && !url.includes('devtools')) {
        foundryPage = pg;
        break;
      }
    }
    if (foundryPage !== undefined) break;
  }

  if (!foundryPage) {
    console.error('[audit-live-session] FATAL: Connected to CDP, but could not find the Foundry VTT page.');
    await browser.close();
    process.exit(1);
  }

  console.log(`[audit-live-session] Found active session: ${foundryPage.url()}`);

  // 2. Inspect Bridge Module State
  console.log('[audit-live-session] Checking Sovereign Bridge status...');
  const bridgeActive = await foundryPage.evaluate(() => {
    // @ts-ignore
    return game?.modules?.get('50v3r31gn-bridge')?.active || false;
  });

  if (bridgeActive) {
    console.log('[audit-live-session] SUCCESS: Sovereign Bridge is ACTIVE in the Foundry DOM.');
  } else {
    console.warn('[audit-live-session] WARNING: Sovereign Bridge is NOT active. Please enable it in the Add-on Modules menu.');
  }

  // 3. Log Initial State (Screenshot)
  const screenshotPath = 'data/logs/foundry-baseline.png';
  await foundryPage.screenshot({ path: screenshotPath });
  console.log(`[audit-live-session] Baseline screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('[audit-live-session] Phase 42 - Task 1 Audit Complete.');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(err => {
    console.error('[audit-live-session] Unhandled error:', err);
    process.exit(1);
  });
}
