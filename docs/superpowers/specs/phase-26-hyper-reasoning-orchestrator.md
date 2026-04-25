# Phase 26: Hyper-Reasoning Orchestrator (Pixtral-12B VLM) Spec

**Goal:** Layer Node B's orchestration with a Vision Language Model (Pixtral-12B) to achieve semantic understanding of the physical Foundry VTT canvas.

## 1. Architectural Justification
- **Semantic + Physical Synthesis:** While Node A handles physical geometry via Canny Edge detection, Node B will now "see" the map pixels to understand narrative context (e.g., identifying objects, reading the room).
- **Native Implementation:** By using `llama.cpp` (Phase 25), we avoid brittle Python wrappers like `mlx-vlm` and run the VLM natively on the AMD Vulkan backend.

## 2. Requirements

### 2.1 Model Acquisition & Quantization
- Pull `Pixtral-12B` GGUF at `Q5_K_M` or `Q6_K` to balance quality and VRAM footprint (~9-10GB).
- Pull the corresponding Vision Encoder projection file (`mmproj`).

### 2.2 Orchestrator Integration
- Launch `llama-server` on Node B with both the text model and the `--mmproj` flag.
- Update Node B's narrative engine to support passing base64 encoded image strings to the `/v1/chat/completions` endpoint.
- Develop a pipeline to capture Foundry VTT canvas crops (based on Node A's geometric coordinates) and send them to Node B's VLM.

### 2.3 The "Thought Stream" (Crush CLI)
- Since Node A now uses `Open-Reasoner-Zero`, capture its `<think>` tokens.
- Display these tokens in real-time within the Crush CLI interface to give the GM transparency into the AI's tactical reasoning.

---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
