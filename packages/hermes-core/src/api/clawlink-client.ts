/**
 * src/api/clawlink-client.ts
 * ◈ CLAWLINK_CLIENT : Clean BASE
 */

import { randomUUID } from 'node:crypto';
import * as net from 'node:net';
import { z } from 'zod';
import {
  ClawLinkConfigSchema,
  ClawLinkRpcRequestSchema,
  ClawLinkRpcResponseSchema,
  ClawLinkSearchResultSchema,
  ClawLinkSearchResultsSchema,
  type ClawLinkConfig,
  type ClawLinkRpcResponse,
  type ClawLinkSearchResult,
} from '../shared/schemas/clawlink.schema.js';

export interface IClawLinkClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T>;
  onIntent(handler: (intent: any) => Promise<void>): void;
}

export class ClawLinkClient implements IClawLinkClient {
  private readonly config: ClawLinkConfig;
  private client: net.Socket | null = null;
  private intentHandler: ((intent: any) => Promise<void>) | null = null;

  constructor(config: Partial<ClawLinkConfig>) {
    this.config = ClawLinkConfigSchema.parse(config);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = net.createConnection(this.config.socketPath, () => {
        resolve();
      });
      this.client.on('error', reject);
      this.client.on('data', (data) => this.handleData(data));
    });
  }

  private handleData(data: Buffer): void {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const payload = JSON.parse(line);
        if (payload.method && this.intentHandler) {
          this.intentHandler(payload);
        }
      } catch { /* ignore */ }
    }
  }

  onIntent(handler: (intent: any) => Promise<void>): void {
    this.intentHandler = handler;
  }

  async executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.client) throw new Error('ClawLink not connected');
    const id = randomUUID();
    const request = ClawLinkRpcRequestSchema.parse({ id, method, params });
    
    return new Promise((resolve, reject) => {
      this.client!.write(JSON.stringify(request) + '\n');
      // Simple timeout for now
      setTimeout(() => reject(new Error('RPC Timeout')), this.config.timeoutMs || 5000);
    });
  }

  async disconnect(): Promise<void> {
    this.client?.end();
    this.client = null;
  }
}
