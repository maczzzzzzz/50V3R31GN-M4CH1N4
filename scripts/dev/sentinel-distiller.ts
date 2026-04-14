#!/usr/bin/env tsx
/**
 * scripts/dev/sentinel-distiller.ts
 *
 * Sentinel Distiller — Node A Kernel component (Phase 56).
 *
 * Background process that:
 *   1. Listens to incoming VSB 0x01 (Roll/Tactical) and 0x05 (Friction) IntentPackets.
 *   2. Distils them into a compressed AAAK dialect summary.
 *   3. Pushes a 0x0A SovereignContextUpdate to Node B Director.
 *
 * Usage:
 *   npx tsx scripts/dev/sentinel-distiller.ts           # live mode (bind + forward)
 *   npx tsx scripts/dev/sentinel-distiller.ts --mock    # mock mode (one-shot, then exit)
 */

import * as dgram from 'node:dgram';
import { IntentPacketCodec, IntentType, SovereignContextUpdateCodec } from '../../src/shared/vsb_protocol.js';

const MOCK = process.argv.includes('--mock');

// ── Configuration ──────────────────────────────────────────────────────────────
const LISTEN_PORT  = parseInt(process.env['DISTILLER_LISTEN_PORT']  ?? '7880', 10);
const NODE_B_HOST  = process.env['NODE_B_HOST']  ?? '127.0.0.1';
const NODE_B_PORT  = parseInt(process.env['NODE_B_CONTEXT_PORT']    ?? '7879', 10);

// ── AAAK Compression ───────────────────────────────────────────────────────────

interface DistilledEvent {
  type: 'TACTICAL' | 'FRICTION';
  seq: number;
  summary: string;
}

const eventBuffer: DistilledEvent[] = [];

function distillToAaak(events: DistilledEvent[]): string {
  // AAAK dialect: compact token-efficient representation
  const lines = events.map(e => {
    const tag = e.type === 'TACTICAL' ? '#TACT' : '#FRIC';
    return `${tag}[${e.seq}]:${e.summary}`;
  });
  return lines.join('|');
}

function pushContextUpdate(aaak: string): void {
  const timestamp = Date.now();
  const hash = SovereignContextUpdateCodec.hash(aaak);
  const payload = SovereignContextUpdateCodec.encode(timestamp, hash, aaak);

  // Wrap in an IntentPacket with ContextUpdate intentType
  const session = new Uint8Array(16);
  const actor   = new Uint8Array(16);
  // IntentType is a const enum — use the numeric literal 0x0A directly
  const pkt = IntentPacketCodec.encode(0x0A as IntentType, timestamp & 0xFFFF_FFFF, session, actor, payload);

  const sock = dgram.createSocket('udp4');
  sock.send(pkt, NODE_B_PORT, NODE_B_HOST, (err) => {
    sock.close();
    if (err) {
      console.error(`[distiller] UDP send failed: ${err.message}`);
    } else {
      console.log(`[distiller] Pushed 0x0A update: ${hash.toString(16).padStart(8, '0')}`);
    }
  });
}

// ── Mock Mode ─────────────────────────────────────────────────────────────────

function runMock(): void {
  console.log('[distiller] MOCK MODE: generating synthetic VSB events...');

  // Simulate receiving a 0x01 Tactical packet
  eventBuffer.push({ type: 'TACTICAL', seq: 1, summary: 'REF=8,BODY=6,atk=12,dv=15,hit=true' });
  // Simulate receiving a 0x05 Friction packet
  eventBuffer.push({ type: 'FRICTION', seq: 2, summary: 'district=Watson,tension=HIGH,hostiles=3' });

  const aaak = distillToAaak(eventBuffer);
  console.log(`[distiller] AAAK compressed: ${aaak}`);

  const hash = SovereignContextUpdateCodec.hash(aaak);
  console.log(`[distiller] Pushed 0x0A update: ${hash.toString(16).padStart(8, '0')}`);

  // In mock mode we skip the actual UDP send and exit cleanly
  process.exit(0);
}

// ── Live Mode ─────────────────────────────────────────────────────────────────

function runLive(): void {
  const sock = dgram.createSocket('udp4');

  sock.on('message', (msg) => {
    const bytes = new Uint8Array(msg);
    const packet = IntentPacketCodec.decode(bytes);
    if (!packet) return;

    if (packet.intentType === (IntentType.Roll as number) || packet.intentType === (IntentType.SkillCheck as number)) {
      const summary = new TextDecoder().decode(packet.payload.subarray(0, 64)).replace(/\0/g, '');
      eventBuffer.push({ type: 'TACTICAL', seq: packet.header.sequenceId, summary: summary || `seq=${packet.header.sequenceId}` });
    } else if (packet.intentType === (IntentType.Friction as number)) {
      const summary = new TextDecoder().decode(packet.payload.subarray(0, 64)).replace(/\0/g, '');
      eventBuffer.push({ type: 'FRICTION', seq: packet.header.sequenceId, summary: summary || `seq=${packet.header.sequenceId}` });
    } else {
      return; // not a distillable type
    }

    // Flush every 5 events or on friction (high-priority)
    if (eventBuffer.length >= 5 || packet.intentType === (IntentType.Friction as number)) {
      const aaak = distillToAaak(eventBuffer.splice(0));
      pushContextUpdate(aaak);
    }
  });

  sock.on('error', (err) => {
    console.error(`[distiller] Socket error: ${err.message}`);
  });

  sock.bind(LISTEN_PORT, () => {
    console.log(`[distiller] LIVE MODE: listening on UDP port ${LISTEN_PORT}`);
    console.log(`[distiller] Will push 0x0A updates to Node B at ${NODE_B_HOST}:${NODE_B_PORT}`);
  });

  process.on('SIGINT', () => {
    console.log('[distiller] Shutdown.');
    sock.close();
    process.exit(0);
  });
}

// ── Entry ─────────────────────────────────────────────────────────────────────

if (MOCK) {
  runMock();
} else {
  runLive();
}
