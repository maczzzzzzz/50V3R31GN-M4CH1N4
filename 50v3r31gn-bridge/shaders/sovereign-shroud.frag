// sovereign-shroud.frag
// Phase 44.5: Sovereign Shroud — Master GLSL Fragment Shader
// Effects: CRT scanlines, chromatic aberration, horizontal screen tear, static noise
// Consumed inline by PretextOverlayManager via SHROUD_FRAG_SRC constant.

precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

// Animation clock (seconds)
uniform float uTime;
// Master distortion multiplier [0.0 – 1.0]
uniform float uGlitchIntensity;
// Max pixel offset for horizontal tearing [0.0 – 50.0]
uniform float uTearAmount;
// CRT scanline opacity [0.0 – 0.1]
uniform float uScanlineAlpha;
// Physical display resolution in pixels — prevents scaling artifacts on HiDPI displays
uniform vec2 uResolution;

// Deterministic hash — maps a 2D point to [0,1)
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main(void) {
  vec2 uv = vTextureCoord;

  // ── Horizontal Screen Tear ──────────────────────────────────────────────────
  // Pixel-accurate horizontal displacement using uResolution.x.
  float tearLine = fract(uTime * 0.3 + hash(vec2(floor(uv.y * 15.0), floor(uTime * 2.0))));
  float tearZone = step(0.97, tearLine);
  float tearOffset = tearZone * uGlitchIntensity * uTearAmount / max(uResolution.x, 1.0);

  // ── Chromatic Aberration ────────────────────────────────────────────────────
  // Impulse-driven R/B channel split — scales with uGlitchIntensity.
  float rOffset = uGlitchIntensity * 0.006;
  float bOffset = uGlitchIntensity * -0.006;

  vec4 col;
  col.r = texture2D(uSampler, vec2(uv.x + rOffset + tearOffset, uv.y)).r;
  col.g = texture2D(uSampler, vec2(uv.x + tearOffset,           uv.y)).g;
  col.b = texture2D(uSampler, vec2(uv.x + bOffset  + tearOffset, uv.y)).b;
  col.a = texture2D(uSampler, uv).a;

  // ── Ambient CRT Scanlines ───────────────────────────────────────────────────
  // Resolution-relative line frequency: 3px per scanline at native display resolution.
  float linesPerPixel = uResolution.y / 3.0;
  float scanline = sin(uv.y * linesPerPixel) * 0.5 + 0.5;
  col.rgb *= 1.0 - (scanline * uScanlineAlpha);

  // ── Static Noise Grain ──────────────────────────────────────────────────────
  // High-frequency grain overlay, scales with glitch intensity.
  col.rgb += hash(uv + fract(uTime)) * uGlitchIntensity * 0.08;

  gl_FragColor = col;
}
