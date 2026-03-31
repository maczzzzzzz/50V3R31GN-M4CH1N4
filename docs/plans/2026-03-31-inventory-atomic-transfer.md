# Inventory Atomic Transfer Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a unified `inventory` table and atomic transfer logic to eliminate "Ghost Gear" and item duplication in the Red Trade economy.

**Architecture:** We use a centralized `inventory` table in `world.db` where item ownership is a single column. This allows for atomic `UPDATE` operations within a SQLite transaction, ensuring that an item cannot exist in two places at once.

**Tech Stack:** TypeScript, better-sqlite3, Zod, Vitest.

---

### Task 1: RKG Schema Update (Inventory Table)

**Files:**
- Modify: `src/db/world-schema.sql`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Write failing test for inventory table existence**

```typescript
it('should support unified inventory tracking', async () => {
  const result = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name = 'inventory'");
  expect(result).toHaveLength(1);
});
```

**Step 2: Update world-schema.sql**

Add:
```sql
CREATE TABLE IF NOT EXISTS inventory (
    item_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT,
    is_equipped INTEGER DEFAULT 0 CHECK (is_equipped IN (0, 1)),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Step 3: Run schema init and verify tests pass**

**Step 4: Commit**

---

### Task 2: Atomic Transfer Logic

**Files:**
- Modify: `src/db/unified-oracle-client.ts`
- Test: `tests/db/unified-oracle-client.test.ts`

**Step 1: Implement transferItem() method**

```typescript
  transferItem(itemId: string, fromId: string, toId: string): void {
    if (!this.db) throw new Error('Database not connected');

    const transaction = this.db.transaction(() => {
      // 1. Verify existence and current ownership
      const item = this.db!.prepare('SELECT owner_id FROM inventory WHERE item_id = ?').get(itemId) as { owner_id: string } | undefined;
      
      if (!item) throw new Error(`Item ${itemId} not found in inventory.`);
      if (item.owner_id !== fromId) throw new Error(`Ownership mismatch: ${itemId} belongs to ${item.owner_id}, not ${fromId}.`);

      // 2. Perform atomic transfer
      this.db!.prepare('UPDATE inventory SET owner_id = ?, is_equipped = 0 WHERE item_id = ?')
        .run(toId, itemId);
    });

    transaction();
  }
```

**Step 2: Write tests for successful and failed transfers**
- Success: Mook A -> Player.
- Failure: Mook B -> Player (when Mook A actually owns it).
- Failure: Non-existent item.

**Step 3: Commit**

---

### Task 3: Validated TRANSFER_ITEM Command

**Files:**
- Modify: `src/shared/schemas/world-commands.schema.ts`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Update WorldCommandSchema**

Add `TRANSFER_ITEM` to the discriminated union:
```typescript
  z.object({
    action: z.literal('TRANSFER_ITEM'),
    itemId: z.string(),
    fromId: z.string(),
    toId: z.string(),
  }),
```

**Step 2: Wire into executeCommand()**

**Step 3: Commit**

---

### Task 4: HybridRoutingController Integration (Looting)

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Update handleFoundryEvent to support looting narrative**
- When a looting event occurs, trigger the `TRANSFER_ITEM` logic.
- Ensure the Narrative Engine (Mistral-Nemo) is grounded in the new ownership state before describing the loot.

**Step 2: Commit**
