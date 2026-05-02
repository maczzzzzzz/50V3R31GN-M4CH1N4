# Living City & Project "Eyes-On" Implementation Plan (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Phase 6, giving the AI spatial eyes via a dual-node CV pipeline and a deterministic world heartbeat via recursive SQLite triggers.

**Architecture:** Node A (Rust) performs geometric wall detection. Node B (TS + LLava) performs tactical region parsing. The Pulse Engine advances the RKG state using cellular-automata logic in SQLite.

**Tech Stack:** Rust (imageproc), TypeScript, Ollama (LLava 1.6), better-sqlite3, Foundry v12 API.

---

### Task 1: Geometric Wall Engine (Node A)

**Files:**
- Create: `zeroclaw/src/cv/mod.rs`
- Create: `zeroclaw/src/cv/edge_detector.rs`
- Modify: `zeroclaw/Cargo.toml` (Add `image = "0.25"`, `imageproc = "0.26"`)

**Step 1: Implement Canny Edge Detection**
- Convert input image to grayscale.
- Run `imageproc::edges::canny`.
- Return binary edge map.

**Step 2: Implement Hough Line Transform & Coordinate Conversion**
- Run `imageproc::hough::detect_lines`.
- Apply Formula: `SceneX = PixelX + (ImageWidth * Padding)`.
- Format as Foundry `walls` JSON.

**Step 3: Verification**
- Run standalone test: `cargo test cv::edge_detector`.
- Verify JSON output matches Foundry schema.

---

### Task 2: Tactical Vision Service (Node B)

**Files:**
- Create: `src/core/tactical-vision-service.ts`
- Create: `tests/core/tactical-vision-service.test.ts`

**Step 1: Implement Structured LLava Wrapper**
- Call Ollama `/api/chat` with `format` parameter using a Zod-generated schema.
- Prompt for `[ymin, xmin, ymax, xmax]` coordinates normalized to 1000.

**Step 2: Implement Region Mapper**
- Map categories (`cover_high`, `hazard`) to Foundry v12 `RegionDocument` arrays.
- Persist identified regions to `world.db`.

**Step 3: Verification**
- Mock Ollama response and verify coordinates translate correctly to pixel space.

---

### Task 3: The Pulse Engine (Deterministic World Heartbeat)

**Files:**
- Create: `src/db/pulse-triggers.sql`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Implement Recursive Influence Triggers**
- Enable `PRAGMA recursive_triggers = ON`.
- Implement Chebyshev decay logic in SQL triggers.
- Ensure strength propagates automatically when a source base is updated.

**Step 2: Implement NPC Agenda Logic**
- Advance NPC locations and goals based on 24-hour cycles.
- Integrate with `discord-chronicler` for "Street News" updates.

**Step 3: Verification**
- Update one faction base strength; verify neighboring cell updates in SQLite.

---

### Task 4: Spatial Context Fusion

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Spatial Join Grounding**
- Update `applyWorldPulseGrounding` to fetch `Scene Regions` within a 10m radius of the active token.
- Inject tactical data into the Mistral-Nemo prompt.

**Step 2: Full E2E Verification**
- Import battle map.
- Run `/scan`.
- Start combat.
- Verify AI narrates using grounded tactical regions (e.g. "The gangers hide behind the concrete barrier").


---
**LINKS:** [[OS_CORE]]
