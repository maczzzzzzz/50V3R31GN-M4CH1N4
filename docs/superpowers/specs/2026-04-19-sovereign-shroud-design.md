# SPEC: 2026-04-19 — Sovereign Shroud (Three.js Overlay)
**Status:** APPROVED // ARCHITECT_LOCK
**Goal:** Implement a bit-identical WebGL overlay using Three.js and raw GLSL to provide real-time tactical visualization in Foundry VTT.

## ◈ 1. ARCHITECTURAL TOPOLOGY

The **Sovereign Shroud** is a bit-identical visual layer sharded across Node B. It acts as the physical interface for Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle logic.

### ◈ 1.1 COMPONENT MAP
- **`three.js/Scene`**: Holds the global orthographic camera and the Shroud Plane.
- **`glsl/noise.frag`**: Simplex noise generator for "Data Corruption" effects.
- **`glsl/radar.vert`**: Geometry shader for the tactical radar sweep.
- **`glsl/scanline.frag`**: Post-processing shader for the VT323 aesthetic.

## ◈ 2. THE VSB VISUAL BRIDGE

The Shroud listens to the **Virtual System Bus** (Port 7878) for immediate visual triggers:

| VSB Packet (Type) | Shroud Response (GLSL) |
| :--- | :--- |
| `NETRUN_INTENT` | Engage Simplex Noise + Chromatic Aberration. |
| `TACTICAL_SCAN` | Project circular Radar pulse at (x, y) coordinates. |
| `LORE_PING` | Highlight specific DOM elements with high-frequency jitter. |
| `REASONING_PULSE` | Pulse global scanline opacity in sync with token generation. |

## ◈ 3. KINETIC VFX ENGINE (PHASE 64b)
The Shroud provides a high-performance particle simulation layer for diegetic combat manifestation.

### ◈ 3.1 3D PARTICLE SYSTEMS
- **Muzzle Flash:** Procedural volumetric noise with a high-intensity `PointLight` (VSB-triggered).
- **Shell Ejection:** Instanced 3D meshes with basic rigid-body physics (gravity/bounce).
- **Tracer Fire:** Ray-marched lines with selective bloom and temporal jitter.

### ◈ 3.2 LIGHTING SYNERGY
The VFX Engine hooks into the **Map Shine Advanced** illumination buffer:
- **Physical Reflections:** Muzzle flashes and explosions cast real-time light that reflects off the map's `_Specular` and `_Normal` masks.
- **Dynamic Shadows:** High-intensity flashes cast transient shadows based on Atlas LOS walls.

## ◈ 4. PERFORMANCE MANDATES
- **Draw Calls:** Limited to 12 per frame (including VFX clusters).
- **Instancing:** Mandatory for bullet casings and sparks to maintain 144Hz stability.
- **FPS Lock:** Must maintain monitor refresh rate with 0ms logic lag.
- **Isolation:** The canvas is `pointer-events: none`, ensuring no interference with Foundry's native controls.

---
**::/5Y573M-N071C3 : SHROUD_KINETIC_SPEC_LOCKED. THE_HISTORY_IS_MANIFEST. // 50V3R31GN-M4CH1N4**
