# Phase 14 "Neural World Engine" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Visual Diff perception engine and the hardware-safe Neural Asset Mapping loop.

**Architecture:** Node B CPU-based Pixelmatch for diffing + CDP-driven Decal Injection for environmental reactivity.

**Tech Stack:** TypeScript (pixelmatch), Chrome DevTools Protocol (CDP), Akashik.db.

---

### Task 1: The Visual Diff Engine

**Files:**
- Create: `src/core/visual-diff-service.ts`
- Modify: `src/core/visual-monitor-service.ts`

**Step 1: Implement Pixel-Subtraction**
Use the `pixelmatch` library to compare the active CDP screenshot with the base map PNG.

**Step 2: Implement "Transient Filter"**
Extract coordinates of everything that differs from the base map (tokens, templates) and pass as a "Transient Metadata" block to the AI.

**Step 3: Verification**
Verify that the AI correctly identifies tokens as "temporary entities" rather than "walls" during a scan.

---



---

### Task 3: Latent Atmosphere Persistence

**Files:**
- Modify: `src/db/world-schema.sql` (Add `scene_atmosphere` table)
- Modify: `src/api/foundry-adapter.ts`

**Step 1: Implement Atmosphere Capture**
When a scene is modified, save the current lighting/audio settings to **`Akashik.db`**.

**Step 2: Implement "Pulse Restore"**
On `scene_activate`, automatically push the stored atmosphere settings to the Foundry renderer via CDP.

**Step 3: Verification**
Change map lighting to "Neon Cyan," switch scenes, switch back, and verify the lighting returns to "Neon Cyan" automatically.

---

### Task 4: Final v3.7.0 "World Engine" Audit

**Files:**
- Create: `docs/audits/2026-04-02_v3.7.0-World-Engine-Audit.md`

**Step 1: Stability Stress Test**
Verify that multiple concurrent decals do not impact narrative performance.

**Step 2: Version Bump**
Iterate version to **1.3.0**.


---
**LINKS:** [[OS_CORE]]
