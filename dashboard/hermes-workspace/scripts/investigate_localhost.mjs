import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3000...');
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', request => {
    console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText || 'unknown error'}`);
    consoleErrors.push(`Request failed: ${request.url()}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Response error: ${response.url()} - ${response.status()}`);
      consoleErrors.push(`Response error: ${response.url()} - ${response.status()}`);
    }
  });

  const websocketConnections = [];
  page.on('websocket', ws => {
    console.log(`WebSocket opened: ${ws.url()}`);
    websocketConnections.push({ url: ws.url(), status: 'opened' });
    ws.on('close', () => {
      console.log(`WebSocket closed: ${ws.url()}`);
      const conn = websocketConnections.find(c => c.url === ws.url());
      if (conn) conn.status = 'closed';
    });
    ws.on('socketerror', err => {
      console.log(`WebSocket error: ${ws.url()} - ${err}`);
      const conn = websocketConnections.find(c => c.url === ws.url());
      if (conn) conn.status = 'error';
    });
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for 15 seconds to allow for background processes/websockets
    console.log('Waiting for 15 seconds...');
    await page.waitForTimeout(15000);

    // Take a screenshot
    const screenshotPath = 'screenshots/dashboard_investigation.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);

    console.log('\n--- Console Errors ---');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`ERROR: ${err}`));
    } else {
      console.log('No console errors found.');
    }

    const content = await page.content();
    console.log('\n--- Connectivity Check ---');
    const disconnectionKeywords = ['Lost Connectivity', 'Disconnected', 'Offline', 'Connection Lost', 'Unable to connect'];
    const foundKeywords = disconnectionKeywords.filter(kw => content.includes(kw));
    
    console.log(`Disconnection keywords found: ${foundKeywords.length > 0 ? foundKeywords.join(', ') : 'none'}`);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    const foundInBody = disconnectionKeywords.filter(kw => bodyText.includes(kw));
    if (foundInBody.length > 0) {
        console.log(`Found disconnection keywords in body text: ${foundInBody.join(', ')}`);
    }

    console.log('\n--- WebSocket Status ---');
    if (websocketConnections.length > 0) {
        websocketConnections.forEach(ws => console.log(`WebSocket: ${ws.url} - ${ws.status}`));
    }
    const wsClaude = websocketConnections.find(conn => conn.url.includes('/ws-claude'));
    if (wsClaude) {
      console.log(`WebSocket /ws-claude status: ${wsClaude.status}`);
    } else {
      console.log('WebSocket /ws-claude NOT FOUND.');
    }

  } catch (error) {
    console.error(`Error during investigation: ${error.message}`);
  } finally {
    await browser.close();
  }
}

run();
