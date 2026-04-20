# Pretext Dynamic Status Overlays Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a reactive, zero-reflow overlay system for dynamic health status and drug effects using Pretext and the Mistral-Nemo LLM pipeline.

**Architecture:** The Foundry client triggers updates that are routed to Node B (`hybrid-routing-controller.ts`). Node B checks thresholds (HP ≤ 1, Net Damage ≥ 15, or Drug item consumed) and uses Mistral-Nemo to generate a JSON payload with lore text and FX parameters. This payload is dispatched back to the Foundry client, which creates a detached `<canvas>` via Pretext to render text and uses PIXI/FXMaster to apply shaders without DOM reflows.

**Tech Stack:** TypeScript, Pretext (Layout Engine), Mistral-Nemo (Node B LLM), Foundry VTT (PIXI.js / FXMaster).

---

### Task 1: Update HybridRoutingController Payload Interface

**Files:**
- Modify: `src/shared/schemas/foundry-bridge.schema.ts`
- Modify: `src/core/interfaces.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
import { PretextOverlayPayloadSchema } from '../../src/shared/schemas/foundry-bridge.schema';

describe('PretextOverlayPayloadSchema', () => {
  it('validates a correct pretext overlay payload', () => {
    const validPayload = {
      type: 'pretext_overlay',
      payload: {
        targetId: 'actor_123',
        overlayType: 'critical_damage',
        text: 'CRITICAL WARNING',
        color: '#ff0000',
        duration: 3000,
        fxParams: {
          shader: 'chromatic_aberration',
          intensity: 2.5,
          rgbSplit: 0.8
        }
      }
    };
    expect(() => PretextOverlayPayloadSchema.parse(validPayload)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL (PretextOverlayPayloadSchema is not defined)

**Step 3: Write minimal implementation**

```typescript
// src/shared/schemas/foundry-bridge.schema.ts (Add to existing file)
import { z } from 'zod';

export const PretextOverlayPayloadSchema = z.object({
  type: z.literal('pretext_overlay'),
  payload: z.object({
    targetId: z.string(),
    overlayType: z.enum(['critical_damage', 'drug_ingestion']),
    text: z.string(),
    color: z.string(),
    duration: z.number(),
    fxParams: z.object({
      shader: z.string(),
      intensity: z.number(),
      rgbSplit: z.number().optional()
    }).optional()
  })
});

