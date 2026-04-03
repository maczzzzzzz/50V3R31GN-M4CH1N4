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
import type { VisualDiffService, DiffResult } from './visual-diff-service.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WallSegment {
  x1: number; y1: number;
  x2: number; y2: number;
}

export interface LightPlacement {
  x: number; y: number;
  radius: number;
  color?: string;   // hex color string e.g. '#ff0000'
}

export interface TokenPlacement {
  actorId: string;
  x: number; y: number;
  name?: string;
}

export interface SceneBlueprint {
  sceneId: string;
  walls?: WallSegment[];
  lights?: LightPlacement[];
  tokens?: TokenPlacement[];
}

export interface MaterializationResult {
  wallsCreated: number;
  lightsCreated: number;
  tokensCreated: number;
  executionMs: number;
}

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

  /**
   * Batch-materialize walls, lights, and tokens into a Foundry scene via
   * a single CDP Runtime.evaluate call (Neural Painter).
   * Throws if not connected or if the CDP evaluation fails.
   */
  async batchCreateDocuments(blueprint: SceneBlueprint): Promise<MaterializationResult> {
    const client = this.getClient();
    const start = Date.now();

    const walls = blueprint.walls ?? [];
    const lights = blueprint.lights ?? [];
    const tokens = blueprint.tokens ?? [];

    // Build a single JS script to execute in the Foundry renderer context
    const script = `(async () => {
    const scene = game.scenes.get(${JSON.stringify(blueprint.sceneId)});
    if (!scene) throw new Error('Scene not found: ' + ${JSON.stringify(blueprint.sceneId)});
    const wallData = ${JSON.stringify(walls)}.map(w => ({ c: [w.x1, w.y1, w.x2, w.y2] }));
    const lightData = ${JSON.stringify(lights)}.map(l => ({ x: l.x, y: l.y, config: { dim: l.radius, bright: l.radius / 2, color: l.color ?? '#ffffff' } }));
    const tokenData = ${JSON.stringify(tokens)}.map(t => ({ actorId: t.actorId, x: t.x, y: t.y, name: t.name ?? '' }));
    const results = await Promise.all([
      wallData.length  ? scene.createEmbeddedDocuments('Wall',        wallData)  : [],
      lightData.length ? scene.createEmbeddedDocuments('AmbientLight', lightData) : [],
      tokenData.length ? TokenDocument.createDocuments(tokenData, { parent: scene }) : [],
    ]);
    return { wallsCreated: results[0].length, lightsCreated: results[1].length, tokensCreated: results[2].length };
  })()`;

    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `[VisualMonitorService] Neural Painter CDP error: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown'}`
      );
    }

    const value = result.value as { wallsCreated: number; lightsCreated: number; tokensCreated: number };
    return {
      wallsCreated: value.wallsCreated,
      lightsCreated: value.lightsCreated,
      tokensCreated: value.tokensCreated,
      executionMs: Date.now() - start,
    };
  }

  /**
   * Capture a live screenshot and diff it against the stored base map for the scene.
   * Returns the DiffResult with transient entity locations.
   * Requires a VisualDiffService instance to be provided.
   */
  async diffScene(sceneId: string, diffService: VisualDiffService): Promise<DiffResult> {
    const live = await this.captureScreenshot(sceneId);
    const base = diffService.getBaseScreenshot(sceneId);
    if (!base) {
      throw new Error(`[VisualMonitorService] No base screenshot stored for scene: ${sceneId}`);
    }
    return diffService.diffImages(base.data, live.data, base.width, base.height);
  }
}
