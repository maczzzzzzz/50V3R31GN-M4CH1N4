/**
 * pretext-overlay-manager.js
 *
 * Phase 17: Layout Sovereignty (Pretext Engine)
 * Phase 44.5: Sovereign Shroud — WebGL-accelerated Master Shroud singleton
 * Manages the high-performance canvas overlay for 0-reflow text rendering.
 */

// ── Sovereign Shroud GLSL Fragment Shader ─────────────────────────────────────
const SHROUD_FRAG_SRC = `
precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uTearAmount;
uniform float uScanlineAlpha;
// Physical display resolution in pixels — prevents scaling artifacts on HiDPI displays
uniform vec2 uResolution;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main(void) {
  vec2 uv = vTextureCoord;

  // Horizontal screen tear — pixel-accurate displacement using uResolution.x
  float tearLine = fract(uTime * 0.3 + hash(vec2(floor(uv.y * 15.0), floor(uTime * 2.0))));
  float tearZone = step(0.97, tearLine);
  float tearOffset = tearZone * uGlitchIntensity * uTearAmount / max(uResolution.x, 1.0);

  // Chromatic aberration — R/G/B channel horizontal split mapped to uGlitchIntensity
  float rOffset = uGlitchIntensity * 0.006;
  float bOffset = uGlitchIntensity * -0.006;

  vec4 col;
  col.r = texture2D(uSampler, vec2(uv.x + rOffset + tearOffset, uv.y)).r;
  col.g = texture2D(uSampler, vec2(uv.x + tearOffset,           uv.y)).g;
  col.b = texture2D(uSampler, vec2(uv.x + bOffset  + tearOffset, uv.y)).b;
  col.a = texture2D(uSampler, uv).a;

  // Ambient CRT scanlines — resolution-relative line frequency (3px per line at native res)
  float linesPerPixel = uResolution.y / 3.0;
  float scanline = sin(uv.y * linesPerPixel) * 0.5 + 0.5;
  col.rgb *= 1.0 - (scanline * uScanlineAlpha);

  // Static noise grain
  col.rgb += hash(uv + fract(uTime)) * uGlitchIntensity * 0.08;

  gl_FragColor = col;
}
`.trim();

const VT323_FONT_NAME = 'VT323-Sovereign';

export class PretextOverlayManager {
  static activeOverlays = new Map();
  static shroud = null;
  static shroudFilter = null;
  static _glitchResetTimer = null;
  static _tickHandle = null;

  static init() {
    console.log('[PretextOverlayManager] Initialized');
    this.activeOverlays = new Map();

    // Defer shroud init until the canvas is fully ready, then register reattach
    // for all subsequent scene changes.  Registering 'canvasReady' only AFTER the
    // first init prevents double-initialization (Hooks.once + Hooks.on both firing
    // on the same event when canvas is not yet ready at module load time).
    const registerReattach = () => {
      Hooks.on('canvasReady', () => this._reattachShroud());
    };

    if (typeof canvas !== 'undefined' && canvas.ready) {
      this._initShroud();
      registerReattach();
    } else {
      Hooks.once('canvasReady', () => {
        this._initShroud();
        registerReattach();
      });
    }
  }

  // ── Shroud Singleton ────────────────────────────────────────────────────────

