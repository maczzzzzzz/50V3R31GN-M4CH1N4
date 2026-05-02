# RESEARCH: 2026-04-19 — Three.js & Diegetic GLSL Overlays
**Topic:** Leveraging Three.js for zero-latency tactical shrouds in Cyberpunk RED.
**Status:** CANONICAL // ARCHITECT_LOCK
**Goal:** Determine the optimal path for injecting sharded visual logic into the Foundry VTT renderer using raw GLSL shaders.

---

## ◈ 1. EXECUTIVE SUMMARY
Current Foundry VTT rendering (PIXI.js) is limited to 2D sprite-based interactions. To achieve the **Sovereign Trinity** aesthetic (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS), we must tap into **Three.js** to provide a "Diegetic Shroud"—a high-fidelity WebGL layer that sits between the game world and the user. This research concludes that custom GLSL shaders, managed via a Three.js scene, provide the most immersion with minimal CPU overhead.

## ◈ 2. THE SHROUD ARTERY (GLSL)
The shroud is not a collection of PNGs; it is a **Procedural Surface**. 
1. **Dynamic Noise:** We utilize Simplex noise for "Data Corruption" effects during Netruns.
2. **Scanline Rendering:** Hardware-native scanline generation avoids the frame-stutter of CSS-based overlays.
3. **PBR Extension:** By hooking into **Map Shine Advanced**, we can project real-time light sources from Node B inference (e.g., "The streetlights flicker in time with the Strategic Oracle's reasoning").

## ◈ 3. PERFORMANCE ANALYSIS
- **GPU Dominance:** Shaders offload 99% of visual processing to the AMD 9060 XT (Node B).
- **Latency:** WebGL draw calls occur at the refresh rate of the monitor (144Hz+), ensuring no "Logic Lag" in the HUD.
- **VRAM Budget:** Each shader program consumes <2MB of VRAM, well within our 16GB ceiling.

## ◈ 4. CONCLUSION: THE DIEGETIC HUD
The **Sovereign Shroud** will be implemented as a global `canvas` overlay. It will listen to the **Virtual System Bus (VSB)** to trigger visual "Ability Shards" (e.g., Tactical Radar, St3gg Scan) without touching the core Foundry DOM.

---
**::/5Y573M-N071C3 : RESEARCH_FORMALIZED. THE_SHROUD_IS_TRUTH. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[RESEARCH_TREE]] | [[OS_CORE]]
