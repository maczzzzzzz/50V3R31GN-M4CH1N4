# Design: Phase 27 — Hyper-Reasoning Orchestrator (v3.6.4)

**Date:** 2026-04-05
**Status:** Approved
**Vision:** Layer Node B with Pixtral-12B (VLM) to enable multimodal perception of the game world and the Akashik Library.

## 1. ARCHITECTURE OVERVIEW

### 1.1 The Vision Pipeline (Node B)
- **Model:** Pixtral-12B (Mistral-Nemo 12B base + mmproj vision adapter).
- **Engine:** `llama-server` (llama.cpp) running on Node B (Vulkan/AMD).
- **Endpoint:** OpenAI-compatible `/v1/chat/completions` with `image_url` support.
- **Role:** Deep narrative interpretation of character sheets, map aesthetic, and PDF artwork.

### 1.2 Surgical Perception (CDP Handshake)
- **Mechanism:** `Page.captureScreenshot` with `clip` parameters.
- **Workflow:** 
    1. Node B identifies a "Point of Interest" (e.g., an actor ID or coordinate).
    2. Node B requests a high-resolution 512x512 crop of that coordinate via CDP.
    3. The crop is sent to Pixtral for high-fidelity OCR and "Vibe Check."

## 2. CORE FEATURES

### 2.1 The Akashik Visual Audit
- **Goal:** Allow the AI to "learn" from the illustrations and tables in campaign PDFs.
- **Logic:** The Forge (Phase 29) generates images of PDF pages. Pixtral audits these images to extract lore-dense metadata (e.g., "The Glen has a gritty, rain-slicked aesthetic with neon-pink highlights").
- **Efficiency:** Drastically reduces hallucinations by grounding descriptions in the actual campaign art.

### 2.2 Chain-of-Thought (CoT) Streams
- **Feature:** Expose the `<think>` block from the LLM/VLM directly to the user.
- **Interaction:** The `crush` CLI and `sidecar-cyberdeck` render a "Thought Stream" panel, showing the AI's tactical reasoning in real-time as it parses the visual input.

### 2.3 Visual After-Action Reports (V-AAR)
- **Feature:** AI-generated combat summaries with annotated screenshots.
- **Storage:** Saved to the Akashik Library as a single ST3GG-embedded image.

## 3. TECHNICAL CONSTRAINTS
- **Latency:** Vision passes should be asynchronous to avoid blocking the narrative heartbeat.
- **VRAM:** Pixtral-12B must fit within Node B's 16GB VRAM alongside the Narrative Engine. Use Q5_K_M quantization.

---
*Verified by Gemini CLI v3.6.4 Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
