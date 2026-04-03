# Design Spec: Phase 15 — Omni Orchestrator (v1.4.0)

**Status:** ✅ FINALIZED  
**Architecture:** Distributed Swarm Intelligence  
**Focus:** High-Fidelity Reactive World-State

---

## 1. Overview
The **Omni Orchestrator** is the "Central Nervous System" of the ASP-GM-Agent. it fuses the narrative director (Node B), the rules authority (Node A), and the physical materializer (Foundry Bridge) into a single, reactive loop. It translates player actions and rules resolutions into high-fidelity atmospheric and physical events.

## 2. Core Components

### 2.1 The Intent Swarm (Reasoning)
Instead of linear reasoning, the Orchestrator dispatches a **Parallel Classification Task**:
- **Task A (Rules):** "Given this Damage/Roll, what is the mechanical intensity (1-10)?"
- **Task B (Narrative):** "Given this conversation history, what is the current tone (Noir, Combat, Stealth)?"
- **Reconciliation:** Fuses results into a **Response Profile** (e.g., `HEAVY_COMBAT_NOIR`).

### 2.2 The Profile Engine (Execution)
Profiles map narrative/mechanical states to atomic Bridge commands:
- **`LIGHT_GLITCH`**: Triggers CSS `neural-glitch` at intensity 0.5.
- **`CRITICAL_STRIKE`**: Triggers **Sequencer** SFX + **FXMaster** Aberration + **Splatter** blood decal.
- **`SYSTEM_PURGE`**: Triggers full-screen blackout + **Falcon** Force-Scan.

### 2.3 Sequential Grounding (Perception)
- **Fast Mode:** Uses Pixel-Diff Stride comparison for movement detection.
- **Semantic Mode (Falcon):** Triggered on "Force Scan" or Scene Start. 
- **The "Model Swap" Protocol:** 
  1. Trigger "Net Connection Lag" UI glitch.
  2. Unload Llama 3.2.
  3. Load Falcon Perception.
  4. Perform Scan → Update Akashik.db.
  5. Reload Llama 3.2 → Resume Narrative.

## 3. Data Flow
1. **Event Trigger:** (e.g., Attack Roll result via HybridController).
2. **Swarm Dispatch:** `Promise.all([NodeA_Scalar, NodeB_Tone])`.
3. **Profile Selection:** Match `(Intensity, Tone)` to `bridge-layers.css` target.
4. **Physicalization:** Send command to `asp-gm-bridge`.
5. **Memory Commit:** Log event to `Akashik.db` for future RAG grounding.

## 4. Hardware Efficiency
- **Atmosphere First:** Prioritize CSS/Shaders over high-poly geometry.
- **Sequential VRAM:** Model swapping on Node A prevents OOM errors on the 1050 Ti.
- **Stride Diffing:** Continuous monitoring uses 25% CPU overhead.

---
*Omni Orchestrator: The World Engine is Awake.*
