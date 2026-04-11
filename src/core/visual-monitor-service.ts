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
 *   Page    — screenshot capture (Akashik Vision), Ghost-Refresh
 *   Runtime — arbitrary JS evaluation in the Foundry context
 *   CSS     — live style injection (Black-Ice Inversion Engine)
 */

import CDP from 'chrome-remote-interface';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { VisualDiffService, DiffResult } from './visual-diff-service.js';
import type { IFoundryAdapter } from '../api/foundry-adapter.js';
import type { INitroLogicClient, DetectedEntity, ILogger } from './interfaces.js';

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
  /** CDP debug host. Default: 127.0.0.1 */
  readonly debugHost?: string;
  /** CDP debug port. Default: 9222 */
  readonly debugPort?: number;
  /** Oracle for persisting vision records to Akashik.db. Optional. */
  readonly oracle?: UnifiedOracleClient;
  /** FoundryAdapter for bridge-first dispatch (Phase 15). Optional. */
  readonly foundryAdapter?: IFoundryAdapter;
  /**
   * NitroLogicClient with ocrAnalyze support (Phase 16 Falcon Sidecar).
   * Required for regroundScene() to perform OCR analysis.
   */
  readonly nitroLogic?: INitroLogicClient | undefined;
  /** Centralized logger for system observability. */
  readonly logger?: ILogger | undefined;
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
  private readonly debugHost: string;
  private readonly debugPort: number;
  private readonly oracle: UnifiedOracleClient | undefined;
  private readonly foundryAdapter: IFoundryAdapter | undefined;
  private readonly nitroLogic: INitroLogicClient | undefined;
  private readonly logger?: ILogger | undefined;
  private client: CDP.Client | null = null;

  constructor(config: VisualMonitorConfig = {}) {
    this.debugHost = config.debugHost ?? '127.0.0.1';
    this.debugPort = config.debugPort ?? 9222;
    this.oracle = config.oracle;
    this.foundryAdapter = config.foundryAdapter;
    this.nitroLogic = config.nitroLogic;
    this.logger = config.logger;
  }

  /**
   * Discover the Foundry VTT page target via the CDP JSON endpoint,
   * establish the WebSocket handshake, and enable Page/Runtime/CSS domains.
   */
  async connect(): Promise<void> {
    const traceId = randomUUID();
    try {
      const targets = await CDP.List({ host: this.debugHost, port: this.debugPort });
      const pageTarget = targets.find((t: CDP.Target) => t.type === 'page');

      if (!pageTarget?.webSocketDebuggerUrl) {
        throw new Error(
          `No page target found at http://${this.debugHost}:${this.debugPort}/json. ` +
          `Ensure Foundry is running with --remote-debugging-port=${this.debugPort}.`
        );
      }

      const wsUrl = pageTarget.webSocketDebuggerUrl.replace('127.0.0.1', this.debugHost);

      this.client = await CDP({
        target: wsUrl,
        host: this.debugHost,
        port: this.debugPort,
      });

      await Promise.all([
        this.client.Page.enable(),
        this.client.DOM.enable(),
        this.client.Runtime.enable(),
      ]);

      // CSS depends on DOM
      await this.client.CSS.enable();

      this.logger?.info('VisualMonitorService', traceId, '✅ Neural Uplink: Native CDP Engine Active.');
    } catch (err) {
      this.logger?.error('VisualMonitorService', traceId, `Failed to connect to CDP: ${(err as Error).message}`);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    const traceId = randomUUID();
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.logger?.info('VisualMonitorService', traceId, 'Neural Uplink disconnected.');
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }

  getClient(): CDP.Client {
    if (!this.client) throw new Error('[VisualMonitorService] Not connected — call connect() first.');
    return this.client;
  }

  // ── Task 2: Akashik Vision ──────────────────────────────────────────────────

  /**
   * Capture a raw PNG screenshot from the Foundry Electron renderer.
   * If an oracle was provided at construction, persists metadata to
   * the vision_history table in Akashik.db.
   */
  async captureScreenshot(sceneId?: string): Promise<ScreenshotRecord> {
    const traceId = randomUUID();
    const client = this.getClient();
    this.logger?.debug('VisualMonitorService', traceId, `Capturing screenshot for scene: ${sceneId ?? 'active'}`);
    
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

      const lastRow = last[0];
      if (last.length === 0 || (lastRow && lastRow.screenshot_hash !== hash)) {
        this.oracle.execute(
          'INSERT INTO vision_history (scene_id, screenshot_hash, captured_at) VALUES (?, ?, ?)',
          [sceneId ?? null, hash, timestamp]
        );
        this.logger?.debug('VisualMonitorService', traceId, 'New vision record committed to Oracle.');
      }
    }

    return { hash, timestamp, sceneId: sceneId ?? null, data };
  }

  /**
   * Surgical Perception (Phase 27): Capture a high-resolution crop of a
   * specific Foundry canvas coordinate via CDP Page.captureScreenshot clip.
   */
  async captureCoordinateCrop(x: number, y: number, size: number = 512): Promise<string> {
    const traceId = randomUUID();
    const client = this.getClient();
    this.logger?.debug('VisualMonitorService', traceId, `Capturing coordinate crop at {${x}, ${y}} (size=${size})`);
    
    const { data } = await client.Page.captureScreenshot({
      format: 'png',
      clip: {
        x: x - (size / 2),
        y: y - (size / 2),
        width: size,
        height: size,
        scale: 1,
      },
    });
    return data; // Base64
  }

  // ── Task 3: Ghost-Refresh & Live Inversion ──────────────────────────────────

  /**
   * Physically reload the Foundry Electron window (Ghost-Refresh).
   */
  async reloadWindow(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info('VisualMonitorService', traceId, 'Executing Ghost-Refresh (Window Reload).');
    await this.getClient().Page.reload({ ignoreCache: false });
  }

  /**
   * Inject a CSS stylesheet into the live Foundry renderer via the CDP CSS domain.
   */
  async injectCSS(cssText: string): Promise<string> {
    const traceId = randomUUID();
    const client = this.getClient();
    const { frameTree } = await client.Page.getFrameTree();
    const frameId: string = frameTree.frame.id;
    const { styleSheetId } = await client.CSS.createStyleSheet({ frameId });
    await client.CSS.setStyleSheetText({ styleSheetId, text: cssText });
    this.logger?.debug('VisualMonitorService', traceId, 'Injected CSS stylesheet via CDP.', { styleSheetId });
    return styleSheetId;
  }

  /**
   * Batch-materialize walls, lights, and tokens into a Foundry scene via
   * a single CDP Runtime.evaluate call (Neural Painter).
   */
  async batchCreateDocuments(blueprint: SceneBlueprint): Promise<MaterializationResult> {
    const traceId = randomUUID();
    const client = this.getClient();
    const start = Date.now();

    this.logger?.info('VisualMonitorService', traceId, 'Commencing Neural Painter batch materialization', { 
      sceneId: blueprint.sceneId,
      wallCount: blueprint.walls?.length ?? 0,
      lightCount: blueprint.lights?.length ?? 0,
      tokenCount: blueprint.tokens?.length ?? 0
    });

    const walls = blueprint.walls ?? [];
    const lights = blueprint.lights ?? [];
    const tokens = blueprint.tokens ?? [];

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
      const errorMsg = exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown';
      this.logger?.error('VisualMonitorService', traceId, `Neural Painter CDP error: ${errorMsg}`);
      throw new Error(`[VisualMonitorService] Neural Painter CDP error: ${errorMsg}`);
    }

    const value = result.value as { wallsCreated: number; lightsCreated: number; tokensCreated: number };
    this.logger?.info('VisualMonitorService', traceId, 'Materialization complete.', {
      ...value,
      executionMs: Date.now() - start
    });
    
    return {
      ...value,
      executionMs: Date.now() - start,
    };
  }

  /**
   * Trigger a temporary "Neural Glitch" effect on the Electron window.
   */
  async triggerNeuralGlitch(intensity: number = 1.0): Promise<void> {
    const traceId = randomUUID();
    // 1. Tier 1 (Elite): Delegate to Bridge for FXMaster GPU acceleration
    if (this.foundryAdapter?.isConnected()) {
      try {
        await this.foundryAdapter.triggerFxGlitch(intensity);
        return;
      } catch (err) {
        this.logger?.warn('VisualMonitorService', traceId, `Bridge fx_glitch failed, falling back to CSS: ${(err as Error).message}`);
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
      this.logger?.error('VisualMonitorService', traceId, `triggerNeuralGlitch fallback failed: ${(err as Error).message}`);
    }
  }

  /**
   * Phase 16: Semantic Perception — Reground the current scene via Falcon OCR.
   */
  async regroundScene(sceneId: string): Promise<void> {
    const traceId = randomUUID();
    if (!this.oracle?.isConnected() || !this.nitroLogic) {
      this.logger?.warn('VisualMonitorService', traceId, 'regroundScene: oracle or nitroLogic not configured — skip.');
      return;
    }

    // Skip if perception data already exists for this scene
    const existing = this.oracle.query<{ scene_id: string }>(
      'SELECT scene_id FROM scene_perception WHERE scene_id = ?',
      [sceneId]
    );
    if (existing.length > 0) {
      return;
    }

    this.logger?.info('VisualMonitorService', traceId, `Commencing Semantic Perception Reground for scene: ${sceneId}`);

    // Neural Shroud — mask the model-swap latency with a glitch overlay
    await this.triggerNeuralGlitch(2.5);

    let entities: DetectedEntity[];
    try {
      const screenshot = await this.captureScreenshot(sceneId);
      entities = await this.nitroLogic.ocrAnalyze(screenshot.data);
    } catch (err) {
      this.logger?.error('VisualMonitorService', traceId, `regroundScene OCR failed for ${sceneId}: ${(err as Error).message}`);
      return;
    }

    this.oracle.execute(
      'INSERT OR REPLACE INTO scene_perception (scene_id, detected_entities_json, captured_at) VALUES (?, ?, ?)',
      [sceneId, JSON.stringify(entities), new Date().toISOString()]
    );

    this.logger?.info('VisualMonitorService', traceId, `regroundScene: ${entities.length} entities persisted for scene ${sceneId}`);
  }

  /**
   * Capture a live screenshot and diff it against the stored base map for the scene.
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
   * Capture the current scene atmosphere (lighting/darkness) from Foundry.
   */
  async captureAtmosphere(sceneId: string): Promise<AtmosphereState> {
    const traceId = randomUUID();
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
      const errorMsg = exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown';
      this.logger?.error('VisualMonitorService', traceId, `captureAtmosphere failed: ${errorMsg}`);
      throw new Error(`[VisualMonitorService] captureAtmosphere failed: ${errorMsg}`);
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
      this.logger?.debug('VisualMonitorService', traceId, 'Atmosphere state committed to Oracle.');
    }

    return state;
  }

  /**
   * Retrieve stored atmosphere for a scene from Akashik.db and re-inject
   * it into the Foundry renderer via CDP Runtime.evaluate (Pulse Restore).
   */
  async restoreAtmosphere(sceneId: string): Promise<void> {
    const traceId = randomUUID();
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
    if (!atm) return;

    this.logger?.info('VisualMonitorService', traceId, `Restoring atmosphere for scene: ${sceneId}`);

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
      const errorMsg = exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown';
      this.logger?.error('VisualMonitorService', traceId, `restoreAtmosphere failed: ${errorMsg}`);
      throw new Error(`[VisualMonitorService] restoreAtmosphere failed: ${errorMsg}`);
    }
  }

  /**
   * Phase 28: Neural Shroud — Physically lock/unlock user input.
   */
  async reconnect(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info('VisualMonitorService', traceId, '🔄 Reconnecting Neural Uplink (CDP)...');
    try {
      if (this.client) {
        // Try to close cleanly, ignore errors
        await this.client.close().catch(() => {});
      }
      await this.connect();
      this.logger?.info('VisualMonitorService', traceId, '✅ Neural Uplink Reconnected.');
    } catch (err) {
      this.logger?.error('VisualMonitorService', traceId, `Neural Uplink reconnection failed: ${(err as Error).message}`);
    }
  }

  async setPhysicalLock(locked: boolean): Promise<void> {
    const traceId = randomUUID();
    if (!this.client) {
      this.logger?.error('VisualMonitorService', traceId, 'Cannot set physical lock: CDP client not connected.');
      return;
    }
    this.logger?.info('VisualMonitorService', traceId, `Neural Shroud physical lock set to: ${locked}`);
    
    if (locked) {
      const css = `
        #neural-shroud-lock {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 20000; cursor: wait; pointer-events: all;
          background: rgba(0, 243, 255, 0.05);
        }
      `;
      await this.injectCSS(css);
      await this.client.Runtime.evaluate({
        expression: `if (!document.getElementById('neural-shroud-lock')) {
          const div = document.createElement('div');
          div.id = 'neural-shroud-lock';
          document.body.appendChild(div);
        }`
      });
    } else {
      await this.client.Runtime.evaluate({
        expression: `const el = document.getElementById('neural-shroud-lock'); if (el) el.remove();`
      });
    }
  }

  /**
   * Phase 28: UI Infiltration — Physically corrupt Foundry UI elements.
   */
  async corruptUI(intensity: number = 0.5, type: 'leet' | 'parsel' = 'leet'): Promise<void> {
    const traceId = randomUUID();
    const client = this.getClient();
    
    this.logger?.info('VisualMonitorService', traceId, `Executing UI Infiltration (${type}, intensity=${intensity})`);

    const script = `(async () => {
      const leetMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'z': '2', 'b': '8', 'g': '6' };
      const parselChars = "0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\\\░▒▓█";
      
      const transform = (text) => {
        let out = "";
        for (let char of text) {
          const lower = char.toLowerCase();
          if ("${type}" === 'leet' && leetMap[lower] && Math.random() < ${intensity}) {
            out += leetMap[lower];
          } else if ("${type}" === 'parsel' && Math.random() < ${intensity}) {
            out += parselChars[Math.floor(Math.random() * parselChars.length)];
          } else {
            out += char;
          }
        }
        return out;
      };

      // Target specific high-impact UI components
      const targets = [
        ...document.querySelectorAll('.chat-message .message-header'),
        ...document.querySelectorAll('.chat-message .message-content'),
        ...document.querySelectorAll('#sidebar-tabs .item'),
        ...document.querySelectorAll('.window-title'),
        ...document.querySelectorAll('.scene-name')
      ];

      for (let el of targets) {
        if (el.children.length === 0) {
          el.innerText = transform(el.innerText);
        } else {
          // Walk text nodes for complex elements
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while (walker.nextNode()) {
            node = walker.currentNode;
            node.nodeValue = transform(node.nodeValue);
          }
        }
      }
      return targets.length;
    })()`;

    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: script,
      awaitPromise: true,
      returnByValue: true,
    });

    if (exceptionDetails) {
      this.logger?.error('VisualMonitorService', traceId, `corruptUI injection failed: ${exceptionDetails.text}`);
    } else {
      this.logger?.info('VisualMonitorService', traceId, `📡 UI Infiltration: Corrupted ${result.value} UI nodes via CDP.`);
    }
  }
}
