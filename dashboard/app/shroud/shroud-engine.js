/**
 * dashboard/app/shroud/shroud-engine.js
 *
 * Phase 64 — Sovereign Shroud Engine
 *
 * Three.js / GLSL WebGL overlay for tactical immersion on Node B.
 * Renders diegetic HUD pulses, scan lines, and VSB packet flashes
 * directly on a full-screen transparent canvas over the dashboard.
 *
 * Aesthetic invariants (dashboard/AGENTS.md):
 *   - VT323 / Cyberpunk RED visual language
 *   - PBR-adjacent lighting hooks for future Map Shine integration
 *   - Sub-10ms VSB state mirroring via the useShroud React hook
 *
 * Usage:
 *   import { ShroudEngine } from './shroud-engine.js';
 *   const engine = new ShroudEngine(canvasElement);
 *   engine.start();
 *   engine.pulse({ type: 'vsb', intensity: 0.8, color: 0x00ff88 });
 *   engine.dispose();
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

/**
 * Scan-line vertex shader.
 * Passes UV coordinates and the current time to the fragment shader.
 */
const SCANLINE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Scan-line fragment shader.
 * Draws a drifting horizontal scan-line overlay with subtle vignette and
 * phosphor noise — Cyberpunk RED CRT aesthetic.
 */
const SCANLINE_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3  uColor;
  varying vec2  vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Scan-line bands: 2px bright / 2px dark at 60Hz drift
    float scanFreq  = 120.0;
    float scanSpeed = 0.4;
    float scan      = sin((vUv.y * scanFreq) - uTime * scanSpeed);
    float scanAlpha = smoothstep(0.6, 1.0, scan) * 0.15 * uIntensity;

    // Phosphor noise
    float noise = rand(vUv + vec2(uTime * 0.01)) * 0.03 * uIntensity;

    // Vignette
    vec2  centered = vUv - 0.5;
    float vignette  = 1.0 - smoothstep(0.35, 0.75, length(centered));

    float alpha = (scanAlpha + noise) * vignette;
    gl_FragColor  = vec4(uColor, alpha);
  }
