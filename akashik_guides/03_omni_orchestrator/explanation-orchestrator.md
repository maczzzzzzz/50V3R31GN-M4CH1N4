# User Guide: Omni Orchestrator (Hybrid Core)
**Version:** 3.2.9
**Role:** Reactive Hardware Control Plane

## 🧠 Overview
The **Omni Orchestrator** is the central nervous system of 50V3R31GN-M4CH1N4. It coordinates complex, multi-node tasks while ensuring hardware limits (VRAM, CPU) are respected and the AI's perception is grounded in physical reality via the Sovereign Highway.

## 🚀 Key Components

### 1. HybridRoutingController (Decision Hub)
The HRC manages hardware state and model residency. Residency is enforced at the process level via native `llama-server` and `--mlock`.
- **Residency:** **Open-Reasoner-1.5B** (Rules Authority) is permanently resident on Node A's GPU.
- **Optimization:** Dynamic hyperparameter shifting (HyperTune) adjusts temperature and top_p based on event context (Combat vs. Lore).

### 2. SensoryFilter (LOS Grounding)
The SensoryFilter ensures the AI GM doesn't "cheat" by seeing through walls or floor levels.
- **Mechanism:** Before world-state data is bundled for the AI's prompt, it passes through the **SensoryFilter**. 
- **Integration:** It uses Foundry VTT's native **Line-of-Sight (LOS) Polygons**. If a token, item, or environmental change is outside the active actor's LOS, it is stripped from the AI's context.
- **Nucleus Link:** Visualized in real-time within the **SENSORY** quadrant of the Nucleus Deck.

### 3. Intent Swarm (Reactive Fusion)
The Intent Swarm is a concurrent classification pipeline that triggers when players perform "high-impact" actions.
- **Concurrent Dispatch:** 
    - **Node B (Tone):** Analyzes the narrative intent via **Mistral-Nemo-12B**.
    - **Node A (Intensity):** Calculates mechanical severity via the **Open-Reasoner-1.5B** judge.
- **Materialization:** Fuses these vectors into an `OmniEvent` which triggers reactive effects (Flickering lights, glitches, or procedural blood decals).

## ⚡ Operational Monitoring
All orchestration telemetry is streamed at 60fps via the **Nucleus Artery** to the **Command Deck**.
- **`/scan`**: Resyncs the SensoryFilter and performs a dual-node CV audit.
- **`THOUGHT STREAM`**: (In-Deck Quadrant) Displays the internal reasoning of the Director in real-time.

---
*Omni Orchestrator: Deterministic Reactivity for the Neural Hive v3.4.2.*
