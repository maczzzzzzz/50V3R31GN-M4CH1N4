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

  const websocketConnections = [];
  page.on('websocket', ws => {
    console.log(`WebSocket opened: ${ws.url()}`);
    websocketConnections.push({ url: ws.url(), status: 'opened' });
    ws.on('framesent', frame => console.log(`WebSocket frame sent: ${frame.payload}`));
    ws.on('framereceived', frame => console.log(`WebSocket frame received: ${frame.payload}`));
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

    console.log('\n--- Console Errors ---');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(err => console.log(`ERROR: ${err}`));
    } else {
      console.log('No console errors found.');
    }

    const content = await page.content();
    console.log('\n--- Connectivity Check ---');
    const lostConnectivity = content.includes('Lost Connectivity') || content.includes('Disconnected');
    console.log(`'Lost Connectivity' or 'Disconnected' found: ${lostConnectivity}`);
    if (lostConnectivity) {
        // Log a bit of context if found
        const text = await page.evaluate(() => document.body.innerText);
        if (text.includes('Lost Connectivity')) console.log('Found "Lost Connectivity" in body text');
        if (text.includes('Disconnected')) console.log('Found "Disconnected" in body text');
    }

    console.log('\n--- WebSocket Status ---');
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
