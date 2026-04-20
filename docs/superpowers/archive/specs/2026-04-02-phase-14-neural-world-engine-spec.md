# Design Specification: Phase 14 — Neural World Engine (v3.2.19)
**Subject:** Reactive Environments, Visual Diffing, and Latent Persistence
**Status:** DESIGN FINALIZED (Hardware Hardened)

## 1. Executive Summary
Phase 14 introduces physical reactivity to the TRPG environment. It establishes a "Visual Diff" engine to stabilize AI perception and an "Action-Conditioned" materialization loop that applies environmental damage based on mechanical outcomes. By pivoting from on-the-fly diffusion to intelligent asset-mapping, we maintain the v3.2.19 performance baseline while achieving high-fidelity environmental persistence.

## 2. Component Architecture

### 2.1 The Visual Diff Engine (Perception Layer)
Stabilizes the "Project Eyes-On" pipeline by isolating the map geometry from transient UI elements.
- **Mechanism:** Performs a pixel-level subtraction between the live CDP screenshot and the "Pristine Asset" stored in **`Akashik.db`**.
- **Result:** The AI "sees through" tokens, templates, and measurement lines to maintain 100% geometric grounding.

### 2.2 Neural Asset Mapping (Materialization Layer)
Replaces expensive generative loops with high-speed tactical selection.
- **The Library:** A curated repository of transparent "Neural Decals" representing Cyberpunk RED environmental effects (Ablation, Crits, Explosions).
- **The Trigger:** The **Swarm Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle** (Node A) emits "Environmental Delta" signals alongside math results.
- **The Action:** Node B selects the corresponding decal and uses the Neural Uplink to stamp it onto the Foundry canvas at the event's coordinates.

### 2.3 Latent Atmosphere (Persistence Layer)
Ensures sensory consistency across sessions.
- **The Vector:** Stores a "Latent State" object for every scene in **`Akashik.db`** (e.g. `{ lighting: "#ff003c", animation: "flicker", intensity: 0.4 }`).
- **The Restoration:** Automatically re-injects these parameters via CDP when a map is activated, ensuring the "Soul" of a location remains intact.

## 3. Technical Constraints
- **Latency:** Asset selection and injection must complete in **<200ms**.
- **VRAM:** Must maintain <50MB overhead to protect the Omni-Orchestrator buffer.

## 4. Tooling: The World Engine Hub
- `diff_scene_state()`: Identifies physical changes on the map.
- `apply_neural_decal(type, x, y)`: Physically stamps damage onto the canvas.
- `restore_latent_atmosphere()`: Re-aligns the sensory environment with the Akashik Record.
