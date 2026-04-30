# 53N71N3L (Sentinel) Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-density, low-latency Hybrid Context Engine and Reactive Risk Monitor.

**Architecture:** Node A (Kernel) performs real-time VSB distillation and pushes state updates via UDP (Type 0x0A) to Node B (Director), which maintains an Active Context Slot for near-instant narrative synthesis. A pattern-based monitor delegates risk judgment back to Node A for automated recovery.

**Tech Stack:** TypeScript (Node.js), Rust (ZeroClaw), VSB (Binary UDP), SQLite (Akashik.db).

---

### Task 1: Protocol Infrastructure (VSB 0x0A)

**Files:**
- Modify: `src/api/vsb-client.ts` (Add Type 0x0A handling)
- Modify: `src/types/vsb_protocol.ts` (Define SovereignContextUpdate schema)

- [ ] **Step 1: Define the 0x0A packet structure**
```typescript
// src/types/vsb_protocol.ts
export interface SovereignContextUpdate {
  type: 0x0A;
  timestamp: number;
  context_hash: number;
  payload: string; // Compressed AAAK context
}
```

- [ ] **Step 2: Add 0x0A listener to VsbClient**
```typescript
// src/api/vsb-client.ts
// Add handleContextUpdate method and wire to the UDP listener
```

- [ ] **Step 3: Commit**
```bash
git add src/api/vsb-client.ts src/types/vsb_protocol.ts
git commit -m "feat: vsb: define context update protocol (0x0A)"
```

### Task 2: Kernel Distiller (Node A)

**Files:**
- Create: `scripts/dev/sentinel-distiller.ts`
- Modify: `scripts/gauntlet/phases/orch-block.ts` (Integration testing)

- [ ] **Step 1: Implement background VSB monitoring and distillation**
```typescript
// scripts/dev/sentinel-distiller.ts
// Listen to 0x01 (Tactical) and 0x05 (Friction)
// Compress into AAAK dialect
// Push 0x0A to Node B
```

- [ ] **Step 2: Verify distillation logic with a mock VSB stream**
Run: `npx tsx scripts/dev/sentinel-distiller.ts --mock`
Expected: Log "Pushed 0x0A update: [hash]"

- [ ] **Step 3: Commit**
```bash
git add scripts/dev/sentinel-distiller.ts
git commit -m "feat: sentinel: implement kernel distiller on Node A"
```

### Task 3: Active Context Slot (Node B)

**Files:**
- Modify: `src/core/sovereign-narrative-client.ts`
- Modify: `src/main.ts` (Wiring)

- [ ] **Step 1: Implement the ActiveContextSlot buffer**
```typescript
// src/core/sovereign-narrative-client.ts
// Add private activeContext: string = '';
// Add updateContext(payload: string) method
```

- [ ] **Step 2: Refactor generateNarrative to use the slot**
```typescript
// Use this.activeContext if available instead of fetching from VSB mid-turn
```

- [ ] **Step 3: Commit**
```bash
git add src/core/sovereign-narrative-client.ts src/main.ts
git commit -m "refactor: narrative: integrate active context slot"
```

### Task 4: Reactive Risk Monitor

**Files:**
- Create: `src/core/sentinel-monitor-service.ts`
- Modify: `src/shared/logger.ts` (Hook for log patterns)

- [ ] **Step 1: Implement watch_patterns observer**
```typescript
// src/core/sentinel-monitor-service.ts
// Observe log patterns for 503, VRAM, and Timeouts
```

- [ ] **Step 2: Implement Sovereign Judgment loop**
```typescript
// Send pattern to Node A Reasoner
// Execute Verdict (LOG | BACKUP | REBOOT)
```

- [ ] **Step 3: Commit**
```bash
git add src/core/sentinel-monitor-service.ts
git commit -m "feat: sentinel: deploy reactive risk monitor"
```

### Task 5: System Stress Test (Gauntlet 56)

**Files:**
- Create: `scripts/gauntlet/phases/orch-56.ts`

- [ ] **Step 1: Write stress test for 0x0A push latency**
- [ ] **Step 2: Write test for automated recovery trigger**
- [ ] **Step 3: Run stress test**
Run: `npm run gauntlet --shard=56`
Expected: 100% PASS

- [ ] **Step 4: Commit**
```bash
git add scripts/gauntlet/phases/orch-56.ts
git commit -m "test: gauntlet: verify Sentinel refactor integrity"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
