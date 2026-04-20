# Phase 25: Native Cognition Engine (llama.cpp Migration) Spec

**Goal:** Migrate both Node A and Node B from Ollama to raw `llama.cpp` (`llama-server`) to eliminate Go runtime overhead, enable precise VRAM allocation, and prepare for multimodal (VLM) workloads.

## 1. Architectural Justification
- **Zero Overhead:** Raw `llama.cpp` removes the HTTP routing and wrapper overhead of Ollama, critical for sub-1ms VSB latency.
- **VRAM Control:** Allows explicit setting of context window (`-c`), flash attention (`-fa`), and KV cache quantization (`--kv-cache-type q4_0`) to prevent OOM panics on Node A's 4GB GPU.
- **Multimodal Readiness:** `llama-server` natively supports the `--mmproj` flag for Vision Language Models, which is required for Phase 26.

## 2. Requirements

### 2.1 Node A (Rules Vault) Migration
- Replace `ollama serve` and `ollama pull` in startup scripts with raw `llama-server` execution.
- Maintain `Open-Reasoner-Zero:1.5b` as the primary reasoning model.
- Configure `llama-server` with strict VRAM limits (e.g., `-c 2048 -fa`).

### 2.2 Node B (Director) Migration
- Replace `ollama` dependency in Nix shell with `llama-cpp` or compile from source.
- Configure `llama-server` with Vulkan backend enabled (`OLLAMA_VULKAN=1` equivalent).
- Update `.env.example` and documentation to reflect the new API endpoints (though structurally identical to OpenAI `/v1`).

### 2.3 Cleanup
- Remove all remaining Ollama installation references from Nix configuration and startup scripts.
- Ensure `NitroLogicClient` correctly interfaces with the new `llama-server` endpoints (no code changes expected, just URL/port validation).