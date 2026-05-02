# Phase 0: Foundation & Core Scaffolding — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a strictly typed ES2022 ESM TypeScript project with Zod schemas covering all Foundry VTT document types, PDF chunk contract, and Node A response validation — with Vitest tests proving schemas parse real seed data.

**Architecture:** Manual constructor-based DI. All schemas in `src/shared/schemas/`, all types inferred from Zod via `z.infer<>` in `src/shared/types/`. Empty barrel exports for `api/`, `core/`, `db/`, `mcp/` to establish the source tree. Tests read real JSON files from `docs/raw_data/`.

**Tech Stack:** Node.js 24, TypeScript ~5.8 (strict, ES2022, Node16), Zod ^3.24, Vitest ^3.x, tsx ^4.x, @modelcontextprotocol/sdk

**Spec:** `docs/superpowers/specs/2026-03-28-phase0-foundation-design.md`

---

## File Map

### Configuration (Task 1)
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

### Source Tree Scaffolding (Task 2)
- Create: `src/api/index.ts`
- Create: `src/core/index.ts`
- Create: `src/db/index.ts`
- Create: `src/mcp/index.ts`
- Create: `src/shared/index.ts`
- Create: `src/shared/schemas/index.ts`
- Create: `src/shared/types/index.ts`

### Schemas (Tasks 3-9)
- Create: `src/shared/schemas/common.schema.ts`
- Create: `src/shared/schemas/actor.schema.ts`
- Create: `src/shared/schemas/item.schema.ts`
- Create: `src/shared/schemas/scene.schema.ts`
- Create: `src/shared/schemas/journal.schema.ts`
- Create: `src/shared/schemas/roll-table.schema.ts`
- Create: `src/shared/schemas/pdf-chunk.schema.ts`
- Create: `src/shared/schemas/node-a.schema.ts`

### Types (Task 10)
- Create: `src/shared/types/foundry.types.ts`

### Tests (Tasks 3-9, interleaved with schemas via TDD)
- Create: `tests/shared/actor.schema.test.ts`
- Create: `tests/shared/item.schema.test.ts`
- Create: `tests/shared/scene.schema.test.ts`
- Create: `tests/shared/journal.schema.test.ts`
- Create: `tests/shared/roll-table.schema.test.ts`
- Create: `tests/shared/pdf-chunk.schema.test.ts`

### Barrel Exports (Task 10)
- Modify: `src/shared/schemas/index.ts`
- Modify: `src/shared/types/index.ts`
- Modify: `src/shared/index.ts`

---

## Task 1: Project Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "50v3r31gn-m4ch1n4",
  "version": "0.1.0",
  "description": "AI-powered GM assistant for Cyberpunk RED on Foundry VTT v12",
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "~5.8.0",
    "vitest": "^3.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.24.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated, zero errors.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No output (no source files yet, but config is valid). If errors about missing files, that is expected — will resolve in Task 2.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts
git commit -m "chore: initialize ES2022 ESM project with TypeScript, Zod, Vitest"
```

---

## Task 2: Source Tree Scaffolding

**Files:**
- Create: `src/api/index.ts`
- Create: `src/core/index.ts`
- Create: `src/db/index.ts`
- Create: `src/mcp/index.ts`
- Create: `src/shared/index.ts`
- Create: `src/shared/schemas/index.ts`
- Create: `src/shared/types/index.ts`

- [ ] **Step 1: Create all barrel files**

Each barrel is an empty placeholder. All have the same content:

`src/api/index.ts`:
```typescript
// Phase 3: Express/Fastify routes interfacing with Foundry VTT
export {};
```

`src/core/index.ts`:
```typescript
// Phase 1+: Business logic, state management, hybrid routing
export {};
```

`src/db/index.ts`:
```typescript
// Phase 1: Prisma/pg vector database schemas and seed scripts
export {};
```

`src/mcp/index.ts`:
```typescript
// Phase 2: MCP server implementations (nitro-logic, nitro-db)
export {};
```

`src/shared/index.ts`:
```typescript
export * from './schemas/index.js';
export * from './types/index.js';
```

`src/shared/schemas/index.ts`:
```typescript
// Populated as schemas are added in Tasks 3-9
export {};
```

`src/shared/types/index.ts`:
```typescript
// Populated in Task 10
export {};
```

- [ ] **Step 2: Verify TypeScript compiles the source tree**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Verify Vitest runs with no tests**

Run: `npx vitest run`
Expected: "No test files found" or similar — confirms Vitest is wired up.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "chore: scaffold source tree with barrel exports for all modules"
```

---

## Task 3: Common Schema + Actor Schema (TDD)

