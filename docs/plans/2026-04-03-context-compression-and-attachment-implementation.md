# Context Compression & Entity Attachment Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Foundry-side data parsing to compress LLM context windows and automate vehicle/passenger movement hierarchies.

**Architecture:** A new `ActionCompressionService` will parse actor data into a flat array before sending it to Node B. A `TokenAttachmentManager` will hook into Foundry's update cycle to sync child token movements to a parent vehicle.

**Tech Stack:** JavaScript (Foundry VTT Macros/Module).

---

### Task 1: Implement ActionCompressionService

**Files:**
- Create: `foundry-module/scripts/action-compression-service.js`

**Step 1: Implement parsing logic**

```javascript
export class ActionCompressionService {
  static getValidActions(actor) {
    if (!actor || !actor.system) return [];
    const actions = [];
    
    // Add equipped weapons
    const weapons = actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    weapons.forEach(w => {
      actions.push(`fire_${w.name.toLowerCase().replace(/\s+/g, '_')}`);
      if (w.system.magazine.value < w.system.magazine.max) actions.push(`reload_${w.name.toLowerCase().replace(/\s+/g, '_')}`);
    });

    // Add basic actions
    actions.push('brawl', 'evade', 'take_cover');
    return actions;
  }
}
```

**Step 2: Commit**

```bash
git add foundry-module/scripts/action-compression-service.js
git commit -m "feat(foundry): implement ActionCompressionService for LLM context reduction"
```

---

### Task 2: Implement TokenAttachmentManager

**Files:**
- Create: `foundry-module/scripts/token-attachment-manager.js`
- Modify: `foundry-module/foundry-api-bridge.js` (to initialize hooks)

**Step 1: Implement Hook Logic**

```javascript
export class TokenAttachmentManager {
  static init() {
    Hooks.on('preUpdateToken', this._onPreUpdateToken.bind(this));
  }

  static _onPreUpdateToken(tokenDoc, changes, options, userId) {
    if (!changes.x && !changes.y && !changes.rotation) return;
    
    const attachedIds = tokenDoc.getFlag('asp', 'attached') || [];
    if (attachedIds.length === 0) return;

    const deltaX = changes.x !== undefined ? changes.x - tokenDoc.x : 0;
    const deltaY = changes.y !== undefined ? changes.y - tokenDoc.y : 0;

    attachedIds.forEach(id => {
      const child = tokenDoc.parent.tokens.get(id);
      if (child) {
        const childUpdate = { _id: id };
        if (deltaX) childUpdate.x = child.x + deltaX;
        if (deltaY) childUpdate.y = child.y + deltaY;
        tokenDoc.parent.updateEmbeddedDocuments("Token", [childUpdate]);
      }
    });
  }
}
```

**Step 2: Commit**

```bash
git add foundry-module/scripts/token-attachment-manager.js
git commit -m "feat(foundry): implement TokenAttachmentManager for vehicle hierarchy sync"
```