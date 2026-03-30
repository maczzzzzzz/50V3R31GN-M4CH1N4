# Phase 4 (MVP Assembly) Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the Split-Node architecture into a playable continuous solo loop for Cyberpunk RED (Story Engine, Night Market Eagle Economy, and GM Approval Queue).

**Architecture:** Node B acts as the Orchestrator, utilizing a `StoryState` Zod schema and a `StoryEngine` controller to track "Arc -> Beat -> Event" narrative state. We will extend the `foundry-api-bridge-module` and `HybridRoutingController` to process a new `buy_item` Foundry event that maps Eurobucks to TTTA "Eagles". A new `GmApprovalQueue` will intercept major state changes to keep a human-in-the-loop.

**Tech Stack:** Node.js, TypeScript, Zod, Vitest, Foundry VTT v12 WebSocket Bridge.

---

### Task 1: Story Engine State Schema

**Files:**
- Create: `src/shared/schemas/story.schema.ts`
- Create: `tests/shared/story.schema.test.ts`
- Modify: `src/shared/schemas/index.ts`

**Step 1: Write the failing test**

```typescript
// tests/shared/story.schema.test.ts
import { describe, it, expect } from 'vitest';
import { StoryStateSchema } from '../../src/shared/schemas/story.schema.js';

describe('StoryStateSchema', () => {
  it('validates a correct story state', () => {
    const valid = {
      currentArc: 'TttA Part 3 - Back Alley Boogey',
      currentBeat: 'Beat 1: Dustwalker',
      completedBeats: ['Beat 0'],
      worldState: { sprinters_gaff_searched: true },
      eagleBalance: 5,
    };
    const result = StoryStateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects negative eagle balance', () => {
    const invalid = {
      currentArc: 'Arc 1',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: -1,
    };
    const result = StoryStateSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/shared/story.schema.test.ts`
Expected: FAIL with module not found.

**Step 3: Write minimal implementation**

```typescript
// src/shared/schemas/story.schema.ts
import { z } from 'zod';

export const StoryStateSchema = z.object({
  currentArc: z.string().min(1),
  currentBeat: z.string().min(1),
  completedBeats: z.array(z.string()),
  worldState: z.record(z.any()),
  eagleBalance: z.number().nonnegative(),
});

export type StoryState = z.infer<typeof StoryStateSchema>;
```

Modify `src/shared/schemas/index.ts` to export it:
```typescript
export * from './story.schema.js';
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/shared/story.schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/shared/story.schema.test.ts src/shared/schemas/story.schema.ts src/shared/schemas/index.ts
git commit -m "feat(phase-4): add StoryStateSchema using Zod"
```

### Task 2: Buy Item Event Schema

**Files:**
- Modify: `src/shared/schemas/foundry-bridge.schema.ts`
- Create: `tests/shared/foundry-event.schema.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/shared/foundry-event.schema.test.ts
import { describe, it, expect } from 'vitest';
import { BuyItemEventSchema } from '../../src/shared/schemas/foundry-bridge.schema.js';

describe('BuyItemEventSchema', () => {
  it('validates a buy_item event', () => {
    const valid = {
      type: 'buy_item',
      payload: {
        itemId: 'ITEM123',
        costEb: 100,
        costEagles: 0.5,
        vendor: 'Mr. Connors'
      }
    };
    const result = BuyItemEventSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/shared/foundry-event.schema.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

Modify `src/shared/schemas/foundry-bridge.schema.ts`:
Add:
```typescript
export const BuyItemEventSchema = z.object({
  type: z.literal('buy_item'),
  payload: z.object({
    itemId: z.string().min(1),
    costEb: z.number().nonnegative(),
    costEagles: z.number().nonnegative(),
    vendor: z.string().min(1),
  }),
});
```
*(Also, add `BuyItemEventSchema` to the `FoundryEventSchema` discriminated union if it exists in that file.)*

**Step 4: Run test to verify it passes**

Run: `npm run test tests/shared/foundry-event.schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/shared/foundry-event.schema.test.ts src/shared/schemas/foundry-bridge.schema.ts
git commit -m "feat(phase-4): add BuyItemEventSchema to Foundry bridge protocol"
```

### Task 3: GM Approval Queue

**Files:**
- Create: `src/core/gm-approval-queue.ts`
- Create: `tests/core/gm-approval-queue.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/gm-approval-queue.test.ts
import { describe, it, expect } from 'vitest';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';

