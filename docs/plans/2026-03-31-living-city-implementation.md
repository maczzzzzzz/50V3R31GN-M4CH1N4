# Living City & Project "Eyes-On" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Phase 6 (v0.9.0), including the dual-node CV pipeline and the Pulse Engine world simulation.

**Architecture:** Node A (Rust) performs geometric edge detection for walls. Node B (TypeScript + LLava) performs tactical region identification. The Pulse Engine (Node B) advances the RKG state based on simulated time.

**Tech Stack:** Rust (imageproc), TypeScript, Ollama (LLava 7B), better-sqlite3, Foundry v12 API.

---

### Task 1: Geometric Wall Engine (Node A)

**Files:**
- Create: `zeroclaw/src/cv/mod.rs`
- Create: `zeroclaw/src/cv/edge_detector.rs`
- Modify: `zeroclaw/src/main.rs`

**Step 1: Write failing Rust test for Canny edge detection**

**Step 2: Implement Canny + Hough transform in Rust**
- Load image.
- Perform edge detection.
- Return `Vec<WallSegment>`.

**Step 3: Add grid-snapping post-processor**

**Step 4: Commit**

---

### Task 2: Tactical Region Intelligence (Node B)

**Files:**
- Create: `src/core/tactical-vision-service.ts`
- Create: `tests/core/tactical-vision-service.test.ts`

**Step 1: Implement LLava 7B prompt wrapper**
- Pass image buffer to Ollama `/api/generate`.
- Request tactical regions in relative JSON coordinates.

**Step 2: Implement Scene Region mapper**
- Convert relative coordinates to pixel coordinates based on map size.
- Map categories to Foundry v12 `Region` document schemas.

**Step 3: Commit**

---

### Task 3: The Pulse Engine (World Simulation)

**Files:**
- Create: `src/core/pulse-engine.ts`
- Create: `tests/core/pulse-engine.test.ts`

**Step 1: Implement faction turf war logic**
- Fetch faction stats from `world.db`.
- Roll friction conflicts.
- Update RKG ownership.

**Step 2: Implement "World Bark" generator**
- AI generates narrative prose for significant world shifts.
- Push to Foundry chat as background lore.

**Step 3: Commit**

---

### Task 4: Spatial Intelligence Grounding

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Update 'World Pulse' to include Scene Regions**
- Fetch regions near active token.
- Inject tactical data into the prompt.

**Step 2: Full E2E verification**
- Import raw map.
- Verify walls exist.
- Start combat.
- Verify AI uses regions in barks.

**Step 3: Commit**
