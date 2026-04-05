# User Guide: Omni Orchestrator (Phase 25)
**Version:** 1.9.0
**Role:** Reactive Hardware Control Plane

## 🧠 Overview
The **Omni Orchestrator** is the central nervous system of the ASP-GM-Agent v1.9.0. It coordinates complex, multi-node tasks while ensuring hardware limits (VRAM, CPU) are respected and the AI's perception is grounded in physical reality via the Sovereign Highway.

## 🚀 Key Components

### 1. TaskRouterProxy (VRAM Authority)
The Proxy manages hardware state and model residency. In v1.9.0, residency is enforced at the process level via native `llama-server` and `--mlock`.
- **Residency:** Both **Open-Reasoner-Zero-1.5B** (Rules) and **Falcon-0.3B** (OCR) are permanently resident on Node A's GPU.
- **Optimization:** Native inference eliminates the Go/Ollama runtime overhead, providing sub-ms response times for mechanical validation.

### 2. SensoryFilter (LOS Grounding)
The SensoryFilter ensures the AI GM doesn't "cheat" by seeing through walls or floor levels.
- **Mechanism:** Before world-state data is bundled for the AI's prompt, it passes through the **SensoryFilter**. 
- **Integration:** It uses Foundry VTT's native **Line-of-Sight (LOS) Polygons**. If a token, item, or environmental change is outside the active actor's LOS, it is stripped from the AI's context.
- **Benefit:** Eliminates "Omniscient AI" hallucinations and ensures tactical responses are grounded in what the character actually knows.

### 3. Intent Swarm (Reactive Fusion)
The Intent Swarm is a concurrent classification pipeline that triggers when players perform "high-impact" actions.
- **Concurrent Dispatch:** 
    - **Node B (Tone):** Analyzes the narrative intent (e.g., "aggressive," "desperate," "sneaky") via Mistral-Nemo-12B.
    - **Node A (Intensity):** Calculates the mechanical severity via the **Open-Reasoner-Zero-1.5B** judge.
- **Materialization:** These two vectors are fused into a single `OmniEvent` which triggers reactive effects, such as flickering lights, "Glitch" overlays, or procedural blood decals via Sequencer.

## ⚡ Operational Commands
- `/scan`: Resyncs the SensoryFilter and performs a dual-node CV audit.
- `/audit`: High-signal health check of the VSB Bus and hardware-optimized inference nodes.

---
*Omni Orchestrator: Deterministic Reactivity for the Neural Hive.*
