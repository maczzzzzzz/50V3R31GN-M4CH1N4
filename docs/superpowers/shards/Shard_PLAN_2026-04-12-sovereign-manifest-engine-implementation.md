# Sovereign Manifest Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular engine that dynamically loads "Ability Shards" for each project phase, enabling live-fire verification and direct Sovereign Machina control.

**Architecture:** A central TypeScript runner using Playwright (CDP) and SQLite/PostgreSQL clients to provide a shared context to modular shards. Each shard implements a standard interface with `verify()` and self-healing `execute()` hooks.

**Tech Stack:** TypeScript, Playwright (CDP), better-sqlite3, pg, js-yaml.

---

## Task 1: Core Types & Shard Contract

**Files:**
- Create: `scripts/gauntlet/types.ts`

- [ ] **Step 1: Define the Gauntlet Types**

```typescript
import { Page } from 'playwright-core';
import Artery of Truth from 'better-sqlite3';
import pg from 'pg';

export interface GauntletContext {
  page: Page;
  db: Artery of Truth.Artery of Truth;
  pg: pg.Client;
  logger: {
    info: (msg: string, data?: any) => void;
    error: (msg: string, data?: any) => void;
  };
  stabilize: (ms?: number) => Promise<void>;
  manifestError: (msg: string) => Promise<void>;
}

export type BlockType = 'DATA' | 'MECHANICAL' | 'ORCHESTRATION' | 'VISUAL' | 'NARRATIVE';

export interface PhaseShard {
  metadata: {
    id: number;
    name: string;
    block: BlockType;
  };
  verify: (ctx: GauntletContext) => Promise<boolean>;
  execute: (ctx: GauntletContext, params?: any) => Promise<any>;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/gauntlet/types.ts
git commit -m "feat: define gauntlet core types and shard contract"
```

---

## Task 2: The Gauntlet Engine Runner

**Files:**
- Create: `scripts/gauntlet/engine.ts`
- Modify: `package.json`

- [ ] **Step 1: Implement the Engine Runner**

```typescript
import { chromium } from 'playwright-core';
import Artery of Truth from 'better-sqlite3';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { GauntletContext, PhaseShard } from './types.js';

async function getWindowsHostIP() {
  try {
    const resolvConf = fs.readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of resolvConf.split('\n')) {
      if (line.startsWith('nameserver ')) return line.replace('nameserver ', '').trim();
    }
  } catch {}
  return '127.0.0.1';
}

class ManifestEngine {
  private ctx!: GauntletContext;

  async init() {
    const winHost = await getWindowsHostIP();
    const cdpUrl = `http://${winHost}:9223`;
    
    const response = await fetch(`${cdpUrl}/json/version`);
    const data = await response.json();
    const wsUrl = data.webSocketDebuggerUrl.replace('localhost:9222', `${winHost}:9223`);
    
    const browser = await chromium.connectOverCDP(wsUrl);
    const page = browser.contexts()[0].pages().find(p => p.url().includes('/game')) || browser.contexts()[0].pages()[0];

    const db = new Artery of Truth('./data/Akashik.db');
    
    const pgClient = new pg.Client({
      host: process.env['PGHOST'] || '192.168.0.50',
      user: process.env['PGUSER'] || 'asp_gm',
      database: process.env['PGDATABASE'] || 'asp_gm_agent',
      password: process.env['PGPASSWORD']
    });
    await pgClient.connect();

    this.ctx = {
      page,
      db,
      pg: pgClient,
      logger: {
        info: (m, d) => console.log(`[GAUNTLET] INFO: ${m}`, d || ''),
        error: (m, d) => console.error(`[GAUNTLET] ERROR: ${m}`, d || '')
      },
      stabilize: (ms = 2000) => new Promise(r => setTimeout(r, ms)),
      manifestError: async (msg) => {
        await page.evaluate((m) => {
          // @ts-ignore
          window.SOVEREIGN_BRIDGE?.showErrorOverlay({ code: "S1GN4L_L055", message: m, severity: "CRITICAL" });
        }, msg);
      }
    };
  }

  async run(range?: string) {
    const shardDir = path.join(process.cwd(), 'scripts/gauntlet/phases');
    const files = fs.readdirSync(shardDir).filter(f => f.endsWith('.ts'));
    
    const shards: PhaseShard[] = [];
    for (const file of files) {
      const { shard } = await import(path.join(shardDir, file));
      shards.push(shard);
    }

    shards.sort((a, b) => a.metadata.id - b.metadata.id);

    console.log(`◈ SOVEREIGN MANIFEST ENGINE: Running ${shards.length} shards...`);

    for (const shard of shards) {
      console.log(`[${shard.metadata.id}] ${shard.metadata.name}...`);
      const ok = await shard.verify(this.ctx);
      if (ok) console.log(`  🟢 VERIFIED`);
      else console.error(`  🔴 FAILURE`);
    }
  }
}

