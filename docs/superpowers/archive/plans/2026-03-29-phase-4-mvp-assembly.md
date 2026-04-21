# Phase 4 (MVP Assembly) Implementation Plan (REVISED)

**Goal:** Wire the Split-Node architecture into a playable continuous solo loop for Cyberpunk RED.

---

### Task 1: Story Engine State Schema
**Status:** Ready.
- Create: `src/shared/schemas/story.schema.ts`
- Create: `tests/shared/story.schema.test.ts`
- Implementation: `StoryStateSchema` (currentArc, currentBeat, completedBeats, worldState, eagleBalance).

---

### Task 2: Expanded Mesh Schemas
**Files:** `src/shared/schemas/foundry-bridge.schema.ts`

**Additions:**
1. **Events (Foundry -> Node B):**
   - `buy_item`: `{ itemId, costEb, costEagles, vendor, actorId }`
   - `approval_response`: `{ proposalId, status, editedData? }`
2. **Commands (Node B -> Foundry):**
   - `update_actor`: `{ actorId, updates }`
   - `queue_approval`: `{ proposalId, type, data, schema? }` (Triggers a Foundry Dialog)

**Validation:** Ensure `FoundryEventSchema` and `MeshCommandSchema` discriminated unions are updated.

---

### Task 3: FoundryAdapter updateActor & Mesh Module
**Files:** 
- `src/api/foundry-adapter.ts`
- `foundry-module/foundry-api-bridge.js`

**Implementation:**
- Add `updateActor(actorId, updates)` to `FoundryAdapter`.
- Add `_handleUpdateActor` to `foundry-api-bridge.js` using `actor.update(payload.updates)`.
- **Hardening:** Add error handling to bridge JS to ensure `_sendError` is always called on catch.

---

### Task 4: GM Approval Queue Controller
**Files:** `src/core/gm-approval-queue.ts`

**Logic:**
- `enqueue(type, data)`: Generates `proposalId`, stores in `Map`.
- `resolve(proposalId, status, editedData)`: Updates state.
- **Wiring:** Should emit a command to Foundry via `FoundryAdapter` when enqueued.

---

### Task 5: Story Engine (Deterministic State Machine)
**Files:** `src/core/story-engine.ts`

**Implementation:**
```typescript
export interface BeatConfig {
  id: string;
  transitions: {
    to: string;
    condition: (state: StoryState, event: any) => boolean;
  }[];
}

export class StoryEngine {
  private beats: Map<string, BeatConfig> = new Map();
  constructor(private state: StoryState) {}

  registerBeat(config: BeatConfig) { this.beats.set(config.id, config); }
  
  evaluateEvent(event: any): { transitioned: boolean; newBeat?: string } {
    const current = this.beats.get(this.state.currentBeat);
    if (!current) return { transitioned: false };

    for (const t of current.transitions) {
      if (t.condition(this.state, event)) {
        this.state.currentBeat = t.to;
        this.state.completedBeats.push(current.id);
        return { transitioned: true, newBeat: t.to };
      }
    }
    return { transitioned: false };
  }
}
```

---

### Task 6: Night Market RAG Service
**Files:** `src/core/night-market-service.ts`

**Logic:**
- `getVendorInventory(vendorName)`: Queries `nitro-db` (via existing MCP or DB client) for items tagged with the vendor.
- **Pricing:** Implements the Eagle/Eurobuck conversion logic defined in the spec.

---

### Task 7: HRC MVP Assembly & TDD
**Files:** `src/core/hybrid-routing-controller.ts`

**TDD Requirements:**
1. **Test `buy_item` Flow:**
   - Mock `foundry.readActor` to return 1000eb.
   - Send `buy_item` (100eb).
   - Verify `foundry.updateActor` called with 900eb.
   - Verify `ollama.generateNarrative` called for transaction prose.
2. **Test Story Transition Flow:**
   - Mock `nitroLogic.oracleRoll` to return Critical Success.
   - Verify `storyEngine.evaluateEvent` is called with the result.
   - If `transitioned`, verify `foundry.sendChatMessage` pushes the new Beat's intro.

**Implementation:**
- Update `handleFoundryEvent` switch case.
- Wire `storyEngine` into `handleResolveAttack` and `handleStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleRoll`.
