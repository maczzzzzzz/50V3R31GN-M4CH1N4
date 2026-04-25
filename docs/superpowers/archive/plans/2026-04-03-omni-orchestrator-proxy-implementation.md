# Omni-Orchestrator Proxy Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement hardware-aware task routing on Node B and Line-of-Sight state filtering on the Foundry client for autonomous agents.

**Architecture:** `HybridRoutingController` gets a queuing mechanism to handle Node A's sequential VRAM limits. The Foundry module implements a `SensoryFilter` to cull invisible tokens before sending the world state to Node B.

**Tech Stack:** TypeScript (Node B), JavaScript (Foundry API).

---

### Task 1: Implement Hardware-Aware Queuing in HybridRoutingController

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
describe('Hardware Proxy Queuing', () => {
  it('queues light requests while Node A is locked', async () => {
    // Lock the node
    hrc.setNodeALock(true);
    // Dispatch request, verify it pends
    const req = hrc.dispatchToNodeA('calculate_dv', payload);
    // Unlock and verify resolution
  });
});
```

**Step 2: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts
import { Mutex } from 'async-mutex'; // Ensure installed

export class HybridRoutingController {
  private nodeAMutex = new Mutex();

  // Route D10/Math to Node A safely
  public async dispatchToNodeA(action: string, payload: any): Promise<any> {
    return await this.nodeAMutex.runExclusive(async () => {
        // Execute nitroLogic or spatialVision call here
        return await this.nitroLogic[action](payload);
    });
  }
}
```

**Step 3: Commit**

```bash
git add src/core/hybrid-routing-controller.ts
git commit -m "feat(core): implement Mutex queuing for Node A hardware constraint routing"
```

---

### Task 2: Implement SensoryFilter for Autonomous NPCs

**Files:**
- Create: `foundry-module/scripts/sensory-filter.js`

**Step 1: Implement LoS Filtering Logic**

```javascript
// foundry-module/scripts/sensory-filter.js
export class SensoryFilter {
  static getVisibleState(actorToken) {
    if (!actorToken.vision) return { tokens: [] };
    
    // Compute LOS polygon for the token
    const los = CONFIG.Canvas.losBackend.create(actorToken.center, { type: 'sight', source: actorToken.vision });
    
    const visibleTokens = canvas.tokens.placeables.filter(t => {
      if (t.id === actorToken.id) return false;
      // Check if target center is within the LOS polygon
      return los.contains(t.center.x, t.center.y);
    }).map(t => ({
      id: t.id,
      name: t.name,
      distance: Math.round(canvas.grid.measureDistance(actorToken, t))
    }));

    return {
      self: { id: actorToken.id, hp: actorToken.actor.system.derivedStats.hp.value },
      visibleEntities: visibleTokens
    };
  }
}
```

**Step 2: Commit**

```bash
git add foundry-module/scripts/sensory-filter.js
git commit -m "feat(foundry): implement SensoryFilter to cull invisible entities for AI state loop"
```

---
**LINKS:** [[OS_CORE]]
