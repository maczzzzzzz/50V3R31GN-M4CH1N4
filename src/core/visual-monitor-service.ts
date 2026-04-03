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
import type { IFoundryAdapter } from '../api/foundry-adapter.js';

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

export interface AtmosphereState {
  sceneId: string;
  lightingColor: string;
  animationType: string | null;
  intensity: number;
  darknessLevel: number;
}

export interface VisualMonitorConfig {
  /** CDP debug port. Must be bound to 127.0.0.1. Default: 9222 */
  readonly debugPort?: number;
  /** Oracle for persisting vision records to Akashik.db. Optional. */
  readonly oracle?: UnifiedOracleClient;
  /** FoundryAdapter for bridge-first dispatch (Phase 15). Optional. */
  readonly foundryAdapter?: IFoundryAdapter;
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
  private readonly foundryAdapter: IFoundryAdapter | undefined;
  private client: CDP.Client | null = null;

  constructor(config: VisualMonitorConfig = {}) {
    this.debugPort = config.debugPort ?? 9222;
    this.oracle = config.oracle;
    this.foundryAdapter = config.foundryAdapter;
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
   * 
   * Efficiency Hack (v1.3.2): Deduplication.
   * Only stores the screenshot if the hash differs from the last entry
   * for this scene, preventing redundant DB bloat.
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
      // Check for deduplication
      const last = this.oracle.query<{ screenshot_hash: string }>(
        'SELECT screenshot_hash FROM vision_history WHERE scene_id = ? ORDER BY captured_at DESC LIMIT 1',
        [sceneId ?? null]
      );

      if (last.length === 0 || last[0].screenshot_hash !== hash) {
        this.oracle.execute(
          'INSERT INTO vision_history (scene_id, screenshot_hash, captured_at) VALUES (?, ?, ?)',
          [sceneId ?? null, hash, timestamp]
        );
      }
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
   * Trigger a temporary "Neural Glitch" effect on the Electron window.
   * Resiliency Tier (v1.5.0):
   * 1. Try Bridge fx_glitch command (FXMaster GPU-accelerated, Phase 15).
   * 2. Fallback to Raw CSS Injection via CDP (Atmosphere First baseline).
   */
  async triggerNeuralGlitch(intensity: number = 1.0): Promise<void> {
    // 1. Tier 1 (Elite): Delegate to Bridge for FXMaster GPU acceleration
    if (this.foundryAdapter?.isConnected()) {
      try {
        await this.foundryAdapter.triggerFxGlitch(intensity);
        return;
      } catch (err) {
        process.stderr.write(`[VisualMonitor] Bridge fx_glitch failed, falling back to CSS: ${err}\n`);
      }
    }

    // 2. Tier 2 (Baseline): Raw CSS Injection via CDP
    const glitchDuration = 500; // ms
    const css = `
      body::after {
        content: "";
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(255, 0, 0, ${0.1 * intensity});
        mix-blend-mode: color-burn;
        pointer-events: none;
        z-index: 10000;
        animation: neural-flicker ${glitchDuration}ms steps(2) infinite;
      }
      @keyframes neural-flicker {
        0% { opacity: 0.5; filter: hue-rotate(90deg) blur(2px); }
        50% { opacity: 0.8; filter: hue-rotate(0deg) blur(0px); transform: translate(2px, 2px); }
        100% { opacity: 0.5; filter: hue-rotate(270deg) blur(1px); }
      }
    `;

    try {
      const styleSheetId = await this.injectCSS(css);
      
      // Auto-cleanup
      setTimeout(async () => {
        try {
          if (this.client) {
            await this.client.CSS.setStyleSheetText({ styleSheetId, text: '' });
          }
        } catch { /* ignore cleanup errors */ }
      }, glitchDuration);
    } catch (err) {
      process.stderr.write(`[VisualMonitor] triggerNeuralGlitch fallback failed: ${err}\n`);
    }
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

  /**
   * Capture the current scene atmosphere (lighting/darkness) from Foundry
   * via CDP Runtime.evaluate and persist to scene_atmosphere in Akashik.db.
   * oracle must be provided in config.
   */
  async captureAtmosphere(sceneId: string): Promise<AtmosphereState> {
    const client = this.getClient();

    const script = `(async () => {
    const scene = game.scenes.get(${JSON.stringify(sceneId)});
    if (!scene) throw new Error('Scene not found: ' + ${JSON.stringify(sceneId)});
    return {
      lightingColor: scene.environment?.globalLight?.color ?? '#ffffff',
      animationType: scene.environment?.globalLight?.animationType ?? null,
      intensity: scene.environment?.globalLight?.animationIntensity ?? 1.0,
      darknessLevel: scene.environment?.darknessLevel ?? 0.0,
    };
  })()`;

    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `[VisualMonitorService] captureAtmosphere failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown'}`
      );
    }

    const val = result.value as { lightingColor: string; animationType: string | null; intensity: number; darknessLevel: number };
    const state: AtmosphereState = {
      sceneId,
      lightingColor: val.lightingColor,
      animationType: val.animationType,
      intensity: val.intensity,
      darknessLevel: val.darknessLevel,
    };

    if (this.oracle?.isConnected()) {
      this.oracle.execute(
        `INSERT OR REPLACE INTO scene_atmosphere (scene_id, lighting_color, animation_type, intensity, darkness_level, captured_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [sceneId, state.lightingColor, state.animationType, state.intensity, state.darknessLevel]
      );
    }

    return state;
  }

  /**
   * Retrieve stored atmosphere for a scene from Akashik.db and re-inject
   * it into the Foundry renderer via CDP Runtime.evaluate (Pulse Restore).
   * No-op if no atmosphere is stored for the scene.
   */
  async restoreAtmosphere(sceneId: string): Promise<void> {
    if (!this.oracle?.isConnected()) return;

    const rows = this.oracle.query<{
      lighting_color: string;
      animation_type: string | null;
      intensity: number;
      darkness_level: number;
    }>(
      `SELECT lighting_color, animation_type, intensity, darkness_level
       FROM scene_atmosphere WHERE scene_id = ?`,
      [sceneId]
    );

    if (rows.length === 0) return;
    const atm = rows[0];

    const client = this.getClient();
    const script = `(async () => {
    const scene = game.scenes.get(${JSON.stringify(sceneId)});
    if (!scene) throw new Error('Scene not found: ' + ${JSON.stringify(sceneId)});
    await scene.update({
      'environment.globalLight.color': ${JSON.stringify(atm.lighting_color)},
      'environment.globalLight.animationType': ${JSON.stringify(atm.animation_type)},
      'environment.globalLight.animationIntensity': ${JSON.stringify(atm.intensity)},
      'environment.darknessLevel': ${JSON.stringify(atm.darkness_level)},
    });
  })()`;

    const { exceptionDetails } = await client.Runtime.evaluate({
      expression: script,
      awaitPromise: true,
      returnByValue: false,
    });

    if (exceptionDetails) {
      throw new Error(
        `[VisualMonitorService] restoreAtmosphere failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown'}`
      );
    }
  }
}