**Files:**
- Create: `src/shared/schemas/common.schema.ts`
- Create: `src/shared/schemas/actor.schema.ts`
- Create: `tests/shared/actor.schema.test.ts`

- [ ] **Step 1: Write the failing Actor test**

`tests/shared/actor.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ActorSchema } from '../../src/shared/schemas/actor.schema.js';

describe('ActorSchema', () => {
  it('parses a real edgerunner NPC actor', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- edgerunner npcs -/fvtt-Actor-ariandel,-fleet-footed-AnbbyHGpme70qLSA.json',
        'utf-8',
      ),
    );
    const result = ActorSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real cover object actor', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- cover -/Thick/fvtt-Actor-thick-bulletproof-glass-fpv7RjrofwVCLlk5.json',
        'utf-8',
      ),
    );
    const result = ActorSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('rejects an object missing required stats', () => {
    const invalid = { name: 'Bad Actor', type: 'character' };
    const result = ActorSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/actor.schema.test.ts`
Expected: FAIL — module `actor.schema.js` does not exist.

- [ ] **Step 3: Write `common.schema.ts`**

`src/shared/schemas/common.schema.ts`:
```typescript
import { z } from 'zod';

export const FoundryStatsSchema = z.object({
  coreVersion: z.string(),
  systemId: z.string(),
  systemVersion: z.string(),
  createdTime: z.number().nullable().optional(),
  modifiedTime: z.number().nullable().optional(),
  lastModifiedBy: z.string().nullable().optional(),
  compendiumSource: z.unknown().optional(),
  duplicateSource: z.unknown().optional(),
});

export const FoundrySourceSchema = z.object({
  book: z.string(),
  page: z.number(),
});

export const FoundryFlagsSchema = z.record(z.string(), z.unknown());

export const FoundryOwnershipSchema = z.record(z.string(), z.number());

export const FoundryBaseDocumentSchema = z.object({
  name: z.string(),
  folder: z.string().nullable().optional(),
  flags: FoundryFlagsSchema.optional(),
  _stats: FoundryStatsSchema.optional(),
  _id: z.string().optional(),
});
```

- [ ] **Step 4: Write `actor.schema.ts`**

`src/shared/schemas/actor.schema.ts`:
```typescript
import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundryFlagsSchema } from './common.schema.js';

const StatValueSchema = z.object({
  value: z.number(),
});

const StatWithMaxSchema = z.object({
  value: z.number(),
  max: z.number(),
});

const TransactionSchema = z.record(z.string(), z.unknown());

const ActorStatsSchema = z.object({
  int: StatValueSchema,
  ref: StatValueSchema,
  dex: StatValueSchema,
  tech: StatValueSchema,
  cool: StatValueSchema,
  will: StatValueSchema,
  luck: StatWithMaxSchema,
  move: StatValueSchema,
  body: StatValueSchema,
  emp: StatWithMaxSchema,
});

const WoundState = z.enum([
  'notWounded',
  'lightlyWounded',
  'seriouslyWounded',
  'mortallyWounded',
  'dead',
]);

const DerivedStatsSchema = z.object({
  hp: z.object({
    value: z.number(),
    max: z.number(),
    transactions: z.array(TransactionSchema).optional(),
  }),
  humanity: z.object({
    value: z.number(),
    max: z.number(),
    transactions: z.array(TransactionSchema).optional(),
  }),
  deathSave: z.object({
    value: z.number(),
    penalty: z.number(),
    basePenalty: z.number(),
  }),
  currentWoundState: WoundState,
  seriouslyWounded: z.number(),
  walk: StatValueSchema,
  run: StatValueSchema,
});

const ActorRoleInfoSchema = z.object({
  activeRole: z.string(),
  activeNetRole: z.string(),
}).passthrough();

const ActorInformationSchema = z.object({
  alias: z.string(),
  description: z.string(),
  notes: z.string(),
  history: z.string(),
}).passthrough();

const ActorSystemSchema = z.object({
  stats: ActorStatsSchema,
  derivedStats: DerivedStatsSchema,
  roleInfo: ActorRoleInfoSchema,
  information: ActorInformationSchema,
  externalData: z.record(z.string(), z.unknown()).optional(),
  reputation: z.unknown().optional(),
  installedItems: z.unknown().optional(),
  weapons: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const ActorSchema = FoundryBaseDocumentSchema.extend({
  type: z.enum(['character', 'mook']),
  img: z.string().optional(),
  system: ActorSystemSchema,
  items: z.array(z.unknown()).optional(),
  prototypeToken: z.unknown().optional(),
  effects: z.array(z.unknown()).optional(),
}).passthrough();

export {
  StatValueSchema,
  StatWithMaxSchema,
  ActorStatsSchema,
  DerivedStatsSchema,
  WoundState,
  ActorSystemSchema,
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/shared/actor.schema.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/schemas/common.schema.ts src/shared/schemas/actor.schema.ts tests/shared/actor.schema.test.ts
git commit -m "feat: add common and actor Zod schemas with passing tests"
```

