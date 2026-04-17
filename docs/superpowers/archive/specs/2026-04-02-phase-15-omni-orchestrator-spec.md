# Design Specification: Phase 15 — The Omni-Orchestrator (v1.2.0)
**Subject:** Unified VLM Narrative & Vision Convergence
**Status:** DESIGN FINALIZED (Neural Sync)

## 1. Executive Summary
Phase 15 collapses the modular "Narrative" and "Vision" services into a single, high-fidelity world engine powered by **Gemma-4-VLM (31B)**. By utilizing aggressive **IQ3_M quantization** and **3.5-bit KV-caching**, we establish an omni-capable brain on Node B that perceives pixels and synthesizes prose in a single latent space.

## 2. Technical Architecture: The Unified Brain

### 2.1 Neural Consolidation (Node B)
- **Engine:** Gemma-4-VLM (31B parameters).
- **Quantization:** IQ3_M (High-density 3-bit weights).
- **Memory Footprint:** ~11.6 GB Weights + ~3.2 GB KV-Cache (128k context) = **14.8 GB Total**.
- **Result:** Fits in the 16GB RX 9060 XT with 1.2 GB of "Hardware Insurance" for Foundry/OS.

### 2.2 The Omni-Client Interface
Replaces `SovereignInferenceClient` and `TacticalVisionService` with a single `OmniOrchestratorClient`.
- **Logic:** Every narrative prompt is automatically enriched with a **Neural Uplink screenshot** and an **Akashik RKG subgraph**.
- **Inference:** Single-pass multimodal reasoning. The AI "sees" the map and "writes" the story in one atomic GPU cycle.

## 3. Deployment Protocol (v1.2.0)
- **Model Registry:** `hf.co/mlx-community/gemma-4-vlm-31b-iq3_m`.
- **VRAM Hardening:** Forcing `OLLAMA_NUM_PARALLEL=1` to ensure the 31B model has exclusive bandwidth.
- **Latency Target:** Narrative synthesis with visual grounding in **<800ms**.

## 4. Continuity & Fallback
- **Rules Sync:** Continues to use **Node A (ZeroClaw)** for deterministic math via the binary bridge.
- **Safe Mode:** Reverts to the modular v1.1.2 stack if VRAM saturation exceeds 98%.
