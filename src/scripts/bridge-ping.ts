/**
 * src/scripts/bridge-ping.ts
 *
 * Bridge Health Check — Verifies end-to-end connectivity
 */

import 'dotenv/config';
import { ClawLinkClient } from '../api/clawlink-client.js';
import fs from 'node:fs';

async function main() {
  console.log('📡 [Bridge Check] Pinging Node A (Rules Authority)...');

  const client = new ClawLinkClient({
    host: process.env.CLAWLINK_HOST || '192.168.0.50',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
  });

  try {
    await client.connect();
    const healthy = await client.isHealthy();
    if (healthy) {
      console.log('✅ [ClawLink] Connection established. Node A (Rules Authority) is ONLINE.');
    } else {
      console.warn('🟡 [ClawLink] Bridge connected but ZeroClaw did not respond to ping.');
    }
    await client.disconnect();
  } catch (err) {
    console.error('❌ [ClawLink] Connection failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().catch(console.error);
