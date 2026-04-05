# Phase 25: Native Inference Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Node A and Node B from Ollama to raw `llama.cpp` (`llama-server`).

**Architecture:** We are bypassing the Ollama wrapper to run `llama-server` natively. This gives us zero overhead and explicit VRAM control. The OpenAI `/v1/chat/completions` API structure remains identical.

**Tech Stack:** `llama.cpp`, Nix, Rust (zeroclaw), TypeScript (Node B).

---

### Task 1: Node A `llama-server` Migration [DONE]

**Files:**
- Modify: `zeroclaw/scripts/setup-resident-models.sh`
- Modify: `docs/SERVER_SETUP.md`

- [x] **Step 1: Update startup script to use `llama-server`** [DONE]
Refactor the setup script to download `llama-server` (or run via Nix) and start the server with the `Open-Reasoner-Zero-1.5B.Q8_0.gguf` model, enforcing `-c 2048 -fa`.

- [x] **Step 2: Update Server Setup documentation** [DONE]
Document the process of acquiring `llama-server` and launching it natively on Node A.

### Task 2: Node B `llama.cpp` Nix Integration [DONE]

**Files:**
- Modify: `shell.nix`
- Modify: `docs/LOCAL_SETUP.md`

- [x] **Step 1: Add `llama-cpp` to `shell.nix`** [DONE]
Ensure `llama-cpp` is available in the Nix development environment.

- [x] **Step 2: Update Local Setup documentation** [DONE]
Reflect the change from Ollama to `llama.cpp` in the build and run instructions for Node B.

### Task 3: API Endpoint Verification [DONE]

**Files:**
- Modify: `.env.example`
- Modify: `src/mcp/nitro-logic/index.ts` (if needed for port changes)

- [x] **Step 1: Verify and update API URLs** [DONE]
Ensure `NODE_A_LLAMA_URL` and `OLLAMA_BASE_URL` point to the correct `llama-server` default ports (usually 8080).