import { randomUUID } from 'node:crypto';
import * as dgram from 'node:dgram';
import { execSync } from 'node:child_process';
import { logger } from '../../shared/logger.js';

/**
 * SOVEREIGN_OBSERVER — PHASE 103, TASK 1
 * 
 * Implements the 1Hz ambient screen capture pipeline.
 * Interfaces with the sovereign-host (Node B) via VSB UDP.
 */

export interface ObserverConfig {
  host: string;
  port: number;
  intervalMs: number;
}

export class SovereignObserver {
  private client: dgram.Socket;
  private interval: NodeJS.Timeout | null = null;
  private config: ObserverConfig;
  private sequenceId: number = 0;

  constructor(config: ObserverConfig = { host: '127.0.0.1', port: 7878, intervalMs: 1000 }) {
    this.config = config;
    this.client = dgram.createSocket('udp4');
  }

  /**
   * Ignite the observation loop
   */
  public start(): void {
    const traceId = randomUUID();
    logger.info('SovereignObserver', traceId, `Igniting 1Hz Screen Capture [${this.config.host}:${this.config.port}]`);

    this.interval = setInterval(() => {
      this.triggerCapture();
    }, this.config.intervalMs);

    this.client.on('message', (msg) => {
      this.handleResponse(msg);
    });

    this.client.on('error', (err) => {
      logger.error('SovereignObserver', traceId, `UDP Client Error: ${err.message}`);
    });
  }

  /**
   * Stop the observation loop
   */
  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.client.close();
  }

  private triggerCapture(): void {
    const traceId = randomUUID();
    const packet = this.buildIntentPacket(0x83); // IntentCaptureScreen
    
    this.client.send(packet, this.config.port, this.config.host, (err) => {
      if (err) {
        logger.error('SovereignObserver', traceId, `Failed to send Capture Intent: ${err.message}`);
      }
    });
  }

  private handleResponse(msg: Buffer): void {
    const traceId = randomUUID();
    // VSB Result Packet decoding (Phase 81 Protocol)
    if (msg.length < 13) return;

    const magic = msg.readUInt16LE(0);
    if (magic !== 0xC0DE) return;

    const status = msg.readUInt8(13);
    const payload = msg.subarray(34, 290).toString('utf8').replace(/\0/g, '');

    if (status === 0x00) {
      logger.debug('SovereignObserver', traceId, `Screen captured: ${payload}`);
      // ◈ Phase 106: Sign frame with Visual Second Factor (V2F)
      this.signFrameWithV2f(payload, traceId);
    } else {
      logger.warn('SovereignObserver', traceId, `Capture failed [Status: ${status}]: ${payload}`);
    }
  }

  private signFrameWithV2f(filePath: string, traceId: string): void {
    try {
      // Execute crush identity_st3gg to sign the frame
      // Usage: crush identity_st3gg <image> <svid> <secret> <out>
      const svid = process.env['SPIFFE_ID'] || 'spiffe://sovereign.machina/workload/observer';
      const secret = process.env['V2F_SECRET'] || 'SOVEREIGN_M4CH1N4_V2F_SECRET';
      
      execSync(`./crush-cli identity_st3gg sign "${filePath}" "${svid}" "${secret}" "${filePath}"`);
      logger.debug('SovereignObserver', traceId, `◈ [V2F] Frame signed: ${filePath}`);
    } catch (err) {
      logger.error('SovereignObserver', traceId, `◈ [V2F] Signing failed: ${(err as Error).message}`);
    }
  }

  private buildIntentPacket(intentType: number): Buffer {
    const buf = Buffer.alloc(302);
    
    // Header (13 bytes)
    buf.writeUInt16LE(0xC0DE, 0); // Magic
    buf.writeUInt8(0x01, 2);      // Version
    buf.writeUInt8(0x01, 3);      // PacketIntent
    buf.writeUInt32LE(this.sequenceId++, 4);
    buf.writeUInt32LE(256, 8);    // PayloadLen
    
    // Checksum (XOR 0..12)
    let checksum = 0;
    for (let i = 0; i < 12; i++) {
      checksum ^= buf[i]!;
    }
    buf.writeUInt8(checksum, 12);

    // Intent Body
    buf.writeUInt8(intentType, 13);
    // SessionID (16 bytes) - random
    // ActorID (16 bytes) - random
    // Payload (256 bytes) - empty for capture

    return buf;
  }
}
