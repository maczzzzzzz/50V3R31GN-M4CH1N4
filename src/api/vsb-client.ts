/**
 * src/api/vsb-client.ts
 *
 * VsbClient — Production-grade Binary UDP client for the Sovereign Highway.
 */

import * as dgram from 'node:dgram';
import {
  IntentPacketCodec,
  IntentType,
  ResultPacketCodec,
  type ResultPacket,
} from '../shared/vsb_protocol.js';

export interface VsbConfig {
  host: string;
  port: number;
  timeoutMs: number;
}

export class VsbClient {
  private readonly socket: dgram.Socket;

  constructor(private readonly config: VsbConfig) {
    this.socket = dgram.createSocket('udp4');
  }

  /**
   * Send a SkillCheck intent to Node A and await a ResultPacket.
   */
  async sendSkillCheck(
    sequenceId: number,
    sessionId: Uint8Array,
    actorId: Uint8Array,
    payload: Uint8Array
  ): Promise<ResultPacket> {
    const intent = IntentPacketCodec.encode(
      IntentType.SkillCheck,
      sequenceId,
      sessionId,
      actorId,
      payload
    );

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`VSB Timeout: No response from ${this.config.host}:${this.config.port} for seq=${sequenceId}`));
      }, this.config.timeoutMs);

      const onMessage = (msg: Buffer, rinfo: dgram.RemoteInfo) => {
        if (rinfo.address !== this.config.host) return;

        const result = ResultPacketCodec.decode(new Uint8Array(msg));
        if (result && result.header.sequenceId === sequenceId) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          resolve(result);
        }
      };

      this.socket.on('message', onMessage);

      this.socket.send(intent, this.config.port, this.config.host, (err) => {
        if (err) {
          clearTimeout(timer);
          this.socket.off('message', onMessage);
          reject(err);
        }
      });
    });
  }

  close(): void {
    this.socket.close();
  }
}