---

## Task 4: Item Schema (TDD)

**Files:**
- Create: `src/shared/schemas/item.schema.ts`
- Create: `tests/shared/item.schema.test.ts`

- [ ] **Step 1: Write the failing Item test**

`tests/shared/item.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ItemSchema } from '../../src/shared/schemas/item.schema.js';

describe('ItemSchema', () => {
  it('parses a real gear item (Afterlife Eagle)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Items/fvtt-Item-afterlife-eagle_personal-background-point-ueTVClKghjJ4vxzN.json',
        'utf-8',
      ),
    );
    const result = ItemSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real gear item (Underground Gala Invite)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Items/fvtt-Item-underground-gala-invite-VOFnxBgH9hPlezuT.json',
        'utf-8',
      ),
    );
    const result = ItemSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses an embedded skill item from an actor', () => {
    const actorRaw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- edgerunner npcs -/fvtt-Actor-ariandel,-fleet-footed-AnbbyHGpme70qLSA.json',
        'utf-8',
      ),
    );
    const skillItem = actorRaw.items[0];
    const result = ItemSchema.safeParse(skillItem);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('rejects an object missing name', () => {
    const invalid = { type: 'gear' };
    const result = ItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/item.schema.test.ts`
Expected: FAIL — module `item.schema.js` does not exist.

- [ ] **Step 3: Write `item.schema.ts`**

`src/shared/schemas/item.schema.ts`:
```typescript
import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundrySourceSchema } from './common.schema.js';

const ItemDescriptionSchema = z.object({
  value: z.string(),
}).passthrough();

const ItemPriceSchema = z.object({
  market: z.number(),
}).passthrough();

const ItemConcealableSchema = z.object({
  concealable: z.boolean(),
  isConcealed: z.boolean(),
});

const ItemInstalledItemsSchema = z.object({
  allowedTypes: z.array(z.string()),
  allowed: z.boolean(),
  list: z.array(z.unknown()),
  usedSlots: z.number(),
  slots: z.number(),
});

const BaseItemSystemSchema = z.object({
  description: ItemDescriptionSchema,
  source: FoundrySourceSchema,
  favorite: z.boolean(),
  revealed: z.boolean().optional(),
}).passthrough();

export const ItemSchema = FoundryBaseDocumentSchema.extend({
  type: z.string(),
  img: z.string().optional(),
  system: BaseItemSystemSchema,
  effects: z.array(z.unknown()).optional(),
  sort: z.number().optional(),
  ownership: z.record(z.string(), z.number()).optional(),
}).passthrough();

export { BaseItemSystemSchema, ItemDescriptionSchema, ItemPriceSchema, ItemConcealableSchema, ItemInstalledItemsSchema };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shared/item.schema.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/item.schema.ts tests/shared/item.schema.test.ts
git commit -m "feat: add item Zod schema with passing tests"
```

---

## Task 5: Scene Schema (TDD)

**Files:**
- Create: `src/shared/schemas/scene.schema.ts`
- Create: `tests/shared/scene.schema.test.ts`

- [ ] **Step 1: Write the failing Scene test**

`tests/shared/scene.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SceneSchema } from '../../src/shared/schemas/scene.schema.js';

describe('SceneSchema', () => {
  it('parses a real environment scene (Afterlife Exterior)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Maps/Afterlife Evergreen/Maps/fvtt-Scene-1.-afterlife-exterior-environment-VCbthP8Ez4uhtdkr.json',
        'utf-8',
      ),
    );
    const result = SceneSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('parses a real combat scene with walls and lights (6th Street Shootout)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Maps/Part 1 - Grand Opening/fvtt-Scene-6th-street-shootout-XcdL7EiMCNgtQHHt.json',
        'utf-8',
      ),
    );
    const result = SceneSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.walls.length).toBeGreaterThan(0);
    expect(raw.lights.length).toBeGreaterThan(0);
  });

  it('rejects an object missing required grid', () => {
    const invalid = { name: 'Bad Scene', width: 100, height: 100 };
    const result = SceneSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/scene.schema.test.ts`
Expected: FAIL — module `scene.schema.js` does not exist.

- [ ] **Step 3: Write `scene.schema.ts`**

