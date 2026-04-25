# Design: Cognitive Compression & Agentic Pipelining
**Date:** 2026-04-03
**Target:** v3.6.0 (Phase 19)

## 1. Architecture & Data Flow

**Core Concept:**
To maximize the capabilities of our 4GB/16GB VRAM hardware split, Phase 19 integrates three advanced AI optimization patterns: **Agentic Pipelining** (AutoStoryGen), **Linguistic Context Compression** (GLOSSOPETRAE), and **Dynamic Prompt Weighting** (R00TS). This transforms our Split-Node architecture from a simple load-balancer into a highly efficient, deterministic multi-agent engine.

**1. Heterogeneous Task Routing (AutoStoryGen Pattern):**
We decouple complex generation into an asynchronous Producer-Consumer pipeline.
*   *Node A (4GB - Brainstormer/Validator):* Runs fast, quantized utility models (e.g., Llama-3 8B 4-bit) to roll D10s, compute Line-of-Sight, and generate mechanical "Outlines".
*   *Node B (16GB - Writer/Renderer):* Consumes the mechanical outlines and uses Mistral-Nemo to render rich, atmospheric prose. 
*   *Benefit:* Node B is never bogged down with math or validation, and Node A is never burdened with prose generation.

**2. VRAM-Free Context Compression (GLOSSOPETRAE Pattern):**
Passing large JSON states between Node A and Node B consumes valuable tokens.
*   *Linguistic Seeding:* We utilize GLOSSOPETRAE's deterministic math to generate hyper-dense constructed languages. Node B translates complex world-state instructions into compressed "Skillstones" (seed-based linguistic tokens) before passing them to Node A.
*   *Benefit:* Bypasses standard BPE tokenizer limits, drastically expanding the effective context window of Node A's 4GB VRAM without actually increasing token count.

**3. Dynamic Prompt Weighting (R00TS Pattern):**
Standard RAG retrieval injects too much noise into the system prompt.
*   *Hyperstitional Seeding:* We apply a frequency-based weighting system to the Akashik Record (Unified Strategic Oracle). If an entity or concept (e.g., "Arasaka") is repeatedly queried or interacted with, its "latent weight" increases.
*   *Execution:* Node B culls the RAG noise, injecting only the top 5 highest-weighted "seeds" into the context window for Node A's tactical evaluations.

## 2. Components
*   **`AgenticPipelineController` (Node B):** An upgrade to the `HybridRoutingController`. It manages the Producer-Consumer queues, ensuring Node A's outlines are smoothly handed off to Node B's rendering engine.
*   **`LinguisticCompressionService` (Shared):** A lightweight utility that generates and decodes deterministic linguistic seeds for node-to-node communication.
*   **`HyperstitionalSeeder` (Node B):** Hooks into the `UnifiedStrategic OracleClient` to track term frequency and calculate latent weights for RAG injections.

---
**LINKS:** [[OS_CORE]]
