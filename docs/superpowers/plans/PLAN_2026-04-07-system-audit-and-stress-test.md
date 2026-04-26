# System Audit and Resilience Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically debug, audit, and safely stress-test the entire 50V3R31GN-M4CH1N4 distributed architecture (TS Orchestrator, Go Crush Proxy, Rust Sidecars, and Native Llama Cognition) to uncover edge cases and failure modes before live Foundry integration.

**Architecture:** We will build targeted, innovative test scripts that isolate and challenge specific integration boundaries: VSB Mmap concurrency, Binary UDP packet integrity, Llama-server context exhaustion, and WebSocket/CDP resilience. These tests will be designed to fail gracefully without crashing the core services.

**Tech Stack:** Node.js (TypeScript), Go, Rust, Bash, `llama-server`, WebSocket, Mmap.

---

### Task 1: VSB Mmap Concurrency & Integrity Audit

**Files:**
- Create: `tests/integration/mmap-stress-test.ts`
- Create: `scripts/mmap-corruptor.go`

- [ ] **Step 1: Write the Go Mmap Corruptor**

Write a Go script that attempts to write garbage data to the shared memory file (`black_ice_state.mem`) while bypassing the standard Rust SDK safeguards, specifically targeting the magic bytes and header checksums.

- [ ] **Step 2: Write the TS Concurrency Monitor**

Write a TS script that continuously reads the Mmap file via the SDK bindings, verifying that it correctly detects corruption, rejects invalid states, and recovers when the Go proxy restores the correct magic bytes.

- [ ] **Step 3: Execute the Mmap Audit**

Run both scripts concurrently for 30 seconds. Verify that no panics occur in the Rust/TS layers and that the system logs the corruption without flatlining.

- [ ] **Step 4: Commit**

### Task 2: Binary UDP VSB Chaos Engineering

**Files:**
- Create: `tests/integration/udp-chaos-monkey.ts`

- [ ] **Step 1: Write the UDP Chaos Script**

Create a TS script that blasts Port 7878 (Node A VSB listener) with:
- Malformed `SovereignHeader` packets.
- Payloads exceeding the MTU / buffer limits.
- Valid headers with garbage JSON payloads.

- [ ] **Step 2: Monitor Node A Resilience**

Ensure the `vsb_udp.rs` (or Node B equivalent receiver) correctly drops invalid packets and increments error metrics without crashing the listener thread. 

- [ ] **Step 3: Execute and Validate**

Run the chaos script. Check the logs to ensure "invalid magic", "payload too large", or "json parse error" are gracefully handled.

- [ ] **Step 4: Commit**

### Task 3: Native Cognition Engine (48L173R473D) Edge Cases

**Files:**
- Create: `tests/integration/inference-edge-test.ts`

- [ ] **Step 1: Write Cognition Stress Cases**

Create tests that send the following to the `llama-server` (`VLM_ENDPOINT`):
- A prompt exactly at the edge of the context window (32768 tokens).
- A sequence of 5 rapid-fire, concurrent requests to test request queuing/rejection.
- A request with a heavily corrupted base64 image payload (to test the Pixtral adapter's error handling).

- [ ] **Step 2: Execute the Edge Cases**

Run the script against the live `llama-server`. The goal is to ensure the server returns 400/500 level HTTP errors instead of segfaulting or hanging indefinitely.

- [ ] **Step 3: Commit**

### Task 4: Orchestrator Resilience (CDP & WebSocket)

**Files:**
- Create: `tests/integration/orchestrator-resilience.test.ts`

- [ ] **Step 1: Write CDP Timeout & Disconnect Mocks**

Simulate a scenario where the Foundry Electron instance suddenly drops the CDP connection or stalls on a `Runtime.evaluate` call for > 10 seconds.

- [ ] **Step 2: Write WebSocket Hijack Attempt**

Attempt to connect to the Node B WebSocket server from a non-`127.0.0.1` address or without the ephemeral handshake token (simulating an unauthorized local script).

- [ ] **Step 3: Execute Resilience Tests**

Run the Vitest suite for these specific files. Expect the `VisualMonitorService` to emit a reconnect event and the WS server to immediately terminate the rogue connection.

- [ ] **Step 4: Commit**

### Task 5: Vesper Risk Engine (Flush Gate) Audit

**Files:**
- Create: `tests/integration/vesper-risk-audit.test.ts`

- [ ] **Step 1: Write Risk Engine Mocks**

Simulate narrative intents that span Low, Medium, and High risks.
- Low: "Inspect the dataterm." (Should pass Vesper background loop).
- Medium: "Hack the camera." (Should trigger Flush Gate Proposal).
- High: "Detonate the C4." (Should trigger Flush Gate Proposal).

- [ ] **Step 2: Validate the Go Proxy ACK**

Write a test that ensures the TS Orchestrator actually pauses execution and waits for the Go `crush` proxy to return an ACK over the Unix socket before proceeding with Medium/High risk actions.

- [ ] **Step 3: Execute and Commit**

Run the Vitest suite to confirm the state machine halts correctly.

---


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
