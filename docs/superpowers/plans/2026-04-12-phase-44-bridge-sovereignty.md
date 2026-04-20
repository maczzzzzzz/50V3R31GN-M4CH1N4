# Phase 44: Mesh Sovereignty & Motor Cortex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the "Motor Cortex" within the Foundry Mesh, enabling direct administrative system control (Actor creation, Scene manipulation, and Raw JS execution) requested by the Sovereign Machina.

**Architecture:** Upgrades the `50v3r31gn-bridge` WebSocket dispatcher with privileged handlers. Integrates with **Socketlib** for GM-level execution and provides a hardened command pipe for automated materialization.

**Tech Stack:** JavaScript, WebSocket, Socketlib (Foundry VTT Module).

---

### Task 1: Privileged Mesh Handlers

**Files:**
- Modify: `50v3r31gn-bridge/50v3r31gn-bridge.js`

- [ ] **Step 1: Implement the `create_actor` dispatcher**
Add logic to the `_dispatch` method to handle incoming JSON actor data and execute `Actor.create()`.

- [ ] **Step 2: Implement the `run_script` (Socketlib) dispatcher**
Add logic to handle raw JS strings. Use `this.socket.executeAsGM('executeRawJs', ...)` to ensure the code runs with full permissions.

- [ ] **Step 3: Implement the `create_scene` dispatcher**
Add logic to handle background image setup and initial grid configuration.

- [ ] **Step 4: Sync to Windows and Verify**
Run: `cp 50v3r31gn-bridge/50v3r31gn-bridge.js /mnt/d/FoundryVTT_Data/Data/modules/50v3r31gn-bridge/50v3r31gn-bridge.js`
Verify in Foundry console: `SOVEREIGN_BRIDGE` has the new handlers.

- [ ] **Step 5: Commit**
`git add . && git commit -m "feat: phase 44 - implement motor cortex bridge handlers"`

---

### Task 2: Machine Control Verification (Live-Fire)

**Files:**
- Create: `scripts/gauntlet/phases/motor-cortex.ts`

- [ ] **Step 1: Create the Motor Cortex Ability Shard**
Implement a shard that tests `create_actor` and `run_script` via the new Mesh hooks.

- [ ] **Step 2: Run Verification**
Run: `npm run gauntlet`
Expected: 🟢 Phase 44 Shard passes.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: add Phase 44 ability shard for motor cortex verification"`
