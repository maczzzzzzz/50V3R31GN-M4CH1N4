const { chromium } = require('playwright-core');
const fs = require('fs');

function getWindowsHostIP() {
  try {
    const resolvConf = fs.readFileSync('/etc/resolv.conf', 'utf8');
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
  const WINDOWS_HOST = getWindowsHostIP();
  const CDP_ENDPOINT = `http://${WINDOWS_HOST}:9223`;
  console.log(`[win-auto] Connecting to CDP at ${CDP_ENDPOINT}...`);

  let response, data, wsUrl;
  let attempts = 0;
  while (attempts < 15) {
    try {
      response = await fetch(`${CDP_ENDPOINT}/json/version`, { signal: AbortSignal.timeout(2000) });
      data = await response.json();
      wsUrl = data.webSocketDebuggerUrl
        .replace('localhost:9222', `${WINDOWS_HOST}:9223`)
        .replace('127.0.0.1:9222', `${WINDOWS_HOST}:9223`);
      break;
    } catch (e) {
      attempts++;
      console.log(`[win-auto] Waiting for CDP... (Attempt ${attempts}/15)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!wsUrl) {
    console.error('[win-auto] Failed to connect to CDP after 30 seconds.');
    process.exit(1);
  }

  console.log(`[win-auto] Connecting to WS URL: ${wsUrl}`);
  const browser = await chromium.connectOverCDP(wsUrl);
  const contexts = browser.contexts();
  let page;

  for (const ctx of contexts) {
    for (const pg of ctx.pages()) {
      const url = pg.url();
      if (url.includes('localhost') && !url.includes('devtools')) {
        page = pg;
        break;
      }
    }
    if (page) break;
  }

  if (!page) {
    console.error('[win-auto] No Foundry page found.');
    process.exit(1);
  }

  console.log(`[win-auto] Connected to ${page.url()}`);

  if (page.url().includes('/auth')) {
    console.log('[win-auto] Logging in as Admin...');
    // Try multiple possible password selectors
    const pwdSelector = 'input[type="password"]';
    await page.waitForSelector(pwdSelector, { timeout: 30000 });
    await page.fill(pwdSelector, '4Mmbhlb%l9U%eT');
    await page.keyboard.press('Enter');
    console.log('[win-auto] Waiting for /setup...');
    await page.waitForURL('**/setup', { timeout: 30000 });
    console.log(`[win-auto] Reached ${page.url()}`);
  }

  if (page.url().includes('/setup')) {
    console.log('[win-auto] Starting CPR World...');
    // Sometimes the setup page takes a second to render the package lists
    await page.waitForTimeout(2000);
    // In Foundry v12 the launch element is <a data-action="worldLaunch">, not a button.
    // It lives inside li.package.world. Click the first available world.
    const launched = await page.evaluate(() => {
      const link = document.querySelector('li.package.world a[data-action="worldLaunch"]');
      if (link) {
        link.click();
        return true;
      }
      return false;
    });

    if (launched) {
      console.log('[win-auto] Waiting for game or join screen...');
      try {
        await page.waitForURL('**/join', { timeout: 30000 });
      } catch (e) {
        await page.waitForURL('**/game', { timeout: 90000 });
      }
      console.log(`[win-auto] Reached ${page.url()}`);
    } else {
      console.error('[win-auto] Could not find a worldLaunch link. Dumping world entries:');
      const worlds = await page.evaluate(() =>
        [...document.querySelectorAll('li.package.world')].map(w => w.outerHTML.slice(0, 300))
      );
      worlds.forEach(w => console.error(w));
      await browser.close();
      process.exit(1);
    }
  }

  if (page.url().includes('/join')) {
    console.log('[win-auto] On /join — selecting Gamemaster and joining...');
    // Wait for the user select to be present before evaluating
    await page.waitForSelector('select[name="userid"]', { timeout: 15000 });
    await page.evaluate(() => {
      const sel = document.querySelector('select[name="userid"]');
      const gmOption = [...sel.options].find(o => o.text === 'Gamemaster' && o.value);
      if (gmOption) sel.value = gmOption.value;
    });
    await page.click('button[type="submit"]');
    console.log('[win-auto] Waiting for /game after join...');
    await page.waitForURL('**/game', { timeout: 90000 });
    console.log(`[win-auto] Now at ${page.url()}`);
  }

  console.log('[win-auto] Waiting for game.ready...');
  await page.waitForFunction(() => typeof game !== 'undefined' && game.ready, { timeout: 90000 });

  const active = await page.evaluate(() => {
    return game?.modules?.get('50v3r31gn-bridge')?.active || false;
  });

  if (active) {
    console.log('[win-auto] SUCCESS: Sovereign Bridge is ACTIVE!');
  } else {
    console.log('[win-auto] FAILURE: Sovereign Bridge is NOT active.');
  }

  // Task 1 Step 3: Log Initial State
  const screenshotPath = 'foundry-baseline.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`[win-auto] Baseline screenshot saved to ${screenshotPath}`);

  await browser.close(); // CDP mode: closes connection only, does not kill Foundry process
}

main().catch(console.error);
