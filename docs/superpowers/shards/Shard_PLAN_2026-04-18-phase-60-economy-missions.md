# Phase 60: Sovereign Economy & Mission Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native Night Market and Gig generation engine in Node B that subsumes community macros by leveraging the Canonical Mirror database and Foundry's built-in vendor logic.

**Architecture:** Node B TypeScript services (`SovereignEconomyService`, `SovereignGigService`) that query `Akashik.db` to procedurally generate content, and use the CDP bridge to inject native `cpr-container` vendor tokens and Journal entries into Foundry VTT.

**Tech Stack:** TypeScript, SQLite, Playwright (CDP), Foundry VTT API.

---

### Task 1: Economy Artery of Truth Schema

**Files:**
- Modify: `src/db/world-schema.sql`
- Modify: `src/types/world.ts`

- [x] **Step 1: Add Economy & Gig Tables to Schema**

```sql
CREATE TABLE IF NOT EXISTS night_markets (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL,
  vendor_npc_id TEXT NOT NULL,
  inventory_json TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS gigs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_npc_id TEXT,
  target_npc_id TEXT,
  district_id TEXT,
  reward_eb INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available'
);
```

- [x] **Step 2: Update TypeScript Interfaces**

```typescript
export interface NightMarket {
  id: string;
  district_id: string;
  vendor_npc_id: string;
  inventory_json: string; // Array of item IDs + quantities
  status: 'active' | 'cleared';
}

export interface Gig {
  id: string;
  title: string;
  client_npc_id?: string;
  target_npc_id?: string;
  district_id?: string;
  reward_eb: number;
  status: 'available' | 'in_progress' | 'completed';
}
```

- [x] **Step 3: Commit**

```bash
git add src/db/world-schema.sql src/types/world.ts
git commit -m "db: add economy and gig schemas for phase 60"
```

---

### Task 2: Sovereign Economy Service (Deep Systems)

**Files:**
- Create: `src/core/economy/SovereignEconomyService.ts`
- Create: `src/core/economy/EconomyPulse.ts`

- [x] **Step 1: Implement the Night Market Generator**
Implement weighted rolling for 1d10 categories and 1d100 items. Auto-tag `Premium`+ categories as **Contraband** (Fixer-only).

- [x] **Step 2: Implement the Economy Pulse**
Create a service that tracks in-game time and automatically calculates the **Monthly Burn** for Lifestyle and Housing rent.

- [x] **Step 3: Implement Addiction Resolution**
Integrate Node A Rust logic for "Addiction Checks" and manifest the result as persistent wellbeing triplets in Akashik.db.

- [x] **Step 4: Commit**

```bash
git add src/core/economy/
git commit -m "feat(economy): implement night markets, monthly burn, and addiction logic"
```

---

### Task 3: Foundry Vendor Injection (CDP Mesh)

**Files:**
- Modify: `src/api/foundry-adapter.ts`

- [x] **Step 1: Implement Vendor Spawning Logic**

```typescript
  async spawnVendorToken(marketId: string, sceneId: string, x: number, y: number): Promise<void> {
    // 1. Fetch market inventory from DB
    // 2. Execute Foundry JS via CDP to create a 'container' actor
    // 3. Set actor.system.vendor to true and configure purchasePercentage
    // 4. Populate container with items
    // 5. Spawn token on canvas
    
    const script = `
      const containerData = {
        name: "Night Market Vendor",
        type: "container",
        system: {
          vendor: { isVendor: true, itemTypes: { weapon: { purchasePercentage: 100 } } }
        }
      };
      const actor = await Actor.create(containerData);
      // Item injection logic...
    `;
    
    await this.executeScript(script);
  }
```

- [x] **Step 2: Commit**

```bash
git add src/api/foundry-adapter.ts
git commit -m "feat(foundry): add cdp hook to spawn official vendor containers"
```

---

### Task 4: Sovereign Gig Service (Screamsheets)

**Files:**
- Create: `src/core/narrative/SovereignGigService.ts`

- [x] **Step 1: Implement Procedural Gig Generator**

```typescript
import { Artery of Truth } from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export class SovereignGigService {
  constructor(private db: Artery of Truth) {}

  generateGig(difficulty: 'low' | 'medium' | 'high') {
    // 1. Query Triplets for opposing factions in the current district
    // 2. Select a target NPC from Akashik.db
    // 3. Calculate reward based on difficulty and target REZ/Interface level
    // 4. Save to `gigs` table
    
    const gigId = randomUUID();
    // Implementation here...
    
    return gigId;
  }
}
```

- [x] **Step 2: Commit**

```bash
git add src/core/narrative/SovereignGigService.ts
git commit -m "feat(narrative): implement procedural gig and screamsheet generator"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