`;

/**
 * VSB pulse fragment shader.
 * Radiates an outward ring from the pulse origin — used to visualise
 * incoming VSB binary state packets.
 */
const PULSE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PULSE_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uBorn;    // timestamp when pulse was created (seconds)
  uniform float uLife;    // total lifetime in seconds
  uniform vec2  uOrigin;  // NDC origin [0,1]
  uniform vec3  uColor;
  uniform float uIntensity;
  varying vec2  vUv;

  void main() {
    float age      = uTime - uBorn;
    float progress = clamp(age / uLife, 0.0, 1.0);

    // Expanding ring radius [0.0 → 0.6]
    float radius = progress * 0.6;
    float dist   = distance(vUv, uOrigin);

    // Ring thickness tapers as it expands
    float ringWidth = 0.015 * (1.0 - progress * 0.7);
    float ring      = smoothstep(ringWidth, 0.0, abs(dist - radius));

    // Fade out over lifetime
    float fade    = 1.0 - progress;
    float alpha   = ring * fade * uIntensity;

    gl_FragColor  = vec4(uColor, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Pulse descriptor
// ---------------------------------------------------------------------------

/**
 * @typedef {'vsb' | 'combat' | 'economy' | 'alert'} PulseType
 */

const PULSE_COLORS = {
  vsb:     new THREE.Color(0x00ff88),
  combat:  new THREE.Color(0xff2233),
  economy: new THREE.Color(0xffcc00),
  alert:   new THREE.Color(0xff6600),
};

const PULSE_LIFE = {
  vsb:     1.2,
  combat:  2.0,
  economy: 1.6,
  alert:   1.8,
};

// ---------------------------------------------------------------------------
// ShroudEngine
// ---------------------------------------------------------------------------

export class ShroudEngine {
  /**
   * @param {HTMLCanvasElement} canvas — Full-screen overlay canvas
   */
  constructor(canvas) {
    this._canvas    = canvas;
    this._renderer  = null;
    this._scene     = null;
    this._camera    = null;
    this._clock     = new THREE.Clock();
    this._raf       = null;
    this._pulses    = []; // Array of { mesh, uniforms, born, life }
    this._scanMesh  = null;
    this._scanUniforms = null;
    this._disposed  = false;

    this._init();
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  _init() {
    const { width, height } = this._canvas.getBoundingClientRect();

    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(width || window.innerWidth, height || window.innerHeight, false);
    this._renderer.setClearColor(0x000000, 0);

    // Orthographic camera — one NDC unit fills the screen
    this._camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this._camera.position.z = 1;

    this._scene = new THREE.Scene();

    this._buildScanLayer();
    this._bindResize();
  }

  /** Full-screen quad for the persistent scan-line overlay */
  _buildScanLayer() {
    const geo = new THREE.PlaneGeometry(1, 1);
    this._scanUniforms = {
      uTime:      { value: 0 },
      uIntensity: { value: 0.6 },
      uColor:     { value: new THREE.Color(0x00ff88) },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader:   SCANLINE_VERT,
      fragmentShader: SCANLINE_FRAG,
      uniforms:       this._scanUniforms,
      transparent:    true,
      depthWrite:     false,
    });
    this._scanMesh = new THREE.Mesh(geo, mat);
    this._scanMesh.renderOrder = 0;
    this._scene.add(this._scanMesh);
  }

  _bindResize() {
    this._onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this._renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', this._onResize);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Start the render loop */
  start() {
    this._clock.start();
    this._tick();
    return this;
  }

  /**
   * Fire a tactical pulse at the given NDC origin.
   *
   * @param {{ type?: PulseType, origin?: [number,number], intensity?: number }} opts
   */
  pulse(opts = {}) {
    const type      = opts.type ?? 'vsb';
    const origin    = opts.origin ?? [0.5, 0.5];
    const intensity = opts.intensity ?? 1.0;
    const born      = this._clock.getElapsedTime();
    const life      = PULSE_LIFE[type] ?? 1.5;
    const color     = PULSE_COLORS[type] ?? new THREE.Color(0xffffff);

    const geo = new THREE.PlaneGeometry(1, 1);
    const uniforms = {
      uTime:      { value: born },
      uBorn:      { value: born },
      uLife:      { value: life },
      uOrigin:    { value: new THREE.Vector2(origin[0], origin[1]) },
      uColor:     { value: color },
      uIntensity: { value: intensity },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader:   PULSE_VERT,
      fragmentShader: PULSE_FRAG,
      uniforms,
      transparent:    true,
      depthWrite:     false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 1;
    this._scene.add(mesh);
    this._pulses.push({ mesh, uniforms, born, life });
    return this;
  }

  /**
   * Adjust the scan-line intensity (0–1).
   * Call this to dim the overlay during high-contrast scenes.
   * @param {number} v
   */
  setScanIntensity(v) {
    if (this._scanUniforms) this._scanUniforms.uIntensity.value = Math.max(0, Math.min(1, v));
  }

  /** Dispose all GPU resources */
  dispose() {
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this._scene.clear();
    this._renderer.dispose();
  }

  // ── Render loop ────────────────────────────────────────────────────────────

  _tick() {
    if (this._disposed) return;
    this._raf = requestAnimationFrame(() => this._tick());

    const t = this._clock.getElapsedTime();

    // Update scan-line time
    if (this._scanUniforms) this._scanUniforms.uTime.value = t;

    // Update and cull dead pulses
    const alive = [];
    for (const p of this._pulses) {
      const age = t - p.born;
      if (age >= p.life) {
        this._scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      } else {
        p.uniforms.uTime.value = t;
        alive.push(p);
      }
    }
    this._pulses = alive;

    this._renderer.render(this._scene, this._camera);
  }
}
