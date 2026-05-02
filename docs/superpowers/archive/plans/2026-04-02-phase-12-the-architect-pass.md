# Phase 12 "The Architect Pass" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable the AI to physically create tokens and geometry in Foundry VTT.

**Architecture:** Node B Architect Service -> Neural Uplink (CDP) -> Foundry v12 Internal API.

**Tech Stack:** TypeScript, CDP, Foundry v12 Scripting.

---

### Task 1: Token Manifestation Engine

**Files:**
- Create: `src/core/architect-pass-service.ts`
- Modify: `src/core/interfaces.ts` (Add `IArchitectService`)

**Step 1: Implement `spawnToken` method**
Use `Runtime.evaluate` to execute `TokenDocument.createDocuments` in the renderer.

**Step 2: Integrate with HybridRoutingController**
Wire the ambush events to trigger `spawnToken`.

**Step 3: Verification**
Verify that a call to the Architect service results in a new token appearing at (500, 500) on the map.

---

### Task 2: Auto-Wall Batch Engine

**Files:**
- Modify: `src/core/architect-pass-service.ts`

**Step 1: Implement `materializeWalls` method**
Accept an array of `[x0, y0, x1, y1]` coordinates and inject `canvas.scene.createEmbeddedDocuments("Wall", ...)`.

**Step 2: Verification**
Draw a 100x100 box of walls via a single service call.

---

### Task 3: Atmosphere Pulse

**Files:**
- Modify: `src/core/architect-pass-service.ts`

**Step 1: Implement `setLighting` method**
Update `canvas.scene.update({ "darkness": val, "globalLight": bool })`.

**Step 2: Verification**
Verify the Foundry window physically darkens on command.

---

### Task 4: Final v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS "Architect" Audit

**Files:**
- Create: `docs/audits/2026-04-02_v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-Architect-Audit.md`

**Step 1: Stability Test**
Perform batch materialization of 50 tokens and 100 walls.

**Step 2: Version Increment**
Bump version to **1.1.1**.


---
**LINKS:** [[OS_CORE]]
