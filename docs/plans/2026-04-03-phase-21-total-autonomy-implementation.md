# Phase 21: Total Autonomy & Agentic Loops Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform NPCs into autonomous agents using multi-stage agentic loops and high-speed swarm simulation.

**Architecture:** Node B runs the agentic state machine (Turn Daemon). Node A provides the rules resolution and swarm batching.

**Tech Stack:** TypeScript (XState or similar), Rust (Tokio), Foundry Bridge.

---

### Task 1: The Autonomous Turn Daemon

**Files:**
- Create: `src/core/turn-daemon.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement the State Machine**
Create a 4-stage loop: Reason -> Intent -> Action -> Validate.

**Step 2: JSON Rigid Schema Prompting**
Implement the strict 5s timeout prompt that forces the LLM into a machine-readable action format.

---

### Task 2: Tactical Swarm Simulation (Node A)

**Files:**
- Create: `zeroclaw/src/rules/swarm_resolver.rs`
- Modify: `zeroclaw/src/lib.rs`

**Step 1: Batch Math Implementation**
Implement a Rust module that takes a `Vec<Action>` and returns a `Vec<Result>` in a single thread-safe pass.

**Step 2: RPC Swarm Integration**
Expose `resolve_swarm` to ClawLink.

---

### Task 3: Life-Path Persistence

**Files:**
- Modify: `src/db/unified-oracle-client.ts`
- Create: `src/core/life-path-service.ts`

**Step 1: Daily Log Schema**
Add `npc_logs` table to Akashik.db.

**Step 2: History Integration**
Update the `Turn Daemon` to fetch the last 5 relevant logs from `npc_logs` during the "Reasoning" stage to provide continuity.