// Add to any exported union if necessary, e.g., MeshMessageSchema
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/shared/schemas/foundry-bridge.schema.ts tests/core/hybrid-routing-controller.test.ts
git commit -m "feat(bridge): define PretextOverlay payload schema"
```

---

### Task 2: Implement Damage Threshold Logic in HybridRoutingController

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Test: `tests/core/hybrid-routing-controller.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
describe('HybridRoutingController - Damage Thresholds', () => {
  it('triggers a pretext overlay for netDamage >= 15', async () => {
    // Mock dependencies: unifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle, foundryAdapter, nitroLogic, etc.
    const hrc = new HybridRoutingController(/* mocks */);
    const result = await hrc['handleResolveAttack']({ /* mock payload */ });
    
    // Assert that the bridge was called with a pretext_overlay payload
    expect(mockFoundryAdapter.sendPayload).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'pretext_overlay' })
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL (No payload sent to bridge)

**Step 3: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts (Update handleResolveAttack)
// Inside handleResolveAttack, after calculating newHp:

if (payload.targetId && result.hit && result.netDamage > 0) {
  // Existing HP update logic...
  
  if (result.netDamage >= 15 || newHp <= 1) {
    const overlayType = newHp <= 1 ? 'death_state' : 'critical_damage';
    // Mock LLM Call for now, to be expanded in Task 3
    const overlayPayload = {
      type: 'pretext_overlay',
      payload: {
        targetId: payload.targetId,
        overlayType,
        text: `CRITICAL TRAUMA: ${result.netDamage} DAMAGE`,
        color: '#ff003c',
        duration: 3000,
        fxParams: { shader: 'chromatic_aberration', intensity: 2.5 }
      }
    };
    await this.foundry.sendPayload(overlayPayload);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts tests/core/hybrid-routing-controller.test.ts
git commit -m "feat(core): trigger pretext overlays on critical damage thresholds"
```

---

### Task 3: Implement LLM Generation for Overlay Flavor Text

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
describe('Overlay Generation via Mistral-Nemo', () => {
  it('generates flavor text using the story engine', async () => {
    // Assert that storyEngine.generateFlavorText is called with correct context
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts
// Replace the mock payload in Task 2 with a call to the LLM (StoryEngine / Mistral-Nemo)

const promptContext = `Target sustained ${result.netDamage} damage. Current HP: ${newHp}.`;
const generatedOverlay = await this.storyEngine.generateOverlayParams(promptContext); // Assume this method exists or is created in StoryEngine

const overlayPayload = {
  type: 'pretext_overlay',
  payload: {
    targetId: payload.targetId,
    overlayType: newHp <= 1 ? 'death_state' : 'critical_damage',
    text: generatedOverlay.text,
    color: generatedOverlay.color || '#ff003c',
    duration: generatedOverlay.duration || 3000,
    fxParams: generatedOverlay.fxParams
  }
};
await this.foundry.sendPayload(overlayPayload);
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts
git commit -m "feat(core): integrate LLM generation for pretext overlay text and FX"
```

---

### Task 4: Foundry Module Pretext Canvas Layer Setup

**Files:**
- Create: `foundry-module/scripts/pretext-overlay-manager.js`
- Modify: `foundry-module/foundry-api-bridge.js`

**Step 1: Implement PretextOverlayManager Stub**

```javascript
// foundry-module/scripts/pretext-overlay-manager.js
export class PretextOverlayManager {
  static init() {
    console.log("PretextOverlayManager Initialized");
  }

  static drawOverlay(payload) {
    console.log("Drawing Overlay for", payload.targetId, payload.text);
    // Implementation for detached canvas and Pretext layout goes here.
    // Ensure 0 DOM reflows.
  }
}
```

**Step 2: Wire up Foundry API Mesh**

```javascript
// foundry-module/foundry-api-bridge.js
import { PretextOverlayManager } from './scripts/pretext-overlay-manager.js';

// Inside the WebSocket message handler:
if (message.type === 'pretext_overlay') {
  PretextOverlayManager.drawOverlay(message.payload);
}
```

**Step 3: Commit**

```bash
git add foundry-module/scripts/pretext-overlay-manager.js foundry-module/foundry-api-bridge.js
git commit -m "feat(foundry): scaffold PretextOverlayManager and bridge integration"
```

---

### Task 5: Implement Pretext Rendering & FXMaster Hooks

**Files:**
- Modify: `foundry-module/scripts/pretext-overlay-manager.js`

**Step 1: Implement Rendering Logic**

```javascript
// foundry-module/scripts/pretext-overlay-manager.js
export class PretextOverlayManager {
  static drawOverlay(payload) {
    const token = canvas.tokens.get(payload.targetId);
    if (!token) return;

    // Create a detached canvas if one doesn't exist (conceptual PIXI integration)
    // Use Pretext (assuming it's available globally or imported) to calculate text layout
    
    // Pseudo-code for PIXI/Pretext integration:
    const overlaySprite = new PIXI.Sprite(/* Pretext generated texture */);
    overlaySprite.position.set(token.x, token.y - 50);
    canvas.effects.addChild(overlaySprite);

    if (payload.fxParams && window.FXMASTER) {
      // Apply FXMaster shader to the overlay sprite or a specific canvas layer
      FXMASTER.filters.addFilter('pretext_layer', payload.fxParams.shader, payload.fxParams);
    }

    setTimeout(() => {
      canvas.effects.removeChild(overlaySprite);
      if (payload.fxParams && window.FXMASTER) {
        FXMASTER.filters.removeFilter('pretext_layer', payload.fxParams.shader);
      }
    }, payload.duration);
  }
}
```

**Step 2: Commit**

```bash
git add foundry-module/scripts/pretext-overlay-manager.js
git commit -m "feat(foundry): implement PIXI rendering and FXMaster shader application for Pretext overlays"
```