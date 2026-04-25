# Phase 26: Hyper-Reasoning Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Pixtral-12B VLM on Node B and capture `<think>` streams for Crush CLI.

**Architecture:** Node B's `llama-server` is launched with the `--mmproj` vision encoder. Node B's orchestrator sends image crops to the VLM. The Crush CLI watches a shared state to stream the `<think>` tokens from Node A's Open-Reasoner-Zero.

**Tech Stack:** Pixtral-12B (GGUF), `llama.cpp`, TypeScript, Go (Crush).

---

### Task 1: Pixtral-12B Provisioning Script

**Files:**
- Create: `scripts/setup-pixtral-vlm.sh`

- [ ] **Step 1: Write GGUF download script**
Create a script to download `Pixtral-12B-2409-Q5_K_M.gguf` and its `mmproj` file. 

### Task 2: VLM Prompt Pipeline (Node B)

**Files:**
- Modify: `src/core/interfaces.ts`
- Modify: `src/core/nitro-logic-client.ts` (or create a new VLM client)

- [ ] **Step 1: Implement Multimodal Request Interface**
Update the API clients to accept `image_url` fields in the OpenAI `/v1/chat/completions` message payload.

### Task 3: The "Thought Stream" in Crush

**Files:**
- Modify: `crush/auth_pane.go`
- Modify: `src/mcp/nitro-logic/index.ts`

- [ ] **Step 1: Stream Capture**
Update `NitroLogicClient` to parse `<think>` tokens from the response stream (or capture the final reasoning string).

- [ ] **Step 2: Crush CLI Display**
Send the reasoning text via VSB or IPC to the Crush `auth_pane.go` to render it in real-time or as an expanding markdown block.

---
**LINKS:** [[OS_CORE]]
