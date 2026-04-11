/**
 * src/api/vsb-client.ts
 *
 * VsbClient — Production-grade Binary UDP client for the Sovereign Highway.
 */

import * as dgram from 'node:dgram';
import { randomUUID } from 'node:crypto';
import {
  IntentPacketCodec,
  IntentType,
  ResultPacketCodec,
  type ResultPacketView,
} from '../shared/vsb_protocol.js';
import type { ILogger } from '../db/interfaces.js';

export interface VsbConfig {
  host: string;
  port: number;
  timeoutMs: number;
}

export class VsbClient {
  private readonly socket: dgram.Socket;

  constructor(private readonly config: VsbConfig, private readonly logger?: ILogger | undefined) {
    this.socket = dgram.createSocket('udp4');
  }

  /**
   * Send a SkillCheck intent to Node A and await a ResultPacketView.
   */
  async sendSkillCheck(
    sequenceId: number,
    sessionId: Uint8Array,
    actorId: Uint8Array,
    payload: Uint8Array
  ): Promise<ResultPacketView> {
    const traceId = randomUUID();
    const intent = IntentPacketCodec.encode(
      IntentType.SkillCheck,
      sequenceId,
      sessionId,
      actorId,
      payload
    );

    this.logger?.debug('VsbClient', traceId, `Sending SkillCheck intent (seq=${sequenceId}) to ${this.config.host}:${this.config.port}`);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new Error(`VSB Timeout: No response from ${this.config.host}:${this.config.port} for seq=${sequenceId}`);
        this.logger?.error('VsbClient', traceId, error.message);
        reject(error);
      }, this.config.timeoutMs);

      const onMessage = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        if (rinfo.address !== this.config.host) return;

        const result = ResultPacketCodec.decode(new Uint8Array(msg));
        if (result && result.header.sequenceId === sequenceId) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          this.logger?.debug('VsbClient', traceId, `Received VSB Result (seq=${sequenceId}) from ${rinfo.address}`, {
            status: result.status,
            resultCode: result.resultCode
          });
          resolve(result);
        }
      };

      this.socket.on('message', onMessage);

      this.socket.send(intent, this.config.port, this.config.host, (err) => {
        if (err) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          this.logger?.error('VsbClient', traceId, `Failed to send SkillCheck: ${err.message}`);
          reject(err);
        }
      });
    });
  }

  /**
   * Send a Friction intent to Node A and await a ResultPacketView.
   */
  async sendFrictionIntent(
    sequenceId: number,
    sessionId: Uint8Array,
    actorId: Uint8Array,
    payload: Uint8Array
  ): Promise<ResultPacketView> {
    const traceId = randomUUID();
    const intent = IntentPacketCodec.encode(
      IntentType.Friction,
      sequenceId,
      sessionId,
      actorId,
      payload
    );

    this.logger?.debug('VsbClient', traceId, `Sending Friction intent (seq=${sequenceId}) to ${this.config.host}:${this.config.port}`);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const error = new Error(`VSB Timeout: No response from ${this.config.host}:${this.config.port} for seq=${sequenceId}`);
        this.logger?.error('VsbClient', traceId, error.message);
        reject(error);
      }, this.config.timeoutMs);

      const onMessage = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        if (rinfo.address !== this.config.host) return;

        const result = ResultPacketCodec.decode(new Uint8Array(msg));
        if (result && result.header.sequenceId === sequenceId) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          this.logger?.debug('VsbClient', traceId, `Received VSB Friction Result (seq=${sequenceId}) from ${rinfo.address}`, {
            status: result.status,
            resultCode: result.resultCode
          });
          resolve(result);
        }
      };

      this.socket.on('message', onMessage);

      this.socket.send(intent, this.config.port, this.config.host, (err) => {
        if (err) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          this.logger?.error('VsbClient', traceId, `Failed to send Friction intent: ${err.message}`);
          reject(err);
        }
      });
    });
  }

  /** UDP is connectionless — bind the socket so it can receive replies. */
  async connect(): Promise<void> {
    const traceId = randomUUID();
    return new Promise((resolve, reject) => {
      this.socket.bind(0, (err?: Error) => {
        if (err) {
          this.logger?.error('VsbClient', traceId, `Failed to bind UDP socket: ${err.message}`);
          reject(err);
        } else {
          this.logger?.info('VsbClient', traceId, `UDP socket bound to port ${this.socket.address().port}`);
          resolve();
        }
      });
    });
  }

  close(): void {
    const traceId = randomUUID();
    this.socket.close();
    this.logger?.info('VsbClient', traceId, 'UDP socket closed');
  }
}
