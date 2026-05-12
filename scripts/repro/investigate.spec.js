import { test, expect } from '@playwright/test';

test('investigate localhost:3000', async ({ page }) => {
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

  console.log('Navigating to http://localhost:3000...');
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
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Lost Connectivity')) console.log('Found "Lost Connectivity" in body text');
  if (bodyText.includes('Disconnected')) console.log('Found "Disconnected" in body text');

  console.log('\n--- WebSocket Status ---');
  const wsClaude = websocketConnections.find(conn => conn.url.includes('/ws-claude'));
  if (wsClaude) {
    console.log(`WebSocket /ws-claude status: ${wsClaude.status}`);
  } else {
    console.log('WebSocket /ws-claude NOT FOUND.');
  }
});