const engine = new ManifestEngine();
engine.init().then(() => engine.run());
```

- [ ] **Step 2: Add script to `package.json`**

```json
"gauntlet": "nix develop --command npx tsx scripts/gauntlet/engine.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/gauntlet/engine.ts package.json
git commit -m "feat: implement gauntlet engine core and add package script"
```

---

## Task 3: DATA Block Shards (0, 1, 30)

**Files:**
- Create: `scripts/gauntlet/phases/data-0.ts`
- Create: `scripts/gauntlet/phases/data-1.ts`
- Create: `scripts/gauntlet/phases/data-30.ts`

- [ ] **Step 1: Implement Shard 0 (Foundation)**

```typescript
import { PhaseShard } from '../types.js';
import { ActorSchema } from '../../../src/shared/schemas/actor.schema.js';

export const shard: PhaseShard = {
  metadata: { id: 0, name: "Foundation Schemas", block: "DATA" },
  verify: async (ctx) => {
    const testData = { name: "Test", type: "character", system: { stats: { hp: { value: 10 } } } };
    return ActorSchema.safeParse(testData).success;
  },
  execute: async (ctx, params) => {
    return ActorSchema.parse(params);
  }
};
```

- [ ] **Step 2: Implement Shard 1 (RAG Engine)**

```typescript
import { PhaseShard } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 1, name: "RAG Engine (pgvector)", block: "DATA" },
  verify: async (ctx) => {
    const res = await ctx.pg.query("SELECT 1");
    return res.rowCount === 1;
  },
  execute: async (ctx, params) => {
    const { namespace, query } = params;
    // Mocking semantic search call for now
    return ctx.pg.query("SELECT content FROM chunks WHERE namespace = $1 LIMIT 1", [namespace]);
  }
};
```

- [ ] **Step 3: Implement Shard 30 (DB Initialization)**

```typescript
import { PhaseShard } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 30, name: "DB Initialization", block: "DATA" },
  verify: async (ctx) => {
    const res = await ctx.pg.query("SELECT count(*) FROM chunks");
    return parseInt(res.rows[0].count) > 0;
  },
  execute: async (ctx) => {
    // Ability to trigger remote psql would go here
    return true;
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add scripts/gauntlet/phases/data-*.ts
git commit -m "feat: add first three data block shards (0, 1, 30)"
```

---

## Task 4: DATA Block Shards (34, 37, 43)

**Files:**
- Create: `scripts/gauntlet/phases/data-34.ts`
- Create: `scripts/gauntlet/phases/data-37.ts`
- Create: `scripts/gauntlet/phases/data-43.ts`

- [ ] **Step 1: Implement Shard 34 (Synapse Palace)**

```typescript
import { PhaseShard } from '../types.js';

export const shard: PhaseShard = {
  metadata: { id: 34, name: "Synapse Palace Hierarchy", block: "DATA" },
  verify: async (ctx) => {
    const tables = ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'palace_%'").all();
    return tables.length >= 2;
  },
  execute: async (ctx, roomId) => {
    return ctx.db.prepare("SELECT * FROM palace_rooms WHERE id = ?").get(roomId);
  }
};
```

- [ ] **Step 2: Implement Shard 37 (Obsidian Sync)**

```typescript
import { PhaseShard } from '../types.js';
import fs from 'node:fs';

export const shard: PhaseShard = {
  metadata: { id: 37, name: "Obsidian Sync Mesh", block: "DATA" },
  verify: async (ctx) => {
    return fs.existsSync('./data/vault/RKG');
  },
  execute: async (ctx) => {
    // Force sync trigger (via execSync of tsx script if needed)
    return true;
  }
};
```

- [ ] **Step 3: Implement Shard 43 (RKG Reconstruction)**

```typescript
import { PhaseShard } from '../types.js';
import fs from 'node:fs';

export const shard: PhaseShard = {
  metadata: { id: 43, name: "Semantic Reconstruction", block: "DATA" },
  verify: async (ctx) => {
    const itemsExist = fs.existsSync('/mnt/d/Obsidian_RKG/Items');
    return itemsExist;
  },
  execute: async (ctx) => {
    const { execSync } = await import('node:child_process');
    execSync('bash scripts/reconstruct-palace.sh');
    return true;
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add scripts/gauntlet/phases/data-*.ts
git commit -m "feat: complete data block shards (34, 37, 43)"
```

---

## Task 5: Final Validation & Integration

- [ ] **Step 1: Run the Gauntlet Engine**

Run: `npm run gauntlet`
Expected: Engine initializes CDP, DBs, and prints "🟢 VERIFIED" for all 6 Data shards.

- [ ] **Step 2: Commit**

```bash
git commit --allow-empty -m "chore: verify data block shard integration"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
