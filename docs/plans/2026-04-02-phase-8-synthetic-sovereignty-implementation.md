# Phase 8 "Synthetic Sovereignty" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the "Night City Dashboard" Sidebar in Foundry and activate autonomous NPC world-drift logic.

**Architecture:** Vertical flex-column Sidebar in Foundry (Vanilla JS/CSS) synced via WebSocket to Node B. Autonomous drift engine runs as a throttled background task in `HybridRoutingController`.

**Tech Stack:** Foundry VTT Sidebar API, Handlebars, TypeScript, SQLite.

---

### Task 1: Foundry Sidebar Registration

**Files:**
- Modify: `foundry-module/module.json` (Register sidebar tab)
- Create: `foundry-module/templates/dashboard.hbs`
- Modify: `foundry-module/foundry-api-bridge.js` (Implement `DashboardTab` class)

**Step 1: Register the Tab**
Add `sidebarTab` entry to `module.json`.

**Step 2: Create Handlebars Template**
Implement the 3-zone layout (Bio, Pulse, Console) with Crush CLI aesthetic.

**Step 3: Implementation the Dashboard Logic**
Create the `DashboardTab` class extending `Application`. Handle incoming `dashboard_sync` frames.

**Step 4: Verification**
Reload Foundry and verify the "Terminal" icon appears in the sidebar.

---

### Task 2: Dashboard Data Synchronization

**Files:**
- Modify: `src/shared/schemas/foundry-bridge.schema.ts` (Add `dashboard_sync` frame)
- Modify: `src/api/foundry-adapter.ts` (Add `pushDashboardUpdate` method)
- Modify: `src/db/unified-oracle-client.ts` (Add `getDashboardState` query)

**Step 1: Update Schema**
Define the Zod contract for the full dashboard state.

**Step 2: Implement State Query**
Create a performant SQLite query that aggregates NPC stats and Grid strength into a single JSON object.

**Step 3: Wire to Adapter**
Enable Node B to push this state to Foundry whenever a mutation occurs.

**Step 4: Verification**
Update an NPC's HP in `world.db` and verify the ASCII bar updates in the sidebar instantly.

---

### Task 3: The Sovereignty Engine (Drift Logic)

**Files:**
- Create: `src/core/sovereignty-engine.ts`
- Modify: `src/main.ts` (Start the engine loop)

**Step 1: Implement NPC Drift Algorithm**
Create logic that moves NPCs between adjacent district grid cells based on "Faction Heat".

**Step 2: Implement Screamsheet Automation**
Trigger `discord-chronicler` posts when a cell in the 10x10 grid changes ownership.

**Step 3: Verification**
Verify `world.db` coordinates change autonomously over 10 minutes.

---

### Task 4: Final Aesthetic Pass & CRT Glow

**Files:**
- Create: `foundry-module/styles/dashboard.css`

**Step 1: Implement CLI Styling**
Apply deep void background, scanlines, and neon glow effects.

**Step 2: Final Verification**
Verify the Sidebar feels like an extension of the Afterlife terminal.
