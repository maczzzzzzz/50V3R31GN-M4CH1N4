# Sovereign Shroud & Kinetic VFX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the Three.js Shroud and Kinetic VFX Engine (Phase 64b) to provide diegetic tactical visualization and 3D combat manifestation.

**Architecture:** A Three.js `WebGLRenderer` injected over the Foundry canvas. Uses `InstancedMesh` for physics-based particles and custom GLSL shaders for volumetric VFX.

**Tech Stack:** Three.js, GLSL, VSB (UDP), JavaScript (foundry-bridge).

---

### Task 1: Environment Ignition (Three.js Setup)

**Files:**
- Create: `50v3r31gn-bridge/scripts/shroud-engine.js`
- Modify: `50v3r31gn-bridge/module.json`

- [ ] **Step 1: Initialize the Shroud canvas**

```javascript
export class ShroudEngine {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        document.body.appendChild(this.renderer.domElement);
    }
}
```

- [ ] **Step 2: Define the Shroud Plane**
  - Create a full-screen plane using `PlaneGeometry`.
  - Apply a temporary `ShaderMaterial` with a red-glow boundary.

- [ ] **Step 3: Commit**
  ```bash
  git add 50v3r31gn-bridge/scripts/shroud-engine.js
  git commit -m "feat(ui): initialize three.js shroud engine"
  ```

---

### Task 2: Tactical Visualization (Radar & Noise)

**Files:**
- Create: `50v3r31gn-bridge/shaders/radar.frag`
- Create: `50v3r31gn-bridge/shaders/noise.frag`

- [ ] **Step 1: Implement circular pulse shader (Radar)**

```glsl
uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float dist = distance(uv, mouse);
    float pulse = step(0.1, abs(sin(dist * 10.0 - time)));
    gl_FragColor = vec4(1.0, 0.1, 0.1, pulse * 0.5);
}
```

- [ ] **Step 2: Implement Simplex Noise shader (Netrun Glitch)**

- [ ] **Step 3: Commit**
  ```bash
  git add 50v3r31gn-bridge/shaders/
  git commit -m "feat(glsl): implement tactical radar and noise shaders"
  ```

---

### Task 3: Kinetic VFX (Gunshots & Physics)

**Files:**
- Create: `50v3r31gn-bridge/scripts/vfx-processor.js`

- [ ] **Step 1: Implement 3D Muzzle Flash**
  - Create a `PointLight` and a `Sprite` with procedural noise material.
  - Trigger via `SHOOT_INTENT` VSB packet.

- [ ] **Step 2: Implement Instanced Shell Ejection**
  - Use `InstancedMesh` to render 3D casing meshes.
  - Implement basic gravity and velocity updates per frame.

- [ ] **Step 3: Commit**
  ```bash
  git add 50v3r31gn-bridge/scripts/vfx-processor.js
  git commit -m "feat(vfx): implement 3D muzzle flash and instanced shell ejection"
  ```

---

### Task 4: Lighting & Map Shine Synergy

**Files:**
- Modify: `50v3r31gn-bridge/50v3r31gn-bridge.js`

- [ ] **Step 1: Hook into Map Shine advanced illumination**
  - Point the Three.js `PointLight` targets to the map background layer.
  - Ensure light interacts with `_Specular` and `_Normal` suffixes.

- [ ] **Step 2: Final Integration Test**
  - Perform a dummy combat sequence on Node B.
  - Verify lighting reflects off "polilshed metal" map regions.

- [ ] **Step 3: Commit**
  ```bash
  git add 50v3r31gn-bridge/50v3r31gn-bridge.js
  git commit -m "feat(vfx): establish physical lighting synergy with Map Shine"
  ```
