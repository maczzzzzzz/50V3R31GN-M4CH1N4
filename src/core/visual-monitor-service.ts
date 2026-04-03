/**
 * src/core/visual-monitor-service.ts
 *
 * VisualMonitorService — Phase 11 Neural Uplink
 *
 * Establishes a persistent Native CDP connection to the Foundry VTT
 * Electron renderer. Requires Foundry launched with:
 *   --remote-debugging-port=9222
 *
 * Capabilities:
 *   Page    — screenshot capture (Akashic Vision), Ghost-Refresh
 *   Runtime — arbitrary JS evaluation in the Foundry context
 *   CSS     — live style injection (Black-Ice Inversion Engine)
 */

import CDP from 'chrome-remote-interface';
import crypto from 'node:crypto';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VisualMonitorConfig {
  /** CDP debug port. Must be bound to 127.0.0.1. Default: 9222 */
  readonly debugPort?: number;
  /** Oracle for persisting vision records to Akashik.db. Optional. */
  readonly oracle?: UnifiedOracleClient;
}

export interface ScreenshotRecord {
  hash: string;
  timestamp: string;
  sceneId: string | null;
  /** Base64-encoded PNG from CDP Page.captureScreenshot */
  data: string;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class VisualMonitorService {
  private readonly debugPort: number;
  private readonly oracle: UnifiedOracleClient | undefined;
  private client: CDP.Client | null = null;

  constructor(config: VisualMonitorConfig = {}) {
    this.debugPort = config.debugPort ?? 9222;
    this.oracle = config.oracle;
  }

  /**
   * Discover the Foundry VTT page target via the CDP JSON endpoint,
   * establish the WebSocket handshake, and enable Page/Runtime/CSS domains.
   */
  async connect(): Promise<void> {
    const targets = await CDP.List({ port: this.debugPort });
    const pageTarget = targets.find((t: CDP.Target) => t.type === 'page');

    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error(
        `[VisualMonitorService] No page target found at http://127.0.0.1:${this.debugPort}/json. ` +
        `Ensure Foundry is running with --remote-debugging-port=${this.debugPort}.`
      );
    }

    this.client = await CDP({
      target: pageTarget.webSocketDebuggerUrl,
      port: this.debugPort,
    });

    await Promise.all([
      this.client.Page.enable(),
      this.client.Runtime.enable(),
      this.client.CSS.enable(),
    ]);

    console.log('✅ Neural Uplink: Native CDP Engine Active.');
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getClient(): CDP.Client {
    if (!this.client) throw new Error('[VisualMonitorService] Not connected — call connect() first.');
    return this.client;
  }

  // ── Task 2: Akashic Vision ──────────────────────────────────────────────────

  /**
   * Capture a raw PNG screenshot from the Foundry Electron renderer.
   * If an oracle was provided at construction, persists metadata to
   * the vision_history table in Akashik.db.
   */
  async captureScreenshot(sceneId?: string): Promise<ScreenshotRecord> {
    const client = this.getClient();
    const { data } = await client.Page.captureScreenshot({ format: 'png' });

    const hash = crypto
      .createHash('sha256')
      .update(Buffer.from(data, 'base64'))
      .digest('hex');

    const timestamp = new Date().toISOString();

    if (this.oracle?.isConnected()) {
      this.oracle.execute(
        'INSERT INTO vision_history (scene_id, screenshot_hash, captured_at) VALUES (?, ?, ?)',
        [sceneId ?? null, hash, timestamp]
      );
    }

    return { hash, timestamp, sceneId: sceneId ?? null, data };
  }

  // ── Task 3: Ghost-Refresh & Live Inversion ──────────────────────────────────

  /**
   * Physically reload the Foundry Electron window (Ghost-Refresh).
   * Activates any pending module updates without manual intervention.
   */
  async reloadWindow(): Promise<void> {
    await this.getClient().Page.reload({ ignoreCache: false });
  }

  /**
   * Inject a CSS stylesheet into the live Foundry renderer via the CDP CSS domain.
   * Returns the styleSheetId for later mutation or removal.
   * No page reload required.
   */
  async injectCSS(cssText: string): Promise<string> {
    const client = this.getClient();
    const { frameTree } = await client.Page.getFrameTree();
    const frameId: string = frameTree.frame.id;
    const { styleSheetId } = await client.CSS.createStyleSheet({ frameId });
    await client.CSS.setStyleSheetText({ styleSheetId, text: cssText });
    return styleSheetId;
  }
}
