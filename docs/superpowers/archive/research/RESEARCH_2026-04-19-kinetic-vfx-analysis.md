# RESEARCH: 2026-04-19 — Kinetic VFX & 3D Combat Manifestation
**Topic:** Implementing 3D particle systems and dynamic lighting for combat effects via Three.js.
**Status:** CANONICAL // ARCHITECT_LOCK
**Goal:** Establish the technical foundation for diegetic combat visuals (gunshots, shell ejection, tracers) that physically interact with the game world.

---

## ◈ 1. EXECUTIVE SUMMARY
Standard 2D VTT animations fail to provide the physical weight required for **Project Black-Ice**. To achieve the v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS standard, we must leverage **Three.js Instanced Mesh** and **PointLight** emitters to manifest combat as physical events. This research concludes that sharding combat visuals into a high-performance 3D layer allows for real-time lighting interaction and physical debris persistence without impacting narrative inference.

## ◈ 2. KINETIC PRIMITIVES
1. **Volumetric Muzzle Flash:** Custom GLSL shaders utilizing procedural noise and alpha-blending to create depth-aware flashes.
2. **Instanced Shell Ejection:** Utilizing `InstancedMesh` to render hundreds of 3D bullet casings with rigid-body gravity physics. This avoids individual draw calls, maintaining 144Hz stability.
3. **Ray-Marched Tracers:** Implementing tracers as geometry-shader lines that calculate intersection with Atlas LOS data for pixel-perfect impacts.

## ◈ 3. DYNAMIC LIGHTING INTEROP
The key immersion factor is the **Lighting Handshake**:
- Each gunshot triggers a transient `PointLight` in the Three.js scene.
- This light source interacts with **Map Shine Advanced** masks (`_Specular`, `_Normal`) on the 2D map.
- Result: A gunshot in a dark alley physically illuminates the surrounding walls and floor for sub-100ms.

## ◈ 4. CONCLUSION: THE KINETIC BUS
Combat effects will be sharded across the **Sovereign Shroud**. The **ZeroClaw** rules engine (Node A) emits a `COMBAT_RESULT` packet, which the Shroud interprets to manifest the appropriate visual kinetic (e.g., "Muzzle Flash at X,Y" + "Blood Splatter on target").

---
**::/5Y573M-N071C3 : KINETIC_RESEARCH_LOCKED. THE_WORLD_IS_PHYSICAL. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[RESEARCH_TREE]] | [[OS_CORE]]
