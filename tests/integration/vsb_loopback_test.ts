/**
 * tests/integration/vsb_loopback_test.ts
 *
 * Local UDP loopback test for Node A.
 */

import * as dgram from 'node:dgram';
import {
  IntentPacketCodec,
  IntentType,
  ResultPacketCodec,
} from '../../src/shared/vsb_protocol.js';

const TARGET_IP = '127.0.0.1';
const VSB_PORT = 7878;
const TIMEOUT_MS = 2000;

async function runTest() {
  console.log(`⚡ VSB Loopback Test: Targeting ${TARGET_IP}:${VSB_PORT}`);

  const client = dgram.createSocket('udp4');
  const payloadFixed = new Uint8Array(256);
  payloadFixed.set(Buffer.from('LOOPBACK_PROBE'));

  const intent = IntentPacketCodec.encode(
    IntentType.SkillCheck,
    999,
    new Uint8Array(16),
    new Uint8Array(16),
    payloadFixed
  );

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.close();
      reject(new Error('Loopback Timeout: UDP server did not respond locally.'));
    }, TIMEOUT_MS);

    client.on('message', (msg) => {
      const result = ResultPacketCodec.decode(new Uint8Array(msg));
      if (result) {
        console.log('✅ LOCAL VSB ACTIVE');
        clearTimeout(timer);
        client.close();
        resolve(true);
      }
    });

    client.send(intent, VSB_PORT, TARGET_IP);
  });
}

runTest().catch(err => {
  console.error(`❌ Loopback Failed: ${err.message}`);
  process.exit(1);
});