`src/shared/schemas/scene.schema.ts`:
```typescript
import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundryFlagsSchema } from './common.schema.js';

const SceneBackgroundSchema = z.object({
  src: z.string(),
  scaleX: z.number(),
  scaleY: z.number(),
  offsetX: z.number(),
  offsetY: z.number(),
  rotation: z.number(),
  anchorX: z.number().optional(),
  anchorY: z.number().optional(),
  fit: z.string(),
  tint: z.string().nullable(),
  alphaThreshold: z.number(),
}).passthrough();

const SceneGridSchema = z.object({
  type: z.number(),
  size: z.number(),
  color: z.string(),
  alpha: z.number(),
  distance: z.number(),
  units: z.string(),
  style: z.string(),
  thickness: z.number(),
});

const SceneWallSchema = z.object({
  c: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  _id: z.string(),
  light: z.number(),
  move: z.number(),
  sight: z.number(),
  sound: z.number(),
  dir: z.number(),
  door: z.number(),
  ds: z.number(),
  threshold: z.object({
    light: z.number().nullable(),
    sight: z.number().nullable(),
    sound: z.number().nullable(),
    attenuation: z.boolean(),
  }).passthrough(),
  flags: FoundryFlagsSchema.optional(),
});

const SceneLightConfigSchema = z.object({
  alpha: z.number(),
  angle: z.number(),
  bright: z.number(),
  dim: z.number(),
  color: z.string().nullable(),
  coloration: z.number(),
  luminosity: z.number(),
  saturation: z.number(),
  contrast: z.number(),
  shadows: z.number(),
  animation: z.object({
    type: z.string().nullable(),
    speed: z.number(),
    intensity: z.number(),
    reverse: z.boolean(),
  }).passthrough(),
  darkness: z.object({
    min: z.number(),
    max: z.number(),
  }),
  attenuation: z.number(),
  negative: z.boolean(),
  priority: z.number(),
}).passthrough();

const SceneLightSchema = z.object({
  _id: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  walls: z.boolean(),
  vision: z.boolean(),
  config: SceneLightConfigSchema,
  hidden: z.boolean(),
  elevation: z.number(),
  flags: FoundryFlagsSchema.optional(),
});

const SceneTileTextureSchema = z.object({
  src: z.string().nullable(),
  scaleX: z.number(),
  scaleY: z.number(),
  tint: z.string().nullable(),
  offsetX: z.number(),
  offsetY: z.number(),
  rotation: z.number(),
  anchorX: z.number(),
  anchorY: z.number(),
  fit: z.string(),
  alphaThreshold: z.number(),
}).passthrough();

const SceneTileSchema = z.object({
  texture: SceneTileTextureSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  alpha: z.number(),
  occlusion: z.object({
    mode: z.number(),
    alpha: z.number(),
  }).passthrough(),
  flags: FoundryFlagsSchema.optional(),
}).passthrough();

const SceneTokenSchema = z.object({
  name: z.string(),
  x: z.number(),
  y: z.number(),
}).passthrough();

const GlobalLightSchema = z.object({
  luminosity: z.number(),
  enabled: z.boolean(),
  darkness: z.object({
    max: z.number(),
    min: z.number(),
  }),
  alpha: z.number(),
  bright: z.boolean(),
  color: z.string().nullable(),
  coloration: z.number(),
  saturation: z.number(),
  contrast: z.number(),
  shadows: z.number(),
}).passthrough();

const EnvironmentLevelSchema = z.object({
  hue: z.number(),
  intensity: z.number(),
  luminosity: z.number(),
  saturation: z.number(),
  shadows: z.number(),
});

const SceneEnvironmentSchema = z.object({
  globalLight: GlobalLightSchema,
  darknessLevel: z.number(),
  darknessLock: z.boolean(),
  cycle: z.boolean(),
  base: EnvironmentLevelSchema,
  dark: EnvironmentLevelSchema,
}).passthrough();

const SceneFogSchema = z.object({
  exploration: z.boolean(),
  reset: z.number().nullable(),
  overlay: z.string().nullable(),
  colors: z.object({
    explored: z.string().nullable(),
    unexplored: z.string().nullable(),
  }),
}).passthrough();

export const SceneSchema = FoundryBaseDocumentSchema.extend({
  navigation: z.boolean(),
  navOrder: z.number(),
  navName: z.string(),
  background: SceneBackgroundSchema,
  foreground: z.string().nullable().optional(),
  foregroundElevation: z.number().optional(),
  width: z.number(),
  height: z.number(),
  padding: z.number(),
  initial: z.object({
    x: z.number().nullable(),
    y: z.number().nullable(),
    scale: z.number().nullable(),
  }),
  backgroundColor: z.string(),
  grid: SceneGridSchema,
  tokenVision: z.boolean(),
  environment: SceneEnvironmentSchema,
  fog: SceneFogSchema,
  weather: z.string().nullable().optional(),
  walls: z.array(SceneWallSchema),
  lights: z.array(SceneLightSchema),
  tiles: z.array(SceneTileSchema),
  tokens: z.array(SceneTokenSchema),
  drawings: z.array(z.unknown()),
  sounds: z.array(z.unknown()),
  notes: z.array(z.unknown()),
  templates: z.array(z.unknown()),
  regions: z.array(z.unknown()),
  playlist: z.string().nullable().optional(),
  playlistSound: z.string().nullable().optional(),
  journal: z.string().nullable().optional(),
  journalEntryPage: z.string().nullable().optional(),
  thumb: z.string().nullable().optional(),
}).passthrough();

export {
  SceneBackgroundSchema,
  SceneGridSchema,
  SceneWallSchema,
  SceneLightSchema,
  SceneTileSchema,
  SceneTokenSchema,
  SceneEnvironmentSchema,
  SceneFogSchema,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shared/scene.schema.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/scene.schema.ts tests/shared/scene.schema.test.ts
git commit -m "feat: add scene Zod schema with passing tests"
```

