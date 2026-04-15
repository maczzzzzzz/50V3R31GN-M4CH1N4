# Interactive Scene Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the interactive logic for tactical props (Cameras, Terminals, Debris) and integrate them with the Cyberdeck/Web UI.

**Architecture:** A centralized `HardwareRegistry` in Akashik.db manages logical links. `HybridRoutingController` dispatches hacking intents from the Web Deck to mechanical actions in Foundry.

**Tech Stack:** TypeScript, SQLite, VSB (Binary UDP), React (Nucleus Deck).

---

### Task 1: Hardware Registry Schema & Data Model

**Files:**
- Modify: `src/db/world-schema.sql` (Add `hardware_registry` table)
- Create: `src/core/hardware-registry-service.ts`

- [ ] **Step 1: Update the database schema**
- [ ] **Step 2: Implement the HardwareRegistryService**
```typescript
// Add methods: registerNode(), getLinkedEntities(), updateStatus()
```
- [ ] **Step 3: Commit**
```bash
git add src/db/world-schema.sql src/core/hardware-registry-service.ts
git commit -m "feat: db: implement hardware registry for interactive props"
```

### Task 2: Camera Vision Logic

**Files:**
- Modify: `src/core/spatial-vision-service.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

- [ ] **Step 1: Implement Camera FOV detection**
```typescript
// Define 45-degree cone from prop position
// Check for token intersection every 2s
```
- [ ] **Step 2: Wire detection to Node A Stealth Check**
- [ ] **Step 3: Commit**
```bash
git add src/core/spatial-vision-service.ts src/core/hybrid-routing-controller.ts
git commit -m "feat: sentinel: implement security camera vision logic"
```

### Task 3: Intrusion Quadrant (Web UI Bridge)

**Files:**
- Modify: `dashboard/components/IntrusionQuadrant.tsx`
- Modify: `src/core/task-router-proxy.ts`

- [ ] **Step 1: Enable Intrusion UI based on Cyberdeck inventory**
- [ ] **Step 2: Implement node control buttons (Loop, Unlock, Blackout)**
- [ ] **Step 3: Commit**
```bash
git add dashboard/components/IntrusionQuadrant.tsx src/core/task-router-proxy.ts
git commit -m "feat: web: integrate terminal hacking into Nucleus Deck"
```

### Task 4: Tactical Debris Manifestation

**Files:**
- Modify: `scripts/forge/assembler.ts`
- Create: `scripts/dev/test-debris-roll.ts`

- [ ] **Step 1: Add blowPathway() logic to the Assembler**
```typescript
// Spawn debris-pile.webp and inject physical Wall segment
```
- [ ] **Step 2: Verify with a mock structural roll**
- [ ] **Step 3: Commit**
```bash
git add scripts/forge/assembler.ts scripts/dev/test-debris-roll.ts
git commit -m "feat: tactical: implement dynamic debris/pathway obstruction"
```
---
