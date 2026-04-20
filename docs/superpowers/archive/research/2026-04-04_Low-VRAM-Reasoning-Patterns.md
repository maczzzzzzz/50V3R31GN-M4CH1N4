# Research: Low-VRAM Reasoning Patterns (70B Scale)
**Date:** 2026-04-04
**Reference:** [Phase 24: Sovereign Utility Belt]

## 1. Core Discoveries (AirLLM / Prima.cpp)
Research into the latest agentic infrastructure reveals two high-impact patterns for Node B (16GB VRAM) and Node A (4GB VRAM).

### 1.1 Sequential Layer-wise Cognition (AirLLM)
- **Mechanism:** Decomposes massive models (70B+) into individual layers and loads them into VRAM one-by-one.
- **Fact:** 70B models can execute on a single 4GB GPU (Node A Pascal) using this method.
- **Constraint:** Primary bottleneck is Disk/RAM-to-VRAM I/O latency.
- **Node B Strategy:** With 16GB VRAM, Node B can load large "chunks" of layers, dramatically increasing the tokens/sec for strategic reasoning.

### 1.2 Pipelined-Ring Parallelism (PRP)
- **Mechanism:** Overlaps computation of Layer N with the prefetching of Layer N+1 from disk.
- **Application:** Implemented in the **Crush Registry** via the `VRAM-GUARDIAN` and `Prefetching Sidecar` tasks.

## 2. Tiered Intelligence Architecture
Based on hardware constraints, we are adopting a three-tier execution model:

1.  **Tier 1 (Reflex):** Resident 1B model on Node A. Immediate physical validation.
2.  **Tier 2 (Narrative):** Resident 12B model on Node B. Standard dialogue/scene flow.
3.  **Tier 3 (Strategic):** Layer-swapped 70B model on Node B. Triggered for "Deep Thinking" beats.

## 3. UX Patterns: "Reasoning Stream"
- **Fact:** Reasoner models (Open-Reasoner-Zero) use `<thought>` blocks to self-correct.
- **Application:** Our **Authorization Pane** will stream these thought tokens to provide operator transparency before a systemic commit (The Flush Gate).

## 4. Source Data
- **AirLLM Repo:** https://github.com/0xSojalSec/airllm
- **Open-Reasoner-Zero:** https://github.com/Open-Reasoner-Zero/Open-Reasoner-Zero
- **Prima.cpp Paper:** https://arxiv.org/abs/2504.08791
