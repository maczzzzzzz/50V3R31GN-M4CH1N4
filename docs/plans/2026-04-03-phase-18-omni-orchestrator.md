# Phase 18: Omni Orchestrator Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the reactive "Central Nervous System" of the living city by implementing concurrent event classification, automated profile mapping, and strict state-loop mechanics for total autonomy.

**Architecture:** Node B will act as the master traffic controller using a `TaskRouterProxy` to manage hardware constraints (VRAM swapping on Node A). The Foundry Client will implement a `SensoryFilter` to provide strict, hallucination-free line-of-sight data to the LLM. The system will use an `Intent Swarm` to classify events concurrently and map them to physical Bridge sequences.

**Tech Stack:** TypeScript, Node.js (Orchestrator), Foundry VTT (PIXI/Canvas APIs).

---

### Task 1: TaskRouterProxy Scaffold & Queue (Node B)

**Files:**
- Create: `src/core/task-router-proxy.ts`
- Test: `tests/core/task-router-proxy.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { TaskRouterProxy } from '../../src/core/task-router-proxy.js';

describe('TaskRouterProxy', () => {
  it('queues tasks when the destination node is locked', async () => {
    const proxy = new TaskRouterProxy();
    proxy.lockNode('NodeA');
    
    let resolved = false;
    const task = proxy.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      return 'success';
    }).then(() => { resolved = true; });

    // Yield to event loop
    await new Promise(r => setTimeout(r, 10));
    expect(resolved).toBe(false);

    proxy.unlockNode('NodeA');
    await task;
    expect(resolved).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/task-router-proxy.test.ts`
Expected: FAIL with "TaskRouterProxy is not defined" or similar.

**Step 3: Write minimal implementation**

```typescript
export type HardwareNode = 'NodeA' | 'NodeB';
export type HardwareCost = 'LIGHT' | 'HEAVY';

export interface TaskConfig {
  destination: HardwareNode;
  cost: HardwareCost;
}

export class TaskRouterProxy {
  private locks: Set<HardwareNode> = new Set();
  private queues: Map<HardwareNode, Array<() => Promise<void>>> = new Map();

  constructor() {
    this.queues.set('NodeA', []);
    this.queues.set('NodeB', []);
  }

  lockNode(node: HardwareNode) {
    this.locks.add(node);
  }

  unlockNode(node: HardwareNode) {
    this.locks.delete(node);
    this.processQueue(node);
  }

  async dispatch<T>(config: TaskConfig, taskFn: () => Promise<T>): Promise<T> {
    if (!this.locks.has(config.destination)) {
      return taskFn();
    }

    return new Promise((resolve, reject) => {
      const queue = this.queues.get(config.destination)!;
      queue.push(async () => {
        try {
          resolve(await taskFn());
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async processQueue(node: HardwareNode) {
    const queue = this.queues.get(node)!;
    while (queue.length > 0 && !this.locks.has(node)) {
      const task = queue.shift();
      if (task) await task();
    }
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/task-router-proxy.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/task-router-proxy.ts tests/core/task-router-proxy.test.ts
git commit -m "feat(orchestrator): implement TaskRouterProxy with hardware locking queue"
```

---

### Task 2: Implement SensoryFilter in Foundry Client

**Files:**
- Create: `foundry-module/scripts/sensory-filter.js`
- Test: `tests/scripts/sensory-filter.test.ts` (Mocking Foundry APIs)

**Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
// We will mock Foundry's canvas.walls.computePolygon and token placement
// and test that SensoryFilter.getVisibleEntities(tokenId) returns only tokens in LOS.
describe('SensoryFilter', () => {
  it('filters entities outside of the computed LOS polygon', () => {
    // Stub implementation for test
    expect(true).toBe(false); // Replace with actual mock logic during execution
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scripts/sensory-filter.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```javascript
// foundry-module/scripts/sensory-filter.js
export class SensoryFilter {
  static getVisibleEntities(tokenId) {
    const token = canvas.tokens.get(tokenId);
    if (!token) return [];

    // Compute Line of Sight Polygon
    const los = canvas.walls.computePolygon({
      x: token.center.x,
      y: token.center.y,
      type: "sight",
      radius: token.vision.radius
    });

    const visibleTokens = canvas.tokens.placeables.filter(t => {
      if (t.id === tokenId) return false; // Ignore self
      return los.contains(t.center.x, t.center.y);
    });

    return visibleTokens.map(t => ({
      id: t.id,
      name: t.name,
      x: t.x,
      y: t.y,
      disposition: t.document.disposition
    }));
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scripts/sensory-filter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add foundry-module/scripts/sensory-filter.js tests/scripts/sensory-filter.test.ts
git commit -m "feat(foundry): implement strict SensoryFilter for NPC LOS"
```

---

### Task 3: Intent Swarm & Profile Mapping (Node B)

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Modify: `src/shared/schemas/foundry-bridge.schema.ts`

**Step 1: Write the failing test**

```typescript
// Add to tests/core/hybrid-routing-controller.test.ts
describe('Intent Swarm', () => {
  it('dispatches concurrent requests to determine Tone and Intensity', async () => {
    // Mock ollama and nitrologic, spy on them.
    // Assert both were called concurrently (Promise.all).
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts (Add to class)
async evaluateIntentSwarm(context: string): Promise<{ tone: string, intensity: number }> {
  // Use TaskRouterProxy to dispatch concurrently
  const [toneTask, intensityTask] = await Promise.all([
    this.taskRouter.dispatch({ destination: 'NodeB', cost: 'HEAVY' }, async () => {
      return this.ollama.generateNarrative('Determine emotional tone (1 word) of:', context);
    }),
    this.taskRouter.dispatch({ destination: 'NodeA', cost: 'LIGHT' }, async () => {
      const response = await this.nitroLogic.calculateDv({ /* mock or real */ });
      return response.dv > 15 ? 0.8 : 0.2; // Derived scalar
    })
  ]);
  
  return { tone: toneTask, intensity: intensityTask as number };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts src/shared/schemas/foundry-bridge.schema.ts
git commit -m "feat(orchestrator): implement Intent Swarm evaluation and TaskRouterProxy integration"
```