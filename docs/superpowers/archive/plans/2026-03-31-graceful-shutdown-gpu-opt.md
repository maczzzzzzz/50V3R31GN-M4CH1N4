# Graceful Shutdown and Ollama GPU Optimization Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement graceful shutdown for Node.js services and provide configuration to optimize Ollama GPU usage.

**Architecture:**
- Add signal handlers (SIGINT, SIGTERM) to `src/main.ts`.
- Add `stop()` method to `ISovereignCognitionClient` and `INitroLogicClient` to ensure clean disconnection/unloading.
- Enhance `SovereignCognitionClient` to support `num_gpu` and provide an explicit unload call on shutdown.
- Update `OllamaConfig` to allow tuning for Node B's 16GB VRAM.

**Tech Stack:** Node.js, TypeScript, Ollama API.

---

### Task 1: Update Interfaces

**Files:**
- Modify: `src/core/interfaces.ts`

**Step 1: Add stop() to client interfaces and num_gpu to config**
Add `num_gpu` to `OllamaConfig` and `stop(): Promise<void>` to `ISovereignCognitionClient` and `INitroLogicClient`.

### Task 2: Implement stop() in SovereignCognitionClient

**Files:**
- Modify: `src/core/ollama-client.ts`

**Step 1: Implement stop() method**
The `stop()` method should send a request to Ollama with `keep_alive: 0` to unload the model from VRAM.

### Task 3: Implement stop() in NitroLogicClient

**Files:**
- Modify: `src/core/nitro-logic-client.ts`

**Step 1: Implement stop() method**
Ensure any persistent connections or timers are cleared.

### Task 4: Add Signal Handlers to main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: Add process.on('SIGINT') and process.on('SIGTERM')**
Handle signals to call `stop()` on all clients and close the Foundry server before exiting.

### Task 5: Verify Graceful Shutdown

**Step 1: Run the orchestrator and kill it with Ctrl+C**
Verify logs show "Shutting down..." and clients are stopped.

### Task 6: GPU Optimization Configuration

**Files:**
- Modify: `.env.example`
- Modify: `src/main.ts` (to pass new config)

**Step 1: Add OLLAMA_NUM_GPU to .env and use it in SovereignCognitionClient**
This allows the user to force GPU usage (e.g., set to 35 for Mistral-Nemo).


---
**LINKS:** [[OS_CORE]]
