/**
 * tests/integration/vsb_live_canary.ts
 *
 * A live canary to test the VSB (Binary UDP) Sovereign Highway.
 * Sends a SkillCheck intent to Node A and awaits a ResultPacket.
 */

import * as dgram from 'node:dgram';
import {
  IntentPacketCodec,
  IntentType,
  ResultPacketCodec,
  VSB_MAGIC,
} from '../../packages/hermes-core/src/shared/vsb_protocol.js';

const NODE_A_IP = '10.0.0.10';
const VSB_PORT = 7878;
const TIMEOUT_MS = 2000;

async function runCanary() {
  console.log(`⚡ VSB Live Canary: Targeting Node A at ${NODE_A_IP}:${VSB_PORT}`);

  const client = dgram.createSocket('udp4');
  const sessionId = new Uint8Array(16).fill(0xAA);
  const actorId = new Uint8Array(16).fill(0xBB);
  const payload = Buffer.from('CANARY_PROBE: Validate 1d10+5 vs DV13');
  const payloadFixed = new Uint8Array(256);
  payloadFixed.set(payload);

  const intent = IntentPacketCodec.encode(
    IntentType.SkillCheck,
    Math.floor(Math.random() * 1000),
    sessionId,
    actorId,
    payloadFixed
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.close();
      reject(new Error('VSB Timeout: Node A did not respond to UDP probe.'));
    }, TIMEOUT_MS);

    client.on('message', (msg, rinfo) => {
      console.log(`← Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`);
      
      const result = ResultPacketCodec.decode(new Uint8Array(msg));
      if (!result) {
        console.error('❌ Failed to decode ResultPacket (checksum/magic mismatch)');
        return;
      }

      console.log('✅ VSB SOVEREIGN HIGHWAY ACTIVE');
      console.log(`   Status: ${result.status === 0 ? 'OK' : 'ERROR'}`);
      console.log(`   Result Code: 0x${result.resultCode.toString(16).padStart(4, '0')}`);
      
      clearTimeout(timer);
      client.close();
      resolve(true);
    });

    client.send(intent, VSB_PORT, NODE_A_IP, (err) => {
      if (err) {
        clearTimeout(timer);
        client.close();
        reject(err);
      } else {
        console.log(`→ IntentPacket sent (${intent.length} bytes)`);
      }
    });
  });
}

runCanary().catch(err => {
  console.error(`❌ VSB Canary Failed: ${err.message}`);
  process.exit(1);
});
