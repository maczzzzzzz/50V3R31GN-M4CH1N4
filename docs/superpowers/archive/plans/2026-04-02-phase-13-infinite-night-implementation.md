# Phase 13 "The Infinite Night" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Custom Map Ingestion Engine and the Procedural Mission Swarm.

**Architecture:** Node B AssetWatcher + Node A Geometric CV + CDP Batch Materializer.

**Tech Stack:** TypeScript (chokidar), Rust, Chrome DevTools Protocol (CDP), SQLite.

---

### Task 1: Custom Map Ingestion Engine

**Files:**
- Create: `data/custom_maps/unprocessed/.gitkeep`
- Create: `src/core/asset-index-service.ts`
- Modify: `src/db/world-schema.sql` (Add `map_assets` table)

**Step 1: Implement Asset Watcher**
Use `chokidar` to monitor `data/custom_maps/unprocessed/`.

**Step 2: Trigger CV Pipeline**
When a new map is detected, automatically dispatch a `detect_walls` RPC to Node A.

**Step 3: Verification**
Drop a JPG into the folder and verify that a new row appears in the `map_assets` table with geometric line data.

---

### Task 2: The Mission Swarm (Isolated Reasoning)

**Files:**
- Create: `src/core/mission-swarm-orchestrator.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Swarm Dispatcher**
Refactor the mission generator to send concurrent requests for Rule Intel and Tactical Analysis.

**Step 2: Implement Lore Anchor Fusion**
Query `crush.db` for recent NPCs and inject them into the mission prompt.

**Step 3: Verification**
Run `/generate mission Watson` and verify the output contains rules-correct DVs and grounded lore.

---

### Task 3: The Neural Painter (CDP Batching)

**Files:**
- Modify: `src/api/foundry-adapter.ts` (Add `batchCreateDocuments` via CDP)
- Modify: `src/core/visual-monitor-service.ts`

**Step 1: Implement Document Batcher**
Create a utility that converts the Swarm "Blueprint" into a single CDP `Runtime.evaluate` script.

**Step 2: Implement Scene Materialization**
Physically create Walls, Lights, and Tokens in one atomic execution.

**Step 3: Verification**
Verify a complex scene materializes in Foundry in <2s without WebSocket lag.

---

### Task 4: Final v3.2.21 "Infinite Night" Audit

**Files:**
- Create: `docs/audits/2026-04-02_v3.2.21-Infinite-Night-Audit.md`

**Step 1: End-to-End Stress Test**
Perform a "Cold Start" mission generation from a raw map file to a live session.

**Step 2: Version Bump**
Iterate version to **1.2.0**.