  static _initShroud() {
    if (typeof PIXI === 'undefined') {
      console.warn('[PretextOverlayManager] PIXI not available — Shroud deferred');
      return;
    }

    // Install VT323 BitmapFont atlas from system font if not already present
    if (!PIXI.BitmapFont.available?.[VT323_FONT_NAME]) {
      try {
        PIXI.BitmapFont.from(VT323_FONT_NAME, {
          fontFamily: 'VT323, monospace',
          fontSize: 24,
          fill: '#ff003c',
        }, { chars: PIXI.BitmapFont.ASCII });
      } catch (e) {
        console.warn('[PretextOverlayManager] VT323 BitmapFont install failed:', e);
      }
    }

    // Build Master Shroud container
    const shroud = new PIXI.Container();
    shroud.name = 'SovereignShroud';
    shroud.label = 'SovereignShroud';
    shroud.sortableChildren = false;
    shroud.interactiveChildren = false;

    // Build GLSL filter with initial uniforms
    const resW = canvas.app?.renderer?.width ?? window.innerWidth ?? 1920;
    const resH = canvas.app?.renderer?.height ?? window.innerHeight ?? 1080;
    let filter = null;
    try {
      filter = new PIXI.Filter(undefined, SHROUD_FRAG_SRC, {
        uTime: 0.0,
        uGlitchIntensity: 0.0,
        uTearAmount: 30.0,
        uScanlineAlpha: 0.04,
        uResolution: [resW, resH],
      });
      shroud.filters = [filter];
    } catch (e) {
      console.warn('[PretextOverlayManager] Shroud shader compile failed — running without filter:', e);
    }

    // Attach to canvas.interface (InterfaceCanvasGroup — correct layer for floating UI in Foundry v12)
    canvas.interface.addChild(shroud);
    this.shroud = shroud;
    this.shroudFilter = filter;

    // Start animation tick for uTime
    this._startTick();

    console.log('[PretextOverlayManager] SovereignShroud ONLINE | filter=' + (filter ? '✓' : '✗'));
  }

  static _reattachShroud() {
    // Explicitly destroy the previous filter and container to free VRAM.
    // Foundry destroys and recreates canvas.interface on every scene change,
    // so the old shroud child reference becomes stale — always build fresh.
    if (this._tickHandle) {
      cancelAnimationFrame(this._tickHandle);
      this._tickHandle = null;
    }
    if (this.shroudFilter) {
      try { this.shroudFilter.destroy(); } catch { /* already destroyed by PIXI */ }
      this.shroudFilter = null;
    }
    if (this.shroud) {
      try { this.shroud.destroy({ children: true }); } catch { /* already destroyed */ }
      this.shroud = null;
    }
    this._initShroud();
  }

  static _startTick() {
    if (this._tickHandle) return;
    let lastResCheck = 0;
    const tick = () => {
      if (this.shroudFilter?.uniforms) {
        this.shroudFilter.uniforms.uTime = performance.now() / 1000.0;
        // Update uResolution every 2 seconds to catch window/canvas resize events
        const now = Date.now();
        if (now - lastResCheck > 2000) {
          const resW = canvas.app?.renderer?.width ?? window.innerWidth ?? 1920;
          const resH = canvas.app?.renderer?.height ?? window.innerHeight ?? 1080;
          this.shroudFilter.uniforms.uResolution = [resW, resH];
          lastResCheck = now;
        }
      }
      this._tickHandle = requestAnimationFrame(tick);
    };
    this._tickHandle = requestAnimationFrame(tick);
  }

  /**
   * Set persistent shroud shader parameters from the Narrative Client.
   * @param {{ scanlineAlpha?: number, glitchIntensity?: number }} params
   */
  static setShroudParams({ scanlineAlpha, glitchIntensity } = {}) {
    if (!this.shroudFilter?.uniforms) return;
    if (scanlineAlpha    != null) this.shroudFilter.uniforms.uScanlineAlpha    = Math.min(1.0, Math.max(0.0, scanlineAlpha));
    if (glitchIntensity  != null) this.shroudFilter.uniforms.uGlitchIntensity  = Math.min(1.0, Math.max(0.0, glitchIntensity));
  }

  /**
   * Trigger a glitch impulse — temporarily spikes uGlitchIntensity and decays back to 0.
   * @param {number} intensity  0.0–1.0
   * @param {number} duration   ms before decay completes
   */
  static glitchImpulse(intensity = 0.5, duration = 500) {
    if (!this.shroudFilter?.uniforms) return;

    this.shroudFilter.uniforms.uGlitchIntensity = Math.min(1.0, Math.max(0.0, intensity));

    if (this._glitchResetTimer) clearTimeout(this._glitchResetTimer);
    this._glitchResetTimer = setTimeout(() => {
      if (this.shroudFilter?.uniforms) this.shroudFilter.uniforms.uGlitchIntensity = 0.0;
      this._glitchResetTimer = null;
    }, duration);
  }

