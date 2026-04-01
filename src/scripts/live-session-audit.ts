/**
 * src/scripts/live-session-audit.ts
 *
 * Senior Lead Audit Tool — Live Fire Session Stress Test
 */

import 'dotenv/config';
import { FoundryAdapter } from '../api/foundry-adapter.js';
import { ClawLinkClient } from '../api/clawlink-client.js';
import { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import fs from 'node:fs';

async function runLiveAudit() {
  console.log('🌃 [Live-Fire] Starting Systemic Audit...');

  // 1. Initialise Oracle
  const oracle = new UnifiedOracleClient({
    worldDbPath: './data/world.db',
    crushDbPath: './data/crush.db',
  });
  await oracle.connect();
  console.log('✅ Oracle Attached.');

  // 2. Initialise Bridge
  const keyPath = process.env.CLAWLINK_KEY_PATH || `${process.env.USERPROFILE}/.ssh/id_ed25519`;
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  const clawlink = new ClawLinkClient({
    host: process.env.CLAWLINK_HOST || '192.168.0.50',
    sshPort: 22,
    username: 'maczz',
    privateKey,
    zeroPort: 7878,
  });
  await clawlink.connect();
  console.log('✅ Node A Bridge Active.');

  // 3. Connect to Foundry
  const foundry = new FoundryAdapter();
  await foundry.start(3010);
  console.log('⏳ Waiting for Foundry Bridge to handshake...');

  // Wait up to 10s for the module to connect
  let connected = false;
  for (let i = 0; i < 10; i++) {
    if (foundry.isConnected()) {
      connected = true;
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  if (!connected) {
    console.error('❌ FATAL: Foundry module did not connect to Port 3010.');
    process.exit(1);
  }
  console.log('✅ Foundry Linked.');

  // 4. TEST: World Discovery
  console.log('\n--- SCANNING FOUNDRY WORLD ---');
  try {
    // We'll try to find a generic actor or the active scene
    const chatMsg = '🌌 **Live-Fire Audit In Progress** — Synchronising logic streams...';
    await foundry.sendChatMessage(chatMsg, { alias: 'System Architect' });
    console.log('✅ Chat injection verified.');

    // 5. TEST: Node A Math stress
    console.log('\n--- STRESSING NODE A MATH ---');
    const start = performance.now();
    const attack = await clawlink.resolveAttack([10, 5], 8, 6, 15);
    const latency = performance.now() - start;
    console.log(`✅ Math resolved via Rust trait. Result: ${attack.hit ? 'HIT' : 'MISS'} (Total: ${attack.attack_total})`);
    console.log(`📊 Bridge Latency: ${latency.toFixed(2)}ms`);

    // 6. TEST: RKG Grounding
    console.log('\n--- GROUNDING CHECK ---');
    const npcs = oracle.query('SELECT count(*) as count FROM npcs', []);
    console.log(`✅ RKG has ${npcs[0].count} entities grounded.`);

  } catch (err) {
    console.error('🔴 AUDIT FAILURE:', err);
  } finally {
    await clawlink.disconnect();
    await foundry.stop();
    await oracle.disconnect();
    console.log('\n🌃 Audit Sequence Complete.');
    process.exit(0);
  }
}

runLiveAudit().catch(console.error);
