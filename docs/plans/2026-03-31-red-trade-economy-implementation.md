# Red Trade Economy Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Phase 5.1 Red Trade Economy, including the Faction Matrix, Cargo Manifest Generator, and the Friction Engine.

**Architecture:** We expand the `world.db` schema to include faction standings and implement a new `RedTradeService` on Node B to orchestrate the immersion loop. Mechanical rolls are delegated to Node A via ClawLink.

**Tech Stack:** TypeScript, SQLite, Zod, ClawLink (SSH2), Vitest.

---

### Task 1: RKG Schema Migration (Faction Matrix)

**Files:**
- Modify: `src/db/world-schema.sql`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Write failing test for faction tables**

```typescript
it('should support faction relationship tracking', async () => {
  const result = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name = 'factions'");
  expect(result).toHaveLength(1);
});
```

**Step 2: Update world-schema.sql**

Add:
```sql
CREATE TABLE IF NOT EXISTS factions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    relationship_score INTEGER DEFAULT 0 CHECK (relationship_score BETWEEN -10 AND 10),
    friction_pool INTEGER DEFAULT 0 CHECK (friction_pool BETWEEN 0 AND 10)
);

CREATE TABLE IF NOT EXISTS player_friends_enemies (
    entity_id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('friend', 'enemy')),
    FOREIGN KEY(entity_id) REFERENCES npcs(id)
);
```

**Step 3: Run schema init and verify tests pass**

**Step 4: Commit**

---

### Task 2: Cargo Manifest Generator

**Files:**
- Create: `src/core/red-trade-service.ts`
- Create: `tests/core/red-trade-service.test.ts`

**Step 1: Write test for cargo generation from TTTA data**

**Step 2: Implement RedTradeService.generateCargo()**
- Use `fs` to read `docs/raw_data/campaign_ttta/Items/`
- Filter for specific lore-accurate types (Badges, Nanites, etc.)
- Return a Zod-validated `RedTradeCargo` object.

**Step 3: Commit**

---

### Task 3: Friction Engine & Heat Clock

**Files:**
- Modify: `src/core/red-trade-service.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement rollFriction() logic**
- Roll 1d10 + current faction friction.
- Return Outcome (Bark, Gate, or Ambush).

**Step 2: Wire into HRC transit events**

**Step 3: Commit**

---

### Task 4: StoryEngine "One-Shot" Integration

**Files:**
- Modify: `src/core/campaign-registry.ts`
- Modify: `src/core/story-engine.ts`

**Step 1: Register RedTradeBeat template**

**Step 2: Implement dynamic sub-beat transitions (Fixer -> Transit -> Handoff)**

**Step 3: Commit**

---

### Task 5: Capture & Cryotank Skip (The Consequence)

**Files:**
- Create: `src/core/pulse-engine.ts`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Implement timeSkip(months) logic**
- Calculate rent debt in `world.db`.
- Trigger `EVICTION` event if balance < debt.

**Step 2: Implement Node A "Punitive BD" roll bridge**

**Step 3: Commit**