---

## Task 6: Journal Schema (TDD)

**Files:**
- Create: `src/shared/schemas/journal.schema.ts`
- Create: `tests/shared/journal.schema.test.ts`

- [ ] **Step 1: Write the failing Journal test**

`tests/shared/journal.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { JournalEntrySchema } from '../../src/shared/schemas/journal.schema.js';

describe('JournalEntrySchema', () => {
  it('parses a real single-page journal (Afterlife Entrance Fee)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Services Of The Afterlife/fvtt-JournalEntry-01.-entrance-fee-sanctuary-and-reputation-yt2ffG5B0uqTKi1z.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.pages.length).toBeGreaterThan(0);
  });

  it('parses a real multi-page journal (Introduction & GM Resources)', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Ticket To The Afterlife/Part 0 - Introduction/0. Introduction & GM Resources - START HERE/fvtt-JournalEntry-0.-introduction-and-gm-resources-start-here-AicipeEFVWBWOM1F.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.pages.length).toBe(2);
  });

  it('validates that page text content is a string', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Services Of The Afterlife/fvtt-JournalEntry-01.-entrance-fee-sanctuary-and-reputation-yt2ffG5B0uqTKi1z.json',
        'utf-8',
      ),
    );
    const result = JournalEntrySchema.parse(raw);
    const firstPage = result.pages[0];
    if (firstPage?.text) {
      expect(typeof firstPage.text.content).toBe('string');
      expect(firstPage.text.content.length).toBeGreaterThan(0);
    }
  });

  it('rejects an object missing pages array', () => {
    const invalid = { name: 'Bad Journal' };
    const result = JournalEntrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/journal.schema.test.ts`
Expected: FAIL — module `journal.schema.js` does not exist.

- [ ] **Step 3: Write `journal.schema.ts`**

`src/shared/schemas/journal.schema.ts`:
```typescript
import { z } from 'zod';
import {
  FoundryBaseDocumentSchema,
  FoundryFlagsSchema,
  FoundryOwnershipSchema,
  FoundryStatsSchema,
} from './common.schema.js';

const JournalPageTextSchema = z.object({
  format: z.number(),
  content: z.string(),
}).passthrough();

const JournalPageSchema = z.object({
  sort: z.number(),
  name: z.string(),
  type: z.enum(['text', 'image', 'video']),
  _id: z.string(),
  title: z.object({
    show: z.boolean(),
    level: z.number(),
  }).optional(),
  text: JournalPageTextSchema.optional(),
  image: z.unknown().optional(),
  video: z.unknown().optional(),
  src: z.string().nullable().optional(),
  system: z.unknown().optional(),
  ownership: FoundryOwnershipSchema.optional(),
  flags: FoundryFlagsSchema.optional(),
  _stats: FoundryStatsSchema.optional(),
}).passthrough();

export const JournalEntrySchema = FoundryBaseDocumentSchema.extend({
  pages: z.array(JournalPageSchema),
}).passthrough();

export { JournalPageSchema, JournalPageTextSchema };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shared/journal.schema.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/journal.schema.ts tests/shared/journal.schema.test.ts
git commit -m "feat: add journal entry Zod schema with passing tests"
```

---

## Task 7: RollTable Schema (TDD)

**Files:**
- Create: `src/shared/schemas/roll-table.schema.ts`
- Create: `tests/shared/roll-table.schema.test.ts`

- [ ] **Step 1: Write the failing RollTable test**

