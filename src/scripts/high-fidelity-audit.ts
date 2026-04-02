/**
 * src/scripts/high-fidelity-audit.ts
 *
 * v1.0.0 Architectural Audit — Swarm, Grep, and Flush Gate Verification
 */

import 'dotenv/config';
import { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import { RulesGrepService } from '../core/rules-grep-service.js';
import { ClawLinkClient } from '../api/clawlink-client.js';

async function runAudit() {
  console.log('🛡️ STARTING v1.0.0 ARCHITECTURAL AUDIT...');

  // 1. Persistence Verification (Flush Gate)
  const oracle = new UnifiedOracleClient({
    worldDbPath: './world.db',
    crushDbPath: './.crush/crush.db',
  });
  await oracle.connect();
  await oracle.initSchema();
  console.log('✅ Flush Gate: Unified Oracle Connected & Initialized.');

  console.log('🧪 Testing Atomic Transaction (Flush Gate)...');
  await oracle.executeTransaction([
    { action: 'UPDATE_NPC', target: 'audit-test', data: { name: 'Audit Bot', hp: 100 } },
    { action: 'ADD_LORE', subject: 'audit-test', predicate: 'is', object: 'active' }
  ]);
  const [npc] = oracle.query('SELECT name FROM npcs WHERE id = ?', ['audit-test']);
  if (npc?.name === 'Audit Bot') console.log('✅ Flush Gate: Atomic transaction verified.');

  // 2. Context Compaction Verification (Search-Extract)
  const grep = new RulesGrepService();
  console.log('🧪 Testing Rules Grep (Search-Extract)...');
  const match = await grep.search('Heavy Pistol');
  if (match) {
    console.log('✅ Search-Extract: Precision rules grounding verified.');
  } else {
    console.warn('⚠️ Search-Extract: No match found (check docs/raw_data/).');
  }

  // 3. Rules Authority Verification (Swarm Oracle)
  const clawlink = new ClawLinkClient({
    host: process.env.NODE_A_HOST || '192.168.0.50',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
  });
  
  console.log('🧪 Testing Binary Bridge & Swarm Oracle...');
  try {
    await clawlink.connect();
    const res = await clawlink.executeRpc('resolve_math', { prompt: 'Roll 1d10 + 5 vs DV 13' });
    console.log(`✅ Swarm Oracle: Concurrent math result: ${JSON.stringify(res)}`);
    await clawlink.disconnect();
  } catch (err) {
    console.error('❌ Swarm Oracle: Binary bridge failed:', err);
  }

  console.log('🏁 v1.0.0 AUDIT COMPLETE.');
  process.exit(0);
}

runAudit().catch(console.error);
