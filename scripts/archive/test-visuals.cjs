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
  console.log(`[visual-test] Connecting to CDP at ${CDP_ENDPOINT}...`);

  const response = await fetch(`${CDP_ENDPOINT}/json/version`);
  const data = await response.json();
  const wsUrl = data.webSocketDebuggerUrl
    .replace('localhost:9222', `${WINDOWS_HOST}:9223`)
    .replace('127.0.0.1:9222', `${WINDOWS_HOST}:9223`);

  console.log(`[visual-test] Connecting to WS URL: ${wsUrl}`);
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
    console.error('[visual-test] No Foundry page found.');
    process.exit(1);
  }

  console.log(`[visual-test] Injecting Visual Dominance payloads...`);
  // Use the .ts extension for the tsx runtime
  const { SOVEREIGN_HIJACK_JS } = require('./theme-sync.ts');
  await page.evaluate((js) => {
    const script = document.createElement('script');
    script.textContent = js;
    document.head.appendChild(script);
  }, SOVEREIGN_HIJACK_JS);

  // Wait for glitch stabilization
  await page.waitForTimeout(2000);

  console.log(`[visual-test] Testing Visual Dominance on ${page.url()}`);

  // 1. Verify CRT Scanlines
  const hasScanlines = await page.evaluate(() => !!document.getElementById('sovereign-scanlines'));
  console.log(`[visual-test] CRT Scanlines Overlay: ${hasScanlines ? '✅ ACTIVE' : '❌ MISSING'}`);

  // 2. Verify Leet Speak Injection
  console.log('[visual-test] Checking for UI content (non-blocking)...');
  
  const leetCheck = await page.evaluate(() => {
    // Helper to check if a node or its children contain leet
    const hasLeetText = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const text = el.innerText.toLowerCase();
      return text.includes('53771n95') || text.includes('ch47') || 
             text.includes('4c70r5') || text.includes('173m5') || 
             text.includes('m4ch1n4') || text.includes('5c3n35') || 
             text.includes('c0m847');
    };

    return {
      hasLeet: hasLeetText('#sidebar-tabs') || hasLeetText('#controls') || hasLeetText('#navigation'),
      html: document.body.innerHTML.slice(0, 500)
    };
  });

  console.log(`[visual-test] Leet Speak Mutation: ${leetCheck.hasLeet ? '✅ ACTIVE' : '❌ NOT DETECTED'}`);
  if (!leetCheck.hasLeet) {
    console.log('[visual-test] DOM Sample (First 500 chars):');
    console.log(leetCheck.html);
  }

  // 3. Trigger a Pretext CRT Line Scan Overlay (Manual Test)
  console.log('[visual-test] Triggering Pretext CRT Line Scan Overlay...');
  await page.evaluate(() => {
    if (window.SOVEREIGN_BRIDGE) {
      const payload = {
        targetId: game.user.id,
        text: "::/L1N3-5C4N-4C71V3",
        color: "#ff003c",
        duration: 5000,
        glitch: true
      };
      
      // Use the internal dispatcher
      window.SOVEREIGN_BRIDGE._dispatch({
        type: 'pretext_overlay',
        requestId: 'test-trigger',
        payload: payload
      });
    } else {
      console.warn('SOVEREIGN_BRIDGE not found in window');
    }
  });

  // Take a screenshot of the results
  const screenshotPath = 'data/logs/visual-dominance-test.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`[visual-test] Results screenshot saved to ${screenshotPath}`);

  await browser.close();
  console.log('[visual-test] Test Complete.');
}

main().catch(console.error);