`tests/shared/roll-table.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RollTableSchema } from '../../src/shared/schemas/roll-table.schema.js';

describe('RollTableSchema', () => {
  it('parses a real bounty employer table', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-1-employers-KirLdfCtBGJiHb8S.json',
        'utf-8',
      ),
    );
    const result = RollTableSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
    expect(raw.formula).toBe('1d6');
    expect(raw.results.length).toBe(6);
  });

  it('parses a real bounty jobs table', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-3-jobs-CH0MZZJM7Kyzal9q.json',
        'utf-8',
      ),
    );
    const result = RollTableSchema.safeParse(raw);
    if (!result.success) {
      console.error(result.error.format());
    }
    expect(result.success).toBe(true);
  });

  it('validates result ranges are tuples of two numbers', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-1-employers-KirLdfCtBGJiHb8S.json',
        'utf-8',
      ),
    );
    const parsed = RollTableSchema.parse(raw);
    for (const result of parsed.results) {
      expect(result.range).toHaveLength(2);
      expect(typeof result.range[0]).toBe('number');
      expect(typeof result.range[1]).toBe('number');
    }
  });

  it('rejects an object missing formula', () => {
    const invalid = { name: 'Bad Table', results: [] };
    const result = RollTableSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/roll-table.schema.test.ts`
Expected: FAIL — module `roll-table.schema.js` does not exist.

- [ ] **Step 3: Write `roll-table.schema.ts`**

`src/shared/schemas/roll-table.schema.ts`:
```typescript
import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundryFlagsSchema } from './common.schema.js';

const RollTableResultSchema = z.object({
  type: z.enum(['text', 'document', 'compendium']),
  weight: z.number(),
  range: z.tuple([z.number(), z.number()]),
  drawn: z.boolean(),
  text: z.string(),
  _id: z.string(),
  documentId: z.string().nullable().optional(),
  img: z.string().optional(),
  flags: FoundryFlagsSchema.optional(),
}).passthrough();

export const RollTableSchema = FoundryBaseDocumentSchema.extend({
  formula: z.string(),
  description: z.string().optional(),
  replacement: z.boolean(),
  displayRoll: z.boolean(),
  results: z.array(RollTableResultSchema),
  img: z.string().optional(),
}).passthrough();

export { RollTableResultSchema };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shared/roll-table.schema.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/roll-table.schema.ts tests/shared/roll-table.schema.test.ts
git commit -m "feat: add roll table Zod schema with passing tests"
```

---

## Task 8: PDF Chunk Schema (TDD)

**Files:**
- Create: `src/shared/schemas/pdf-chunk.schema.ts`
- Create: `tests/shared/pdf-chunk.schema.test.ts`

- [ ] **Step 1: Write the failing PdfChunk test**

`tests/shared/pdf-chunk.schema.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { PdfChunkSchema, NamespaceEnum } from '../../src/shared/schemas/pdf-chunk.schema.js';

describe('PdfChunkSchema', () => {
  it('validates a well-formed core rules chunk', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Friday Night Firefight > Actions > Move Action',
      pageStart: 169,
      pageEnd: 170,
      content: 'Every Turn, a Character gets a Move Action, which can only be used to move a number of m/yds equal to their MOVE x 2.',
      chunkIndex: 0,
      tokenEstimate: 42,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it('validates a Black Chrome chunk', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-BlackChrome.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Weapons > Assault Rifles',
      pageStart: 85,
      pageEnd: 87,
      content: 'Assault rifles are the standard for corporate security forces.',
      chunkIndex: 3,
      tokenEstimate: 18,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it('rejects a chunk with invalid namespace', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'invalid_namespace',
      sectionHeading: 'Test',
      pageStart: 1,
      pageEnd: 1,
      content: 'test',
      chunkIndex: 0,
      tokenEstimate: 1,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('rejects a chunk with missing content', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Test',
      pageStart: 1,
      pageEnd: 1,
      chunkIndex: 0,
      tokenEstimate: 0,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('rejects a chunk with negative page numbers', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Test',
      pageStart: -1,
      pageEnd: 1,
      content: 'test',
      chunkIndex: 0,
      tokenEstimate: 1,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('exports all three valid namespaces', () => {
    const namespaces = NamespaceEnum.options;
    expect(namespaces).toContain('core_rules');
    expect(namespaces).toContain('campaign_ttta');
    expect(namespaces).toContain('entities_mooks');
    expect(namespaces).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shared/pdf-chunk.schema.test.ts`
Expected: FAIL — module `pdf-chunk.schema.js` does not exist.

- [ ] **Step 3: Write `pdf-chunk.schema.ts`**

