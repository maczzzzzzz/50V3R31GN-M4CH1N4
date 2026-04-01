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

  const keyPath = process.env.CLAWLINK_KEY_PATH || `${process.env.USERPROFILE}/.ssh/id_ed25519`;
  if (!fs.existsSync(keyPath)) {
    console.error(`❌ SSH Key not found at ${keyPath}`);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(keyPath, 'utf8');

  const client = new ClawLinkClient({
    host: process.env.CLAWLINK_HOST || '192.168.0.50',
    sshPort: parseInt(process.env.CLAWLINK_SSH_PORT || '22', 10),
    username: process.env.CLAWLINK_USER || 'maczz',
    privateKey: privateKey,
    zeroPort: 7878,
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
