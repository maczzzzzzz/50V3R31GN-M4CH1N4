# User Guide: Omni Orchestrator (Phase 18)
**Version:** 1.6.0
**Role:** Reactive Hardware Control Plane

## 🧠 Overview
The **Omni Orchestrator** is the central nervous system of the ASP-GM-Agent v1.6.0. It coordinates complex, multi-node tasks while ensuring hardware limits (VRAM, CPU) are respected and the AI's perception is grounded in physical reality.

## 🚀 Key Components

### 1. TaskRouterProxy (VRAM Authority)
The Proxy lives on Node A and manages the heavy-lifting of model swapping. 
- **The Problem:** Swapping between a 12B Llama (Rules) and a 13B Llava (Vision) on an NVIDIA 1050 Ti takes ~20-30 seconds, during which the system is unresponsive.
- **The Solution:** The Proxy intercepts "Light" requests (DV calculations, OCR, simple stat lookups) and queues them. If the GPU is currently swapping for a Vision pass, these tasks wait in a high-priority queue and execute the micro-second the GPU is ready, preventing RPC timeout cascades.

### 2. SensoryFilter (LOS Grounding)
The SensoryFilter ensures the AI GM doesn't "cheat" by seeing through walls or floor levels.
- **Mechanism:** Before world-state data is bundled for the AI's prompt, it passes through the **SensoryFilter**. 
- **Integration:** It uses Foundry VTT's native **Line-of-Sight (LOS) Polygons**. If a token, item, or environmental change is outside the active actor's LOS, it is stripped from the AI's context.
- **Benefit:** Eliminates "Omniscient AI" hallucinations and ensures tactical responses are grounded in what the character actually knows.

### 3. Intent Swarm (Reactive Fusion)
The Intent Swarm is a concurrent classification pipeline that triggers when players perform "high-impact" actions.
- **Concurrent Dispatch:** 
    - **Node B (Tone):** Analyzes the narrative intent (e.g., "aggressive," "desperate," "sneaky").
    - **Node A (Intensity):** Calculates the mechanical severity (e.g., a critical hit vs. a minor scrape).
- **Materialization:** These two vectors are fused into a single `OmniEvent` which triggers reactive CSS/CDP effects, such as flickering lights, "Glitch" overlays, or procedural blood decals.

## ⚡ Operational Commands
- `/scan`: Resyncs the SensoryFilter and performs a dual-node CV audit.
- `/audit`: Displays the current `TaskRouterProxy` queue depth and hardware health.

---
*Omni Orchestrator: Deterministic Reactivity for the Neural Hive.*
