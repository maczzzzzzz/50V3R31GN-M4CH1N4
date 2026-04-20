# Phase 31: Action Sovereignty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish physical reality dominance by implementing a structured Physical Trigger API (deprecating `runScript`) and active defense counter-hacks.

**Architecture:** Transition from arbitrary JS injection to a structured capability-based RPC model. The machine "harvests" available actions from the Foundry world and exposes them through a secure, audited API.

**Tech Stack:** TypeScript (Node B), JavaScript (Foundry Mesh), libWrapper, VSB (Shared Synapse).

---

### Task 1: Capability Harvesting (Foundry Mesh)

**Files:**
- Modify: `foundry-module/foundry-api-bridge.js`
- Modify: `src/shared/schemas/foundry-bridge.schema.ts`

- [ ] **Step 1: Implement ActionHarvester in the bridge**
Update `foundry-api-bridge.js` to scan controlled tokens for available actions (Attacks, Skills, Programs).

```javascript
// foundry-module/foundry-api-bridge.js
class ActionHarvester {
  static harvest(token) {
    if (!token?.actor) return [];
    return token.actor.items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img
    }));
  }
}
```

- [ ] **Step 2: Add `capabilities_update` event to schema**
Define the data structure for harvested capabilities.

```typescript
// src/shared/schemas/foundry-bridge.schema.ts
export const CapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  img: z.string().optional()
});

export const CapabilitiesUpdateSchema = z.object({
  type: z.literal('capabilities_update'),
  payload: z.object({
    actorId: z.string(),
    items: z.array(CapabilitySchema)
  })
});
```

- [ ] **Step 3: Emit capabilities on token control change**
Hook into `controlToken` to send updates to Node B.

- [ ] **Step 4: Commit**
`git add foundry-module/foundry-api-bridge.js src/shared/schemas/foundry-bridge.schema.ts && git commit -m "feat: implement capability harvesting in Foundry bridge"`

---

### Task 2: Physical Trigger API (Node B & Mesh)

**Files:**
- Modify: `src/api/foundry-adapter.ts`
- Modify: `foundry-module/foundry-api-bridge.js`

- [ ] **Step 1: Implement `executeAction` in bridge**
Add handler for structured action execution.

```javascript
// foundry-module/foundry-api-bridge.js
async handleExecuteAction(actorId, itemId) {
  const actor = game.actors.get(actorId);
  const item = actor?.items.get(itemId);
  if (item) return await item.use();
  throw new Error("Item not found");
}
```

- [ ] **Step 2: Implement `triggerTile` in bridge**
Integrate with Monks Active Tiles.

```javascript
// foundry-module/foundry-api-bridge.js
async handleTriggerTile(tileId) {
  const tile = canvas.tiles.get(tileId);
  if (tile) return await tile.trigger();
}
```

- [ ] **Step 3: Expose methods in `FoundryAdapter`**
Add structured methods to replace `runScript`.

```typescript
// src/api/foundry-adapter.ts
async executeAction(actorId: string, itemId: string): Promise<void> {
  return this.sendCommand('execute_action', { actorId, itemId });
}
```

- [ ] **Step 4: Commit**
`git commit -m "feat: implement physical trigger API (executeAction, triggerTile)"`

---

### Task 3: Counter-Hacks (Active Defense)

**Files:**
- Modify: `foundry-module/foundry-api-bridge.js`

- [ ] **Step 1: Intercept `modifyDocument` via libWrapper**
Prevent unauthorized token movement.

```javascript
// foundry-module/foundry-api-bridge.js
_setupCounterHacks() {
  libWrapper.register(MODULE_ID, 'TokenDocument.prototype.update', async function(wrapped, ...args) {
    const [data] = args;
    if (data.x !== undefined || data.y !== undefined) {
      const isLegal = await bridge.sendRequest('validate_move', { actorId: this.actor.id, x: data.x, y: data.y });
      if (!isLegal.valid) return null; // Kill the update
    }
    return wrapped(...args);
  }, 'MIXED');
}
```

- [ ] **Step 2: Implement `validate_move` in Node B**
Check movement against fog-of-war or restricted regions.

- [ ] **Step 3: Commit**
`git commit -m "feat: implement active defense counter-hacks for token movement"`

---

### Task 4: VSB Capability Mapping

**Files:**
- Modify: `src/core/shared-memory-service.ts`
- Modify: `sovereign-sdk/src/protocol.rs`

- [ ] **Step 1: Define Capability structure in SDK**
Update Rust SDK to include capability blips.

- [ ] **Step 2: Implement `writeCapabilities` in `SharedSynapseService`**
Map harvested items into VSB for HUD consumption.

- [ ] **Step 3: Commit**
`git commit -m "feat: map harvested capabilities to VSB shared memory"`
