# Sovereign Highway Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a robust, production-grade VSB (Binary UDP) client and secure GPU passthrough for Node B in WSL2.

**Architecture:** We will implement a high-performance UDP client in TypeScript that mirrors the `IntentPacket`/`ResultPacket` logic of the Rust `zeroclaw` server. We will also harden the NixOS FHS environment to allow Node B to leverage the Windows GPU for local inference.

**Tech Stack:** TypeScript (`node:dgram`), NixOS (FHS), Rust (Cleanup).

---

### Task 1: Clean Up Stale Windows Artifacts [DONE]

**Files:**
- Modify: `sidecar-atlas/target` (Cleanup)
- Modify: `sidecar-netrunning/target` (Cleanup)

- [x] **Step 1: Identify and remove Windows binaries** [DONE]
Run: `find . -name "*.exe" -o -name "*.pdb" -delete`
Expected: Cleanup of legacy MSVC build remains.

- [x] **Step 2: Verify cleanup** [DONE]
Run: `find . -name "*.exe" | wc -l`
Expected: Output `0`.

### Task 2: Harden GPU Passthrough in FHS [DONE]

**Files:**
- Modify: `fhs.nix`

- [x] **Step 1: Add CUDA and GL libraries to `fhs.nix`** [DONE]
Inject the necessary libraries for NVIDIA passthrough into the `targetPkgs` array.

- [x] **Step 2: Verify FHS environment** [DONE]
Verified build and entry.

### Task 3: Implement Production `VsbClient` [DONE]

**Files:**
- Create: `src/api/vsb-client.ts`
- Test: `tests/api/vsb-client.test.ts`

- [x] **Step 1: Write the failing test for `VsbClient`** [DONE]
- [x] **Step 2: Implement the `VsbClient` class** [DONE]
- [x] **Step 3: Run tests and verify** [DONE]
Run: `npm test tests/api/vsb-client.test.ts`
Expected: PASS.

### Task 4: Integrate VSB into Orchestration [DONE]

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Modify: `src/main.ts`

- [x] **Step 1: Update `HybridRoutingController` to support VSB** [DONE]
- [x] **Step 2: Initialize `VsbClient` in `main.ts`** [DONE]
- [x] **Step 3: Verify with Live Canary** [DONE]
Ready for hardware test.

