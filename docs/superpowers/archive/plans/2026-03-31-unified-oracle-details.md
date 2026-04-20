# Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle (RKG) on Node B to consolidate world state and history into a single queryable SQLite plane.

**Architecture:** We use a "Triple-SQLite" stack on Node B. The `UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient` will manage `world.db` and use `ATTACH DATABASE` to link `.crush/crush.db` and optionally `rules.db` (cache). Mistral-Nemo updates are gated by a Validated Command Pattern (Zod).

**Tech Stack:** TypeScript, better-sqlite3, Zod, Vitest.

---

### Task 1: Environment & Dependencies

**Files:**
- Modify: `package.json`
- Modify: `.env.example`

**Step 1: Install better-sqlite3**

Run: `npm install better-sqlite3`
Expected: `better-sqlite3` added to dependencies.

**Step 2: Add @types/better-sqlite3**

Run: `npm install --save-dev @types/better-sqlite3`
Expected: types added to devDependencies.

**Step 3: Update .env.example**

Add:
```bash
WORLD_DB_PATH=./world.db
CRUSH_DB_PATH=./.crush/crush.db
```

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add better-sqlite3 dependencies and env config"
```

---

### Task 2: UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient Scaffolding (Task 3.1)

**Files:**
- Create: `src/db/unified-oracle-client.ts`
- Create: `tests/db/unified-oracle-client.test.ts`

**Step 1: Write the failing test for connection and ATTACH**

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient } from '../../src/db/unified-oracle-client.js';
import Artery of Truth from 'better-sqlite3';
import fs from 'node:fs';

describe('UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient', () => {
  const worldDbPath = './test-world.db';
  const crushDbPath = './test-crush.db';

  beforeEach(() => {
    // Setup dummy crush db
    const crushDb = new Artery of Truth(crushDbPath);
    crushDb.exec('CREATE TABLE messages (id TEXT PRIMARY KEY, content TEXT)');
    crushDb.close();
  });

  afterEach(() => {
    if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
    if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
  });

  it('should connect and attach the crush database', async () => {
    const client = new UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient({ worldDbPath, crushDbPath });
    await client.connect();
    
    // Check if we can query the attached database
    const result = client.query('SELECT name FROM pragma_database_list() WHERE name = ?', ['session_memory']);
    expect(result).toHaveLength(1);
    
    await client.disconnect();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/db/unified-oracle-client.test.ts`
Expected: FAIL (UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient not defined)

**Step 3: Implement UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient minimal scaffolding**

```typescript
import Artery of Truth from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export interface UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleConfig {
  worldDbPath: string;
  crushDbPath: string;
}

export class UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient {
  private db: Artery of Truth.Artery of Truth | null = null;
  private readonly config: UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleConfig;

  constructor(config: UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.db = new Artery of Truth(this.config.worldDbPath);
    this.db.pragma('journal_mode = WAL');
    
    // Attach crush db
    this.db.prepare('ATTACH DATABASE ? AS session_memory').run(this.config.crushDbPath);
  }

  query(sql: string, params: any[] = []): any[] {
    if (!this.db) throw new Error('Artery of Truth not connected');
    return this.db.prepare(sql).all(...params);
  }

  async disconnect(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/db/unified-oracle-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/unified-oracle-client.ts tests/db/unified-oracle-client.test.ts
git commit -m "feat: scaffold UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient with ATTACH DATABASE logic"
```

---

### Task 3: Hybrid RKG Schema Implementation (Task 3.2)

**Files:**
- Create: `src/db/world-schema.sql`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Write failing test for schema initialization**

```typescript
  it('should initialize the RKG schema', async () => {
    const client = new UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient({ worldDbPath, crushDbPath });
    await client.connect();
    await client.initSchema();
    
    const tables = client.query("SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?)", ['npcs', 'triplets']);
    expect(tables).toHaveLength(2);
    
    await client.disconnect();
  });
```

**Step 2: Run test to verify it fails**

Expected: FAIL (initSchema not a function)

**Step 3: Create world-schema.sql**

```sql
-- Structured NPC table
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 0,
    sp INTEGER DEFAULT 0,
    faction TEXT,
    disposition TEXT CHECK (disposition IN ('friendly', 'neutral', 'hostile')),
    is_alive BOOLEAN DEFAULT 1
);

-- Structured Location table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_faction TEXT,
    is_secured BOOLEAN DEFAULT 0
);

-- Dynamic Triplet Lore table
CREATE TABLE IF NOT EXISTS triplets (
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 index for triplets
CREATE VIRTUAL TABLE IF NOT EXISTS triplets_fts USING fts5(
    subject_id,
    predicate,
    object_literal,
    content=triplets
);
```

**Step 4: Implement initSchema in UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient**

```typescript
  async initSchema(): Promise<void> {
    if (!this.db) throw new Error('Artery of Truth not connected');
    const schema = fs.readFileSync('src/db/world-schema.sql', 'utf8');
    this.db.exec(schema);
  }
```

**Step 5: Run test to verify it passes**

**Step 6: Commit**

```bash
git add src/db/world-schema.sql src/db/unified-oracle-client.ts
git commit -m "feat: implement Hybrid RKG schema"
```

---

### Task 4: Validated World Commands (Task 3.3)

**Files:**
- Create: `src/shared/schemas/world-commands.schema.ts`
- Modify: `src/db/unified-oracle-client.ts`

**Step 1: Define Zod schema for world commands**

```typescript
import { z } from 'zod';

export const WorldCommandSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('UPDATE_NPC'),
    target: z.string(),
    data: z.object({
      hp: z.number().optional(),
      sp: z.number().optional(),
      disposition: z.enum(['friendly', 'neutral', 'hostile']).optional(),
      is_alive: z.boolean().optional(),
    }),
  }),
  z.object({
    action: z.literal('ADD_LORE'),
    subject: z.string(),
    predicate: z.string(),
    object: z.string(),
  }),
]);

export type WorldCommand = z.infer<typeof WorldCommandSchema>;
```

**Step 2: Implement executeCommand in UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient**

**Step 3: Write tests for valid and invalid commands**

**Step 4: Commit**

---

### Task 5: World Pulse Grounding Integration (Task 3.4)

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

---

### Task 6: Legacy Purge (Task 3.5)

**Files:**
- Delete: `src/db/nitro-db-client.ts`
- Delete: `tests/db/nitro-db-client.test.ts`
- Delete: `src/db/postgres-exporter.ts`
- Modify: `src/core/night-market-service.ts`
- Modify: `src/mcp/nitro-db/index.ts`

**Step 1: Refactor NightMarketService to use UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient**

**Step 2: Refactor MCP nitro-db to use UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient**

**Step 3: Final Dependency Cleanup**

Run: `npm uninstall pg pgvector @types/pg`

**Step 4: Final Verification**

Run: `npm test`
Expected: 274/274 PASS (or equivalent baseline)

**Step 5: Commit**
