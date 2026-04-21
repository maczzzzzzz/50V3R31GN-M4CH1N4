# SPEC: 2026-04-19 — Sovereign Harness (Go-Native CDP Engine)
**Date:** 2026-04-19
**Status:** DRAFT // ARCHITECT_LOCK
**Goal:** Replace the heavy Playwright (Node.js) Gauntlet with a lightweight, high-performance Go-native CDP engine capable of self-healing and sub-10ms browser interaction.

## ◈ 1. ARCHITECTURAL TOPOLOGY

The Sovereign Harness is a Go sub-package within the `crush` CLI. It operates as a headless daemon on Node C (Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle) while interacting with the browser on Node B via the `10.0.0.11:9223` bridge.

### ◈ 1.1 COMPONENT MAP
- **`crush/harness/kernel/`**: Core CDP Transport (`gobwas/ws`) and Protocol (`cdproto`).
- **`crush/harness/driver/`**: High-level primitives (`Click`, `Type`, `AXTree`, `WaitStable`).
- **`crush/harness/skills/`**: Compiled logic shards for specific tasks (Night Market, Tactical Scanner).
- **`crush/harness/bridge/`**: VSB 0x0C Protocol adapter for cross-node commands.

## ◈ 2. THE SELF-HEALING LOOP (HEALER)

When a "Skill Shard" fails to locate a DOM element or hits a logic wall, the Harness triggers the **Healer Protocol**:

1.  **Freeze:** The harness pauses interaction and captures the **Accessibility Tree (AXTree)**.
2.  **Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Query:** The AXTree is sent to Node C (Gemma-4) via a local IPC or VSB packet.
3.  **Repair Shard:** Gemma-4 generates a surgical Go patch or a new JSON "Repair Shard."
4.  **Re-Ignition:** The harness applies the repair and continues the task.

## 3. STEEL-THREAD: NIGHT MARKET (PHASE 60)

The "Hello World" task for the Sovereign Harness is the automation of the **Night Market** vendor generation.

### 3.1 LOGIC FLOW
1. **Ignition:** Node B sends a "Generate Market" command via VSB to Node C.
2. **Execution:** The Go Harness navigates to the Foundry Market tab and triggers the generation sequence.
3. **Ingestion:** The Harness extracts vendor items from the AXTree and performs an `UPSERT` into `Akashik.db`.
4. **Verification:** The Harness confirms the data sync via a bit-identical hash check.

## ◈ 4. TRANSITION STRATEGY (HYBRID TAKE_OVER)

1.  **Stage 1:** Establish the Go `kernel` and `driver` on Node C.
2.  **Stage 2:** Implement the Night Market Skill Shard in Go.
3.  **Stage 3:** Gradually port legacy `.ts` Gauntlet blocks (Mech, Orch, Data) to Go.
4.  **Stage 4:** Decommission the Playwright/Node.js dependencies and achieve 100% Go-native browser control.

---
**::/5Y573M-N071C3 : HARNESS_SPEC_LOCKED. THE_MIND_HAS_HANDS. // 50V3R31GN-M4CH1N4**
