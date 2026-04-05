# Design: Omni-Orchestrator Proxy & Strict State Loop
**Date:** 2026-04-03
**Target:** v1.5.0+ (Phase 18)

## 1. Architecture & Data Flow

**Core Concept:**
To safely operate within our strict 4GB/16GB VRAM split, we will combine the proxy-routing logic of `CLIProxyAPI` with the strict state-loop mechanics of `OpenCrawl`. Node B will act as the master traffic controller, dispatching tasks based on hardware cost, while Foundry enforces a strict, filtered reality to prevent AI hallucination.

**1. Hardware Abstraction Proxy (CLIProxyAPI Pattern):**
The `HybridRoutingController` on Node B is upgraded to an intelligent Proxy.
*   *Heavy Tasks:* Narrative generation, complex planning -> Routed to Mistral-Nemo (16GB VRAM).
*   *Light Tasks:* Math, D10 Oracle, OCR Vision -> Routed to Node A (Rust/Falcon/Open-Reasoner-Zero-1.5B 4GB).
*   *State Safety:* If Node A is currently swapping models (e.g., unloading Open-Reasoner-Zero-1.5B to warm up Falcon for Vision), the Proxy queues incoming Oracle requests instead of failing.

**2. Strict State Loop (OpenCrawl Pattern):**
To run an Autonomous NPC, we cannot feed it the entire Foundry map.
*   *State Filtering:* Foundry uses its native lighting/walls engine to calculate the NPC's actual Line-of-Sight polygon. It only sends tokens/items within that polygon to Node B.
*   *Rigid Schema:* Node B forces the LLM to reply within 5 seconds using a strict JSON schema (`{ action: 'move', targetId: '123' }`).
*   *Benefit:* Eliminates hallucinations (the AI can't interact with what it can't see) and ensures fast, deterministic turns.

## 2. Components
*   **`TaskRouterProxy` (Node B):** Wraps `nitroLogic` and `storyEngine`. Inspects incoming payloads and dispatches them based on a `HardwareCost` enum. Implements an async queue.
*   **`SensoryFilter` (Foundry Client):** Uses `canvas.walls.computePolygon()` to filter the `Scene` data before generating the JSON state payload for the LLM.