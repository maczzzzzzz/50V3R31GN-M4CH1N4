# OMI Voice Gateway (Phase 67) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the OMI Voice Gateway and Machina Terminal HUD to achieve diegetic vocal control across the Sovereign Trinity.

**Architecture:** Flutter App -> Node C (Whisper) -> Artery Manager (VRAM Shift) -> VSB -> Director.

**Tech Stack:** Flutter, Python, Docker, VSB (Binary Relay).

---

### Task 1: Artery Manager Materialization (Node C)

**Files:**
- Create: `scripts/ops/node-c-artery-manager.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement the VRAM Shift logic**
  - Listen for `WAKE_VOICE` UDP packets.
  - Command: `docker stop oracle && docker run ... gemma-4-Q4_K_M.gguf`.

- [ ] **Step 2: Commit**
  ```bash
  git add scripts/ops/node-c-artery-manager.ts
  git commit -m "feat(arch): implement node-c artery manager for VRAM scaling"
  ```

---

### Task 2: Machina Terminal HUD (Flutter)

**Files:**
- Create: `terminal-app/` (Flutter Project)

- [ ] **Step 1: Scaffold the Flutter HUD**
  - Theme: Black background, `#ff1a1a` accents.
  - Font: VT323.

- [ ] **Step 2: Implement OMI Capture Mesh**
  - Integrate `omi_sdk` for raw audio capture.
  - Implement WebSocket stream to Node C.

- [ ] **Step 3: Commit**
  ```bash
  git add terminal-app/
  git commit -m "feat(ui): scaffold machina terminal HUD app"
  ```

---

### Task 3: Artery Sync (Lore Materialization)

**Files:**
- Create: `src/api/voice/SyncService.ts`

- [ ] **Step 1: Implement encrypted text sync**
  - Receive JSON notes from Machina Terminal.
  - Shore into `data/vault/RKG/Vocal_Notes/`.

- [ ] **Step 2: Commit**
  ```bash
  git add src/api/voice/SyncService.ts
  git commit -m "feat(ingest): implement vocal note synchronization artery"
  ```
