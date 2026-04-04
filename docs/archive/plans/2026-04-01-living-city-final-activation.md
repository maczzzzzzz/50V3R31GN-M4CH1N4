# Living City & Project "Eyes-On" Final Activation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finalize Phase 6 by giving the AI spatial eyes via a dual-node CV pipeline and a deterministic world heartbeat via recursive SQLite triggers.

**Architecture:** Node A (Rust) performs geometric wall detection using Canny/Hough transforms. Node B (TS + LLava) performs tactical region parsing. The Pulse Engine advances the RKG state using cellular-automata logic in SQLite.

**Tech Stack:** Rust (imageproc), TypeScript, Ollama (LLava 1.6), better-sqlite3, Foundry v12 API.

---

### Task 1: Geometric Wall Engine (Node A)

**Files:**
- Modify: `zeroclaw/Cargo.toml` (Add `image`, `imageproc`)
- Create: `zeroclaw/src/cv/mod.rs`
- Create: `zeroclaw/src/cv/edge_detector.rs`
- Modify: `zeroclaw/src/lib.rs` (Export `cv` module)
- Modify: `zeroclaw/src/server/clawlink.rs` (Add `detect_walls` RPC)

**Step 1: Update Cargo.toml**
Add dependencies:
```toml
image = "0.25"
imageproc = "0.26"
```

**Step 2: Implement Canny Edge Detection**
Create `zeroclaw/src/cv/edge_detector.rs` with `detect_edges` function using `imageproc::edges::canny`.

**Step 3: Implement Hough Line Transform**
Add `detect_lines` function to `edge_detector.rs`.

**Step 4: Register RPC in clawlink.rs**
Add `detect_walls` method to `process_rpc` that accepts an image path and returns Foundry JSON walls.

**Step 5: Verification**
Run: `cargo build` on Node B (to verify syntax) and deploy to Node A for E2E check.

---

### Task 2: Tactical Vision Service (Node B)

**Files:**
- Create: `src/core/tactical-vision-service.ts`
- Create: `tests/core/tactical-vision-service.test.ts`

**Step 1: Write the failing test**
Verify `TacticalVisionService.scanMap(imagePath)` returns a valid `RegionDocument[]` using a mocked Ollama response.

**Step 2: Implement LLava Wrapper**
Call Ollama `/api/generate` with LLava 1.6 and a prompt for tactical region extraction (JSON format).

**Step 3: Implement Region Mapper**
Convert LLava `[ymin, xmin, ymax, xmax]` coordinates to Foundry pixel space.

**Step 4: Verification**
Run: `npm test tests/core/tactical-vision-service.test.ts`

---

### Task 3: The Pulse Engine (Recursive SQLite Triggers)

**Files:**
- Create: `src/db/pulse-triggers.sql`
- Modify: `src/db/index.ts` (Run triggers on startup)

**Step 1: Implement Faction Influence Triggers**
Create `pulse-triggers.sql` with recursive triggers for Chebyshev decay influence propagation.

**Step 2: Implement NPC Agenda Logic**
Add triggers to `world.db` that update NPC coordinates based on time-of-day deltas.

**Step 3: Verification**
Update a faction base strength in `world.db` and verify adjacent cells update automatically.

---

### Task 4: Spatial Context Fusion (The "Eyes-On" Integration)

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Spatial Grounding**
Fetch regions within 10m of the active token and inject into the narrative prompt.

**Step 2: Final E2E Audit**
Verify that Mistral-Nemo mentions tactical regions in combat narrative (e.g. "Taking cover behind the hazard barrels").
