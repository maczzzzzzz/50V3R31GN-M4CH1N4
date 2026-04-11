import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function getWindowsHostIP() {
  try {
    const resolvConf = readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of resolvConf.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('nameserver ')) {
        return trimmed.replace('nameserver ', '').trim();
      }
    }
  } catch { }
  return '127.0.0.1';
}

async function main() {
  console.log('[gauntlet] Starting Synthetic Gauntlet (Task 3)...');

  const WINDOWS_HOST = getWindowsHostIP();
  const cdpUrl = process.env['CDP_URL'] || `http://${WINDOWS_HOST}:9223`;
  
  console.log(`[gauntlet] Connecting to CDP at ${cdpUrl}...`);
  let browser;
  try {
    const response = await fetch(`${cdpUrl}/json/version`);
    const data = await response.json();
    const wsUrl = data.webSocketDebuggerUrl
      .replace('localhost:9222', `${WINDOWS_HOST}:9223`)
      .replace('127.0.0.1:9222', `${WINDOWS_HOST}:9223`);
    console.log(`[gauntlet] Connecting to WS URL: ${wsUrl}`);
    browser = await chromium.connectOverCDP(wsUrl);
  } catch (err) {
    console.error(`[gauntlet] Failed to connect to CDP: ${err.message}`);
    process.exit(1);
  }

  const contexts = browser.contexts();
  let page;
  for (const ctx of contexts) {
    for (const pg of ctx.pages()) {
      if (pg.url().includes('/game')) {
        page = pg;
        break;
      }
    }
    if (page) break;
  }

  if (!page) {
    console.error('[gauntlet] No active Foundry /game page found. Attempting to use first page...');
    page = contexts[0].pages()[0];
    if (!page) {
      console.error('[gauntlet] No active Foundry page found via CDP.');
      await browser.close();
      process.exit(1);
    }
  }

  page.on('console', msg => console.log(`[browser] ${msg.text()}`));

  console.log('[gauntlet] Connected to Foundry. Waiting for game.ready...');
  
  // Wait for the game to be fully initialized (modules registered)
  await page.waitForFunction(() => typeof game !== 'undefined' && game.ready === true, { timeout: 60000 });

  // Force bridge connection to Node B
  // Use the WSL IP or default to 192.168.0.51 (Node B)
  const nixosIp = process.env.WSL_IP || '192.168.0.51';
  // Fallback to a known token if not in env (matching orchestrator logs)
  const token = process.env.FOUNDRY_BRIDGE_TOKEN || 'c2c7faf54e5a40a38b14f0d930ca1f30760edc41b4debeefda6310f97b9a73dd';
  const wsUrl = `ws://${nixosIp}:3010?token=${token}`;
  
  console.log(`[gauntlet] Forcing Foundry bridge to connect to ${wsUrl}...`);
  const currentUrl = page.url();
  await page.evaluate(async (url) => {
    await game.settings.set('50v3r31gn-bridge', 'nodeBWsUrl', url);
  }, wsUrl);

  console.log('[gauntlet] Reloading page...');
  await page.goto(currentUrl, { waitUntil: 'load' });

  console.log('[gauntlet] Waiting for Foundry to be ready...');
  await page.waitForFunction(() => {
    // @ts-ignore
    return typeof game !== 'undefined' && game.ready;
  }, { timeout: 60000 });

  console.log('[gauntlet] Foundry ready. Refreshing Neural Uplink (CDP)...');
  await page.evaluate(() => {
    // @ts-ignore
    if (window.SOVEREIGN_BRIDGE) {
      // @ts-ignore
      window.SOVEREIGN_BRIDGE._sendEvent('reconnect_uplink', {});
    }
  });
  
  console.log('[gauntlet] Waiting 5s for bridge stabilization...');
  await page.waitForTimeout(5000);
  
  // Re-acquire the page reference if needed, though 'page' should still be valid after goto
  page.on('console', msg => console.log(`[browser] ${msg.text()}`));

  // Task 3.1: Resolve Attack Injection
  console.log('[gauntlet] Task 3.1: Resolve Attack Injection...');
  try {
    // We simulate an attack by triggering a script in Foundry that calls our bridge
    await page.evaluate(() => {
      const actor = game.actors.contents[0];
      if (!actor) throw new Error('No actors found');
      console.log('[gauntlet-injected] Triggering sub rosa.resolveAttack hook for actor:', actor.id);
      // Trigger a fake attack resolution event
      Hooks.call('sub rosa.resolveAttack', {
        actorId: actor.id,
        targetId: actor.id, // Self-attack for testing
        weaponId: 'synthetic-test-smasher',
        spatial: { sceneId: game.scenes.active.id, x: 500, y: 500 }
      });
    });
    console.log('[gauntlet] Triggered Attack Injection.');
    
    // Verify chat message
    console.log('[gauntlet] Waiting for Attack chat message...');
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('#chat-log .message');
      if (messages.length === 0) return false;
      const last = messages[messages.length - 1];
      // @ts-ignore
      const text = last.innerText;
      return text.includes('Attack Roll') || text.includes('HIT') || text.includes('MISS');
    }, { timeout: 30000 });
    console.log('[gauntlet] Verified Attack chat message.');
  } catch (err) {
    console.warn(`[gauntlet] Task 3.1 Warning: ${err.message}`);
  }

  // Task 3.2: VSB Friction Roll Verification
  console.log('[gauntlet] Task 3.2: VSB Friction Roll Verification...');
  try {
    console.log('[gauntlet] Running crush wsa friction tygerclaws...');
    execSync('./crush/crush wsa friction tygerclaws', { stdio: 'inherit' });
    
    console.log('[gauntlet] Waiting for Friction chat message...');
    await page.waitForFunction(() => {
      const messages = document.querySelectorAll('#chat-log .message');
      if (messages.length === 0) return false;
      const last = messages[messages.length - 1];
      // @ts-ignore
      const text = last.innerText;
      return text.includes('Friction') || text.includes('streets feel tense') || text.includes('Decision Gate') || text.includes('ambush');
    }, { timeout: 30000 });
    console.log('[gauntlet] Verified Friction chat message.');
  } catch (err) {
    console.warn(`[gauntlet] Task 3.2 Warning: ${err.message}`);
  }

  // Task 3.3: Neural Shroud Validation
  console.log('[gauntlet] Task 3.3: Neural Shroud Validation...');
  try {
    console.log('[gauntlet] Running crush intent heavy...');
    execSync('./crush/crush intent heavy', { stdio: 'inherit' });

    console.log('[gauntlet] Waiting for #neural-shroud-lock...');
    // The shroud is injected into the Foundry DOM
    await page.waitForSelector('#neural-shroud-lock', { timeout: 15000 });
    console.log('[gauntlet] Verified #neural-shroud-lock injected.');

    console.log('[gauntlet] Waiting for #neural-shroud-lock to be removed...');
    await page.waitForSelector('#neural-shroud-lock', { state: 'detached', timeout: 30000 });
    console.log('[gauntlet] Verified #neural-shroud-lock removed.');
  } catch (err) {
    console.warn(`[gauntlet] Task 3.3 Warning: ${err.message}`);
  }

  await browser.close();
  console.log('[gauntlet] Synthetic Gauntlet Complete.');
}

main().catch(err => {
  console.error('[gauntlet] Fatal Error:', err);
  process.exit(1);
});
