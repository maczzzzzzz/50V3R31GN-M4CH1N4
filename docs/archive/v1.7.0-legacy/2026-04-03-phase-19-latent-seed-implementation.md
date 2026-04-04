# Phase 19: The Latent Seed & Physical Grounding Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish high-performance physical and conceptual grounding by porting ST3GG to Node A and implementing the R00TS latent seeding pattern.

**Architecture:** Node A (Rust) handles per-pixel manipulation and vector similarity. Node B (Node.js) orchestrates the seed lifecycle and asset recovery.

**Tech Stack:** Rust (image, serde_json), Node.js, PostgreSQL (pgvector).

---

### Task 1: Node A — ST3GG Rust Implementation

**Files:**
- Create: `zeroclaw/src/steganography/mod.rs`
- Modify: `zeroclaw/src/lib.rs`
- Test: `zeroclaw/tests/st3gg_test.rs`

**Step 1: Write the failing test**
Verify `encode` followed by `decode` returns the original string.

**Step 2: Implement LSB logic in Rust**
Use the `image` crate to iterate over pixels and modify LSBs.

**Step 3: Expose via ClawLink RPC**
Add `st3gg_encode` and `st3gg_decode` variants to the RPC enum.

---

### Task 2: The Self-Describing Map Workflow

**Files:**
- Modify: `src/core/asset-index-service.ts`
- Modify: `src/api/clawlink-client.ts`

**Step 1: Update /scan logic**
When walls are detected, call `clawlink.st3gg_encode` to embed them in the source asset.

**Step 2: Implement Recovery Logic**
Add `AssetIndexService.recoverWalls(assetPath)` which uses Node A to decode pixels.

---

### Task 3: Latent Seeding (R00TS)

**Files:**
- Create: `src/core/seed-controller.ts`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Database Migration**
Add `conceptual_seeds` table with vector column.

**Step 2: Implement Seed Biasing**
Create `SeedController.getPromptBias(district)` which performs a similarity search.

**Step 3: Integrate with Story Engine**
Inject the bias string into Mistral-Nemo's narrative generation loop.
