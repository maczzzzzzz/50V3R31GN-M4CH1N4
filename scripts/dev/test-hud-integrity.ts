import { chromium } from 'playwright';

/**
 * HUD_INTEGRITY_TEST — PHASE 93.9
 * 
 * Standalone CDP script to verify the Pretext Shroud.
 */

async function testHud() {
  console.log("::/5Y573M-N071C3 : IGNITING_HUD_INTEGRITY_TEST...");
  
  const browser = await chromium.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  try {
    console.log("● Navigating to http://localhost:3001/os...");
    await page.goto('http://localhost:3001/os', { waitUntil: 'networkidle', timeout: 60000 });
    
    // 1. Verify Monolithic Header
    const title = await page.innerText('h1');
    console.log(`● [HEADER_DETECTED] : ${title}`);
    if (!title.includes('50V3R31GN_M4CH1N4')) throw new Error('HEADER_MISMATCH');

    // 2. Verify Context Rings
    const rings = await page.$$('circle');
    console.log(`● [RINGS_DETECTED] : ${rings.length / 2} active telemetry rings.`);

    // 3. Verify Grid Modules
    const modules = [
      'COMMAND_ARTERY',
      'TELEMETRY_PULSE',
      'TASKS_MESH',
      'SYNAPSE_ORBIT',
      'TERMINAL_ARTERY',
      'RED_TRADE_MESH'
    ];

    for (const mod of modules) {
      const exists = await page.isVisible(`text=${mod}`);
      console.log(`● [MODULE_VERIFY] : ${mod} -> ${exists ? 'ONLINE' : 'OFFLINE'}`);
      if (!exists) throw new Error(`MODULE_MISSING: ${mod}`);
    }

    console.log("::/5Y573M-N071C3 : HUD_INTEGRITY_VERIFIED. 100% PARITY ACHIEVED.");
    
    await page.screenshot({ path: 'data/logs/hud_integrity_v387.png', fullPage: true });
    console.log("● [MANIFEST] : Screenshot saved to data/logs/hud_integrity_v387.png");

  } catch (err) {
    console.error(`❌ [TEST_FAILURE] : ${(err as Error).message}`);
    process.exit(1)
  } finally {
    await browser.close();
  }
}

testHud();