describe('GmApprovalQueue', () => {
  it('queues, retrieves, and resolves proposed state changes', () => {
    const queue = new GmApprovalQueue();
    const proposal = { type: 'STATE_CHANGE', data: { arc: 'Next Arc' } };
    
    const id = queue.enqueue(proposal);
    expect(queue.getPending()).toHaveLength(1);
    
    queue.resolve(id, 'approved');
    expect(queue.getPending()).toHaveLength(0);
    expect(queue.getHistory()[0].status).toBe('approved');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/gm-approval-queue.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/gm-approval-queue.ts
import { randomUUID } from 'node:crypto';

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'edited';

export interface ProposedChange {
  id: string;
  type: string;
  data: any;
  status: ApprovalStatus;
  timestamp: Date;
}

export class GmApprovalQueue {
  private queue: Map<string, ProposedChange> = new Map();

  enqueue(data: { type: string; data: any }): string {
    const id = randomUUID();
    this.queue.set(id, {
      id,
      ...data,
      status: 'pending',
      timestamp: new Date(),
    });
    return id;
  }

  getPending(): ProposedChange[] {
    return Array.from(this.queue.values()).filter(p => p.status === 'pending');
  }

  getHistory(): ProposedChange[] {
    return Array.from(this.queue.values());
  }

  resolve(id: string, status: ApprovalStatus, newData?: any): boolean {
    const item = this.queue.get(id);
    if (!item) return false;
    
    item.status = status;
    if (newData) item.data = newData;
    return true;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/gm-approval-queue.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/core/gm-approval-queue.test.ts src/core/gm-approval-queue.ts
git commit -m "feat(phase-4): implement GmApprovalQueue"
```

### Task 4: Hybrid Routing Controller Update

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Modify: `tests/core/hybrid-routing-controller.test.ts`

**Step 1: Write the failing test**

```typescript
// Add this to tests/core/hybrid-routing-controller.test.ts
import { expect, it, vi } from 'vitest';
// ... set up dependencies ...

it('routes buy_item and requests GM approval or Node A validation', async () => {
    // Write test to ensure handleFoundryEvent works with buy_item
    // and correctly invokes dependencies.
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`

**Step 3: Write minimal implementation**

Update `src/core/hybrid-routing-controller.ts` to process the `buy_item` event. Add it to the switch case in `handleFoundryEvent`. 

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts tests/core/hybrid-routing-controller.test.ts
git commit -m "feat(phase-4): add buy_item routing to HybridRoutingController"
```

### Task 5: Night Market Foundry API Bridge Extension

**Files:**
- Modify: `foundry-module/foundry-api-bridge.js`

**Step 1: Write minimal implementation**
Add a method inside the `FoundryApiBridge` class to emit `buy_item` events upstream to Node B when triggered by the UI.

```javascript
  // Inside FoundryApiBridge class
  sendBuyItemEvent(itemId, costEb, costEagles, vendor) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    const event = {
      type: 'buy_item',
      payload: { itemId, costEb, costEagles, vendor }
    };
    this.ws.send(JSON.stringify(event));
  }
```
Expose this class to the global window scope (e.g. `window.FoundryApiBridgeInstance = this;`) during `init()` so the Night Market macro can call it.

**Step 2: Commit**

```bash
git add foundry-module/foundry-api-bridge.js
git commit -m "feat(phase-4): add buy_item upstream event to foundry-api-bridge"
```

### Task 6: Story Engine Controller Core

**Files:**
- Create: `src/core/story-engine.ts`
- Create: `tests/core/story-engine.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/story-engine.test.ts
import { describe, it, expect } from 'vitest';
import { StoryEngine } from '../../src/core/story-engine.js';

describe('StoryEngine', () => {
  it('advances beats based on events', () => {
    const engine = new StoryEngine({ currentArc: 'Arc1', currentBeat: 'Beat1', completedBeats: [], worldState: {}, eagleBalance: 0 });
    engine.evaluateEvent({ type: 'success_roll' });
    expect(engine.getState().currentBeat).toBe('Beat2');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/story-engine.test.ts`

**Step 3: Write minimal implementation**
Implement `StoryEngine` class that initializes with a `StoryState` and has an `evaluateEvent(event: any)` method that conditionally mutates state. For now, simply map a `success_roll` event to a transition to "Beat2" for the test to pass.

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/story-engine.test.ts`

**Step 5: Commit**

```bash
git add src/core/story-engine.ts tests/core/story-engine.test.ts
git commit -m "feat(phase-4): implement StoryEngine state machine"
```