  // ── Overlay Drawing ─────────────────────────────────────────────────────────

  /**
   * Draws a dynamic status overlay over a token using a detached canvas.
   * @param {PretextOverlayPayload} payload
   */
  static async drawOverlay(payload) {
    const token = canvas.tokens.get(payload.targetId);
    if (!token) {
      console.warn(`[Pretext] Token ${payload.targetId} not found for overlay.`);
      return;
    }

    console.log(`[Pretext] Drawing overlay: "${payload.text}" for actor ${payload.targetId}`);

    // 1. Create/Get Overlay Container on canvas.interface
    let container = this.activeOverlays.get(payload.targetId);
    if (!container) {
      container = new PIXI.Container();
      container.name = `pretext-${payload.targetId}`;
      canvas.interface.addChild(container);
      this.activeOverlays.set(payload.targetId, container);
    }

    // 2. Render text — prefer BitmapText with VT323 atlas, fall back to PIXI.Text
    let textObj;
    const vt323Available = !!PIXI.BitmapFont.available?.[VT323_FONT_NAME];
    if (vt323Available) {
      textObj = new PIXI.BitmapText(payload.text, {
        fontName: VT323_FONT_NAME,
        fontSize: 24,
        tint: parseInt((payload.color ?? '#ff003c').replace('#', ''), 16),
      });
    } else {
      const style = new PIXI.TextStyle({
        fontFamily: 'VT323, monospace',
        fontSize: 24,
        fontWeight: 'bold',
        fill: payload.color || '#ff003c',
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 2,
      });
      textObj = new PIXI.Text(payload.text, style);
    }

    textObj.anchor?.set(0.5, 1);
    textObj.position.set(token.center.x, token.y - 20);
    container.addChild(textObj);

    // 2b. Optional Glitch/Parseltongue Effect
    if (payload.glitch) {
      const originalText = payload.text;
      const glitchChars = "0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\░▒▓█";
      const leetMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'g': '6', 'b': '8' };

      const glitchInterval = setInterval(() => {
        if (!textObj.parent) { clearInterval(glitchInterval); return; }
        let newText = '';
        for (let i = 0; i < originalText.length; i++) {
          const char = originalText[i].toLowerCase();
          if (Math.random() < 0.2) {
            newText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else if (leetMap[char] && Math.random() < 0.5) {
            newText += leetMap[char];
          } else {
            newText += originalText[i];
          }
        }
        if (textObj.text !== undefined) textObj.text = newText;
      }, 100);

      setTimeout(() => clearInterval(glitchInterval), payload.duration || 3000);
    }

    // 3. Apply FXMaster Shaders if requested
    if (payload.fxParams && window.FXMASTER && game.modules.get('fxmaster')?.active) {
      const filterName = `pretext-fx-${payload.targetId}-${Date.now()}`;
      try {
        await FXMASTER.filters.addFilter(filterName, payload.fxParams.shader, payload.fxParams);
        setTimeout(() => { FXMASTER.filters.removeFilter(filterName); }, payload.duration || 3000);
      } catch (err) {
        console.error('[Pretext] FXMaster error:', err);
      }
    }

    // 4. Animation and Cleanup (upward float + fade)
    const duration = payload.duration || 3000;
    const startY = textObj.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      if (progress < 1) {
        textObj.y = startY - (progress * 50);
        textObj.alpha = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        container.removeChild(textObj);
        // Explicitly release GPU memory — PIXI Text/BitmapText objects accumulate
        // in VRAM if only removed from the scene graph without being destroyed.
        textObj.destroy({ texture: false, baseTexture: false });
        if (container.children.length === 0) {
          canvas.interface.removeChild(container);
          this.activeOverlays.delete(payload.targetId);
        }
      }
    };

    requestAnimationFrame(animate);
  }
}
