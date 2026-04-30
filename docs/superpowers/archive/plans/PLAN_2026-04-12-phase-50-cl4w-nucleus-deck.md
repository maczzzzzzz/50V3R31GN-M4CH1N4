# PHASE 50: Nucleus Command Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the monolithic WebGL command center and the Go-based Protobuf bridge.

**Architecture:** A React 19 + PIXI.js v8 frontend served by an expanded Go `crush` server, bridging VSB state via Protobuf-WebSockets.

---

### Task 1: The Go Nucleus Artery

- [ ] **Step 1: Implement Protobuf WebSocket Server in `crush/nucleus.go`**
Create the server to read VSB Mmap state and pipe it to Port 3030.

- [ ] **Step 2: Implement Tiered Ignition Handlers**
Add Go logic to spawn background processes for `GHOST`, `FULL`, and `LITE` modes.

- [ ] **Step 3: Commit**
```bash
git add crush/nucleus.go
git commit -m "feat: implement Go Nucleus Artery and Protobuf bridge"
```

---

### Task 2: Web-Nucleus Scaffold

- [ ] **Step 1: Scaffold Vite project in `dashboard/cl4w-nucleus/`**
Use React-TS template and install `pixi.js`, `@pixi/react`, and `pretext-engine`.

- [ ] **Step 2: Implement Root Pretext Surface & Shroud Filter**
Apply the Sovereign Shroud shader to the master container.

- [ ] **Step 3: Commit**
```bash
git add dashboard/cl4w-nucleus/
git commit -m "feat: scaffold CL4W Nucleus frontend with PIXI.js and Pretext"
```

---

### Task 3: Unified Panels & Audio Engine

- [ ] **Step 1: Implement Holographic Quadrants**
Create the four Pretext-based panels: `COMMAND`, `SENSORY`, `INTRUSION`, `LOGISTICS`.

- [ ] **Step 2: Implement Dial-Up Audio Engine**
Add the modem handshake trigger for VSB Approval (Flush Gate) events.

- [ ] **Step 3: Commit**
```bash
git add dashboard/cl4w-nucleus/src/components/
git commit -m "feat: implement unified Pretext panels and dial-up audio engine"
```

---

### Task 4: Nucleus Ability Shard (Phase 50)

- [ ] **Step 1: Create `scripts/gauntlet/phases/orch-50.ts`**
Implement the `audit()` hook to verify WebSocket connectivity and Audio readiness.

- [ ] **Step 2: Implement `onDrift()` Repair Loop**
Add the 2-stage retry and graceful shutdown logic to the shard.

- [ ] **Step 3: Commit**
```bash
git add scripts/gauntlet/phases/orch-50.ts
git commit -m "feat: implement Phase 50 Ability Shard with autonomous repair"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