`src/shared/schemas/pdf-chunk.schema.ts`:
```typescript
import { z } from 'zod';

export const NamespaceEnum = z.enum([
  'core_rules',
  'campaign_ttta',
  'entities_mooks',
]);

export const PdfChunkSchema = z.object({
  sourceFile: z.string().min(1),
  namespace: NamespaceEnum,
  sectionHeading: z.string().min(1),
  pageStart: z.number().int().nonnegative(),
  pageEnd: z.number().int().nonnegative(),
  content: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  tokenEstimate: z.number().int().nonnegative(),
}).refine(
  (data) => data.pageEnd >= data.pageStart,
  { message: 'pageEnd must be >= pageStart' },
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shared/pdf-chunk.schema.test.ts`
Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/schemas/pdf-chunk.schema.ts tests/shared/pdf-chunk.schema.test.ts
git commit -m "feat: add PDF chunk Zod schema with passing tests"
```

---

## Task 9: Node A Response Schema

**Files:**
- Create: `src/shared/schemas/node-a.schema.ts`

No separate test file — these schemas validate a contract we define (not external data). They are verified implicitly via type inference in Task 10, and will be tested against real Node A responses in Phase 2.

- [ ] **Step 1: Write `node-a.schema.ts`**

`src/shared/schemas/node-a.schema.ts`:
```typescript
import { z } from 'zod';
import { NamespaceEnum } from './pdf-chunk.schema.js';

export const RollResultSchema = z.object({
  total: z.number(),
  rolls: z.array(z.number()),
  stat: z.string().optional(),
  skill: z.string().optional(),
  dv: z.number().optional(),
  success: z.boolean(),
  margin: z.number(),
  reasoning: z.string(),
});

export const RagMatchSchema = z.object({
  content: z.string(),
  namespace: NamespaceEnum,
  sourceFile: z.string(),
  sectionHeading: z.string(),
  score: z.number(),
  pageStart: z.number().int().nonnegative(),
  pageEnd: z.number().int().nonnegative(),
});

export const RagQueryResultSchema = z.object({
  matches: z.array(RagMatchSchema),
  query: z.string(),
});

