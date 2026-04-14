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
  SovereignContextUpdateCodec,
  type ResultPacketView,
  type SovereignContextUpdate,
} from '../shared/vsb_protocol.js';
import type { ILogger } from '../db/interfaces.js';

export interface VsbConfig {
  host: string;
  port: number;
  timeoutMs: number;
  /** Optional port to bind a dedicated socket for receiving 0x0A context pushes. */
  contextReceivePort?: number;
}

export class VsbClient {
  private readonly socket: dgram.Socket;
  private contextSocket?: dgram.Socket;
  private readonly contextHandlers: Array<(update: SovereignContextUpdate) => void> = [];

  constructor(private readonly config: VsbConfig, private readonly logger?: ILogger | undefined) {
    this.socket = dgram.createSocket('udp4');
  }

  /** Register a handler for incoming 0x0A SovereignContextUpdate packets from Node A. */
  onContextUpdate(handler: (update: SovereignContextUpdate) => void): void {
    this.contextHandlers.push(handler);
  }

  private handleContextUpdate(msg: Buffer): void {
    const bytes = new Uint8Array(msg);
    const packet = IntentPacketCodec.decode(bytes);
    if (!packet || packet.intentType !== (IntentType.ContextUpdate as number)) return;
    const update = SovereignContextUpdateCodec.decode(packet.payload);
    const traceId = randomUUID();
    this.logger?.debug('VsbClient', traceId, `Received 0x0A ContextUpdate (hash=${update.context_hash})`);
    for (const handler of this.contextHandlers) {
      try { handler(update); } catch { /* non-fatal */ }
    }
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
    await new Promise<void>((resolve, reject) => {
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

    // If a dedicated context-receive port is configured, bind a second socket for 0x0A pushes.
    if (this.config.contextReceivePort) {
      this.contextSocket = dgram.createSocket('udp4');
      this.contextSocket.on('message', (msg) => this.handleContextUpdate(msg));
      await new Promise<void>((resolve, reject) => {
        this.contextSocket!.bind(this.config.contextReceivePort, (err?: Error) => {
          if (err) {
            this.logger?.error('VsbClient', traceId, `Failed to bind context socket on port ${this.config.contextReceivePort}: ${err.message}`);
            reject(err);
          } else {
            this.logger?.info('VsbClient', traceId, `Context receive socket bound on port ${this.config.contextReceivePort}`);
            resolve();
          }
        });
      });
    }
  }

  close(): void {
    const traceId = randomUUID();
    this.socket.close();
    this.contextSocket?.close();
    this.logger?.info('VsbClient', traceId, 'UDP socket(s) closed');
  }
}
