/**
 * src/core/visual-monitor-service.ts
 *
 * VisualMonitorService — Phase 11 Neural Uplink
 *
 * Establishes a persistent Native CDP connection to the Foundry VTT
 * Electron renderer. Requires Foundry launched with:
 *   --remote-debugging-port=9222
 *
 * Capabilities enabled at connect time:
 *   Page    — screenshot capture, window reload (Ghost-Refresh)
 *   Runtime — arbitrary JS evaluation in the Foundry context
 *   CSS     — live style injection (Black-Ice Inversion Engine)
 */

import CDP from 'chrome-remote-interface';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VisualMonitorConfig {
  /** CDP debug port. Must be bound to 127.0.0.1. Default: 9222 */
  readonly debugPort?: number;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class VisualMonitorService {
  private readonly debugPort: number;
  private client: CDP.Client | null = null;

  constructor(config: VisualMonitorConfig = {}) {
    this.debugPort = config.debugPort ?? 9222;
  }

  /**
   * Discover the Foundry VTT page target via the CDP JSON endpoint,
   * establish the WebSocket handshake, and enable Page/Runtime/CSS domains.
   */
  async connect(): Promise<void> {
    // 1. Autonomous target discovery
    const targets = await CDP.List({ port: this.debugPort });
    const pageTarget = targets.find((t: CDP.Target) => t.type === 'page');

    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error(
        `[VisualMonitorService] No page target found at http://127.0.0.1:${this.debugPort}/json. ` +
        `Ensure Foundry is running with --remote-debugging-port=${this.debugPort}.`
      );
    }

    // 2. Establish CDP WebSocket connection
    this.client = await CDP({
      target: pageTarget.webSocketDebuggerUrl,
      port: this.debugPort,
    });

    // 3. Enable required domains
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

  /** Exposed for Phase 11 Task 2 (Akashic Vision) — screenshot capture. */
  getClient(): CDP.Client {
    if (!this.client) throw new Error('[VisualMonitorService] Not connected — call connect() first.');
    return this.client;
  }
}
