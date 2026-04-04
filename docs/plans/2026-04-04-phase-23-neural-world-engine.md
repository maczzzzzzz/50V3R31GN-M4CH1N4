# Phase 23: Neural World Engine Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Empower the Agent to manipulate Foundry VTT as a physical entity through autonomous NPC incarnation, tactical seeding, and environmental evolution.

**Architecture:** Upgrades to `HybridRoutingController` and `StoryEngine` to link narrative beats to physical `easy-phasey` transitions and dynamic `SceneRegion` creation.

**Tech Stack:** TypeScript (Node B), Rust (Node A), `easy-phasey` (Foundry), ST3GG.

---

### Task 1: Autonomous "Solo-Safe" NPC Incarnation

**Files:**
- Modify: `src/core/nitro-logic-client.ts`
- Modify: `src/api/foundry-adapter.ts`

**Step 1: Implement Adaptive Balancing Algorithm**
Node A (1B Judge) scans player sheet via VSB and generates stats where hit probability is capped at 60%.

**Step 2: Commit**
```bash
git add src/core/nitro-logic-client.ts
git commit -m "feat(agent): implement solo-safe NPC balancing algorithm"
```

---

### Task 2: Tactical Environmental Seeding (Ghost Object Protocol)

**Files:**
- Modify: `src/core/architect-pass-service.ts`
- Modify: `src/shared/vsb_protocol.rs`

**Step 1: Implement Ghost Object Mapping**
Node A extracts hidden data from pixels (ST3GG) and pushes it to VSB `GhostBlips`.

**Step 2: Implement Region Seeding**
`ArchitectPassService` writes `SceneRegions` to Foundry based on `GhostBlip` coordinates.

**Step 3: Commit**
```bash
git add src/core/architect-pass-service.ts
git commit -m "feat(phys): implement tactical region seeding via Ghost Object Protocol"
```

---

### Task 3: Environmental Evolution (Phase Shifting)

**Files:**
- Modify: `src/core/story-engine.ts`
- Modify: `src/api/foundry-adapter.ts`

**Step 1: Integrate `easy-phasey` API**
Add `advancePhase()` to `FoundryAdapter`.

**Step 2: Link Beats to Phases**
Update `StoryEngine` to trigger a Phase Shift when a beat transition is successful.

**Step 3: Commit**
```bash
git add src/core/story-engine.ts src/api/foundry-adapter.ts
git commit -m "feat(phys): link narrative beats to physical scene shifts via easy-phasey"
```
