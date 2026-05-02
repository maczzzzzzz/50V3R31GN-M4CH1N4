/**
 * ◈ SHROUD_ENGINE : HARDENED_ARTERY_OVERLAY — v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 *
 * Three.js / GLSL WebGL overlay for clinical immersion.
 * Renders diegetic HUD pulses, scan lines, and VSB packet flashes.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// GLSL Shaders
// ---------------------------------------------------------------------------

const SCANLINE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Scan-line fragment shader.
 * Clinical industrial standard.
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
    // Sharp industrial scan-lines
    float scanFreq  = 160.0;
    float scanSpeed = 0.2;
    float scan      = sin((vUv.y * scanFreq) - uTime * scanSpeed);
    float scanAlpha = smoothstep(0.7, 1.0, scan) * 0.12 * uIntensity;

    // Digital noise grain
    float noise = rand(vUv + vec2(uTime * 0.01)) * 0.02 * uIntensity;

    // Clinical Vignette
    vec2  centered = vUv - 0.5;
    float vignette  = 1.0 - smoothstep(0.4, 0.8, length(centered));

    float alpha = (scanAlpha + noise) * vignette;
    gl_FragColor  = vec4(uColor, alpha);
  }
`;

const PULSE_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PULSE_FRAG = /* glsl */`
  uniform float uTime;
  uniform float uBorn;
  uniform float uLife;
  uniform vec2  uOrigin;
  uniform vec3  uColor;
  uniform float uIntensity;
  varying vec2  vUv;

  void main() {
    float age      = uTime - uBorn;
    float progress = clamp(age / uLife, 0.0, 1.0);

    float radius = progress * 0.8;
    float dist   = distance(vUv, uOrigin);

    // Squared-off industrial ring
    float ringWidth = 0.01 * (1.0 - progress * 0.8);
    float ring      = smoothstep(ringWidth, 0.0, abs(dist - radius));

    float fade    = 1.0 - pow(progress, 2.0);
    float alpha   = ring * fade * uIntensity;

    gl_FragColor  = vec4(uColor, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Clinical Constants
// ---------------------------------------------------------------------------

const PULSE_COLORS = {
  vsb:       new THREE.Color(0xF36622), // Machina Rust
  security:  new THREE.Color(0xffffff), // Clinical White
  memory:    new THREE.Color(0xC7A87A), // Sovereign Gold
  perception: new THREE.Color(0x8EC07C), // Artery Green
};

const PULSE_LIFE = {
  vsb:        1.0,
  security:   2.5,
  memory:     1.5,
  perception: 1.8,
  kinetic:    0.8,
};

export class ShroudEngine {
  constructor(canvas) {
    this._canvas    = canvas;
    this._renderer  = null;
    this._scene     = null;
    this._camera    = null;
    this._clock     = new THREE.Clock();
    this._raf       = null;
    this._pulses    = [];
    this._particles = [];
    this._scanMesh  = null;
    this._scanUniforms = null;
    this._disposed  = false;

    this._init();
  }

  _init() {
    const { width, height } = this._canvas.getBoundingClientRect();

    this._renderer = new THREE.WebGLRenderer({
      canvas: this._canvas,
      alpha: true,
      antialias: false,
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(width || window.innerWidth, height || window.innerHeight, false);
    this._renderer.setClearColor(0x000000, 0);

    this._camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this._camera.position.z = 1;

    this._scene = new THREE.Scene();

    this._buildScanLayer();
    this._bindResize();
  }

  _buildScanLayer() {
    const geo = new THREE.PlaneGeometry(1, 1);
    this._scanUniforms = {
      uTime:      { value: 0 },
      uIntensity: { value: 0.5 },
      uColor:     { value: new THREE.Color(0xF36622) },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader:   SCANLINE_VERT,
      fragmentShader: SCANLINE_FRAG,
      uniforms:       this._scanUniforms,
      transparent:    true,
      depthWrite:     false,
    });
    this._scanMesh = new THREE.Mesh(geo, mat);
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

  start() {
    this._clock.start();
    this._tick();
    return this;
  }

  pulse(opts = {}) {
    const type      = opts.type ?? 'vsb';
    const origin    = opts.origin ?? [0.5, 0.5];
    const intensity = opts.intensity ?? 1.0;
    const born      = this._clock.getElapsedTime();

    if (type === 'kinetic') {
      this._createKineticBurst(origin, intensity);
      return this;
    }

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
    this._scene.add(mesh);
    this._pulses.push({ mesh, uniforms, born, life });
    return this;
  }

  _createKineticBurst(origin, intensity) {
    const count = Math.floor(30 * intensity);
    const born  = this._clock.getElapsedTime();
    const life  = PULSE_LIFE.kinetic;
    
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = origin[0] - 0.5;
      pos[i * 3 + 1] = origin[1] - 0.5;
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = (0.015 + Math.random() * 0.05) * intensity;
      vel[i * 3 + 0] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = Math.sin(angle) * speed;
      vel[i * 3 + 2] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xF36622,
      size: 0.004,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    this._scene.add(points);
    this._particles.push({ mesh: points, vel, born, life });
  }

  setScanIntensity(v) {
    if (this._scanUniforms) this._scanUniforms.uIntensity.value = Math.max(0, Math.min(1, v));
  }

  dispose() {
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this._scene.clear();
    this._renderer.dispose();
  }

  _tick() {
    if (this._disposed) return;
    this._raf = requestAnimationFrame(() => this._tick());

    const t = this._clock.getElapsedTime();

    if (this._scanUniforms) this._scanUniforms.uTime.value = t;

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

    const aliveParticles = [];
    for (const p of this._particles) {
      const age = t - p.born;
      if (age >= p.life) {
        this._scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      } else {
        const pos = p.mesh.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 0] += p.vel[i * 3 + 0];
          pos[i * 3 + 1] += p.vel[i * 3 + 1];
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
        p.mesh.material.opacity = 1.0 - (age / p.life);
        aliveParticles.push(p);
      }
    }
    this._particles = aliveParticles;

    this._renderer.render(this._scene, this._camera);
  }
}