export const NodeAErrorSchema = z.object({
  error: z.literal(true),
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/schemas/node-a.schema.ts
git commit -m "feat: add Node A response validation schemas (zero-trust)"
```

---

## Task 10: Barrel Exports + Inferred Types + Full Validation

**Files:**
- Modify: `src/shared/schemas/index.ts`
- Create: `src/shared/types/foundry.types.ts`
- Modify: `src/shared/types/index.ts`
- Modify: `src/shared/index.ts`

- [ ] **Step 1: Update `src/shared/schemas/index.ts`**

```typescript
export {
  FoundryStatsSchema,
  FoundrySourceSchema,
  FoundryFlagsSchema,
  FoundryOwnershipSchema,
  FoundryBaseDocumentSchema,
} from './common.schema.js';

export {
  ActorSchema,
  ActorStatsSchema,
  ActorSystemSchema,
  DerivedStatsSchema,
  StatValueSchema,
  StatWithMaxSchema,
  WoundState,
} from './actor.schema.js';

export {
  ItemSchema,
  BaseItemSystemSchema,
  ItemDescriptionSchema,
  ItemPriceSchema,
  ItemConcealableSchema,
  ItemInstalledItemsSchema,
} from './item.schema.js';

export {
  SceneSchema,
  SceneBackgroundSchema,
  SceneGridSchema,
  SceneWallSchema,
  SceneLightSchema,
  SceneTileSchema,
  SceneTokenSchema,
  SceneEnvironmentSchema,
  SceneFogSchema,
} from './scene.schema.js';

export {
  JournalEntrySchema,
  JournalPageSchema,
  JournalPageTextSchema,
} from './journal.schema.js';

export {
  RollTableSchema,
  RollTableResultSchema,
} from './roll-table.schema.js';

export {
  PdfChunkSchema,
  NamespaceEnum,
} from './pdf-chunk.schema.js';

export {
  RollResultSchema,
  RagMatchSchema,
  RagQueryResultSchema,
  NodeAErrorSchema,
} from './node-a.schema.js';
```

- [ ] **Step 2: Create `src/shared/types/foundry.types.ts`**

```typescript
import { z } from 'zod';
import {
  ActorSchema,
  ActorStatsSchema,
  DerivedStatsSchema,
  ItemSchema,
  SceneSchema,
  JournalEntrySchema,
  JournalPageSchema,
  RollTableSchema,
  RollTableResultSchema,
  PdfChunkSchema,
  NamespaceEnum,
  RollResultSchema,
  RagQueryResultSchema,
  RagMatchSchema,
  NodeAErrorSchema,
  SceneWallSchema,
  SceneLightSchema,
  SceneTileSchema,
} from '../schemas/index.js';

// Foundry VTT Document Types
export type Actor = z.infer<typeof ActorSchema>;
export type ActorStats = z.infer<typeof ActorStatsSchema>;
export type DerivedStats = z.infer<typeof DerivedStatsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneWall = z.infer<typeof SceneWallSchema>;
export type SceneLight = z.infer<typeof SceneLightSchema>;
export type SceneTile = z.infer<typeof SceneTileSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalPage = z.infer<typeof JournalPageSchema>;
export type RollTable = z.infer<typeof RollTableSchema>;
export type RollTableResult = z.infer<typeof RollTableResultSchema>;

// Ingestion Pipeline Types
export type PdfChunk = z.infer<typeof PdfChunkSchema>;
export type Namespace = z.infer<typeof NamespaceEnum>;

// Node A Response Types (Zero-Trust)
export type RollResult = z.infer<typeof RollResultSchema>;
export type RagQueryResult = z.infer<typeof RagQueryResultSchema>;
export type RagMatch = z.infer<typeof RagMatchSchema>;
export type NodeAError = z.infer<typeof NodeAErrorSchema>;
```

- [ ] **Step 3: Update `src/shared/types/index.ts`**

```typescript
export type {
  Actor,
  ActorStats,
  DerivedStats,
  Item,
  Scene,
  SceneWall,
  SceneLight,
  SceneTile,
  JournalEntry,
  JournalPage,
  RollTable,
  RollTableResult,
  PdfChunk,
  Namespace,
  RollResult,
  RagQueryResult,
  RagMatch,
  NodeAError,
} from './foundry.types.js';
```

- [ ] **Step 4: Verify `src/shared/index.ts` re-exports correctly**

The file already contains:
```typescript
export * from './schemas/index.js';
export * from './types/index.js';
```

No changes needed.

- [ ] **Step 5: Run full typecheck**

Run: `npx tsc --noEmit`
Expected: Zero errors. All types infer correctly from Zod schemas.

- [ ] **Step 6: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (actor: 3, item: 4, scene: 3, journal: 4, roll-table: 4, pdf-chunk: 6 = **24 total**).

- [ ] **Step 7: Commit**

```bash
git add src/shared/schemas/index.ts src/shared/types/foundry.types.ts src/shared/types/index.ts
git commit -m "feat: add barrel exports and inferred TypeScript types for all schemas"
```

---

## Task 11: Final Validation + Version Bump

**Files:**
- Modify: `README.md` (version)
- Modify: `CHANGELOG.md` (new entry)

- [ ] **Step 1: Run full typecheck one final time**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Run full test suite one final time**

Run: `npx vitest run`
Expected: 24 tests PASS, zero failures.

- [ ] **Step 3: Update `CHANGELOG.md`**

Add new entry at the top of the version list (below the header, above `[0.1.0]`):

```markdown
## [0.2.0] - 2026-03-28

### Added

- TypeScript project configuration (ES2022, Node16, strict mode)
- Vitest test harness configuration
- Source tree scaffolding (src/api, src/core, src/db, src/mcp, src/shared)
- Zod schemas for all Foundry VTT document types:
  - Actor (character/mook stats, derived stats, wound states, role info)
  - Item (gear, skill, with extensible base for weapon/cyberware/armor)
  - Scene (maps with walls, lights, tiles, tokens, environment, fog)
  - JournalEntry (multi-page HTML content)
  - RollTable (formula, weighted results with ranges)
- Common Foundry sub-schemas (_stats, flags, ownership, source, base document)
- PDF chunk schema for Phase 1 ingestion pipeline contract
- Node A response schemas for zero-trust validation (roll results, RAG queries, errors)
- Inferred TypeScript types from all Zod schemas
- 24 tests validating schemas against real seed data from docs/raw_data/
```

- [ ] **Step 4: Update `README.md` version**

Change:
```markdown
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
```
To:
```markdown
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
```

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md README.md
git commit -m "chore: bump to v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS — Phase 0 Foundation complete"
```

- [ ] **Step 6: Verify Phase 0 gate**

Confirm both commands pass cleanly:

Run: `npx tsc --noEmit && npx vitest run`
Expected: Zero errors, 24 tests PASS.

Phase 0 is complete. Ready for Lead Architect (user) approval before proceeding to Phase 1.

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Project configuration (package.json, tsconfig, vitest) | - |
| 2 | Source tree scaffolding (barrel exports) | - |
| 3 | Common + Actor schema | 3 |
| 4 | Item schema | 4 |
| 5 | Scene schema | 3 |
| 6 | Journal schema | 4 |
| 7 | RollTable schema | 4 |
| 8 | PDF Chunk schema | 6 |
| 9 | Node A response schema | - |
| 10 | Barrel exports + inferred types + full validation | - |
| 11 | Final validation + version bump | - |
| **Total** | **11 tasks** | **24 tests** |


---
**LINKS:** [[OS_CORE]]
