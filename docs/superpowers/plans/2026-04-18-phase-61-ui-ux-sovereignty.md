# Phase 61: UI/UX Sovereignty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Shadow Dashboard into an interactive Command Center for rules, economy, and scene orchestration.

**Architecture:** Next.js frontend with specialized "Command Views" that communicate via an enhanced WebSocket bridge to the Node B Director.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide Icons, Protobuf.

---

### Task 1: Navigation & Routing Expansion

**Files:**
- Modify: `dashboard/app/layout.tsx`
- Create: `dashboard/app/lexicon/page.tsx`
- Create: `dashboard/app/economy/page.tsx`
- Create: `dashboard/app/combat/page.tsx`

- [x] **Step 1: Implement Side-Navigation**
Add a sidebar to `layout.tsx` to allow switching between Dash, Lexicon, Economy, and Combat views.

- [x] **Step 2: Commit**

```bash
git add dashboard/app/
git commit -m "ui: implement sidebar navigation and route structure"
```

---

### Task 2: Combat Artery (Node A reasoning)

**Files:**
- Create: `dashboard/components/CombatStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleLog.tsx`
- Modify: `dashboard/app/combat/page.tsx`

- [x] **Step 1: Implement Terminal Component**
Create a component that subscribes to the telemetry stream and renders "roll_breakdown" events in a high-fidelity terminal style.

- [x] **Step 2: Commit**

```bash
git add dashboard/components/CombatStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleLog.tsx dashboard/app/combat/
git commit -m "ui: add real-time combat reasoning visualization"
```

---

### Task 3: Economy Command (Night Markets)

**Files:**
- Create: `dashboard/components/MarketTerminal.tsx`
- Modify: `dashboard/app/economy/page.tsx`

- [x] **Step 1: Implement Market Controls**
Create buttons to trigger `cmd_generate_market` and a list view to browse the generated results from the `night_markets` table.

- [x] **Step 2: Implement Deployment Hook**
Add a "Manifest" button that sends the `cmd_deploy_vendor` packet to Node B.

- [x] **Step 3: Commit**

```bash
git add dashboard/components/MarketTerminal.tsx dashboard/app/economy/
git commit -m "ui: implement interactive night market generator and deployer"
```

---

### Task 4: Item Lexicon (Canonical Browser)

**Files:**
- Create: `dashboard/components/ItemBrowser.tsx`
- Modify: `dashboard/app/lexicon/page.tsx`

- [x] **Step 1: Implement Fuzzy Search**
A grid view with a search bar that queries the 1000+ official items via a new Node B API endpoint.

- [x] **Step 2: Commit**

```bash
git add dashboard/components/ItemBrowser.tsx dashboard/app/lexicon/
git commit -m "ui: implement canonical item browser for akashik lexicon"
```
