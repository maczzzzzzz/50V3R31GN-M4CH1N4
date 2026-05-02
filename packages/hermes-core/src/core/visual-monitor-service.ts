/**
 * src/core/visual-monitor-service.ts
 *
 * ◈ VISUAL_MONITOR_SERVICE : Clean BASE
 *
 * Provides Node B with high-fidelity visual context via CDP.
 * Achieves root-level neural awareness without lore-bleed.
 */

import { randomUUID } from 'node:crypto';
import CDP from 'chrome-remote-interface';
import type { ILogger } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface VisualMonitorOptions {
  debugHost: string;
  debugPort: number;
  oracle: UnifiedOracleClient;
  logger?: ILogger;
}

export class VisualMonitorService {
  private client: any = null;
  private readonly oracle: UnifiedOracleClient;
  private readonly logger?: ILogger | undefined;
  private readonly debugHost: string;
  private readonly debugPort: number;

  constructor(options: VisualMonitorOptions) {
    this.oracle = options.oracle;
    this.logger = options.logger;
    this.debugHost = options.debugHost;
    this.debugPort = options.debugPort;
  }

  async connect(): Promise<void> {
    const traceId = randomUUID();
    try {
      this.client = await CDP({ host: this.debugHost, port: this.debugPort });
      const { Page, Runtime } = this.client;
      await Page.enable();
      await Runtime.enable();
      this.logger?.info('VisualMonitorService', traceId, 'Connected to CDP Artery');
    } catch (err) {
      this.logger?.error('VisualMonitorService', traceId, `CDP Connection failed: ${(err as Error).message}`);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  async captureScreenshot(sceneId: string | null = null): Promise<string> {
    const traceId = randomUUID();
    if (!this.client) throw new Error('VisualMonitor not connected');
    
    const { Page } = this.client;
    const { data } = await Page.captureScreenshot({ format: 'png' });
    
    // Log capture to Oracle
    const timestamp = new Date().toISOString();
    const hash = randomUUID(); 
    
    if (this.oracle?.isConnected()) {
        this.oracle.getRawDatabase().prepare(
          'INSERT INTO vision_history (scene_id, screenshot_hash, captured_at) VALUES (?, ?, ?)'
        ).run(sceneId ?? null, hash, timestamp);
    }

    return data;
  }
}
