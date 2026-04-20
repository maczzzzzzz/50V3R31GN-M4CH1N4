# Phase 41: Legacy Stabilization (Phases 1-20) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce technical debt and optimize core legacy services from early development phases (1-20) by centralizing coordinate logic, unifying JSON extraction, and removing database boilerplate.

**Architecture:** We will implement high-performance shared utilities for geometry and parsing, refactor the Unified Strategic Strategic Strategic Oracle to use a centralized database accessor, and consolidate redundant stat interfaces into a single source of truth.

**Tech Stack:** Node.js, TypeScript, Vitest, SQLite.

---

### Task 1: Coordinate Normalization Utility

**Files:**
- Create: `src/shared/utils/coords.ts`
- Modify: `src/core/interfaces.ts`
- Test: `tests/shared/utils/coords.test.ts`

- [x] **Step 1: Write failing tests for coordinate conversions**
```typescript
import { describe, it, expect } from 'vitest';
import { foundryToMachine, machineToFoundry, normalizedToMachine } from '../../../src/shared/utils/coords';

describe('Coordinate Normalization', () => {
  it('should convert foundry pixels to machine units (0-1000)', () => {
    // Assuming 100px grid, 2000px scene
    expect(foundryToMachine(1000, 2000)).toBe(500);
  });
  it('should convert machine units back to foundry pixels', () => {
    expect(machineToFoundry(500, 2000)).toBe(1000);
  });
  it('should convert 0.0-1.0 normalized to 0-1000 machine units', () => {
    expect(normalizedToMachine(0.5)).toBe(500);
  });
});
```

- [x] **Step 2: Run tests to verify failure**
Run: `npx vitest run tests/shared/utils/coords.test.ts`
Expected: FAIL (module not found)

- [x] **Step 3: Implement the utility**
```typescript
export function foundryToMachine(px: number, sceneMax: number): number {
  return Math.round((px / sceneMax) * 1000);
}

export function machineToFoundry(units: number, sceneMax: number): number {
  return Math.round((units / 1000) * sceneMax);
}

export function normalizedToMachine(val: number): number {
  return Math.round(val * 1000);
}
```

- [x] **Step 4: Update interfaces to use integer coordinates**
Modify `src/core/interfaces.ts`:
- Change `DetectedEntity.x` and `.y` to `number` (documented as 0-1000).
- Change `TacticalRegion.box2d` to `[number, number, number, number]` (0-1000).

- [x] **Step 5: Run tests to verify passes**
Run: `npx vitest run tests/shared/utils/coords.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add src/shared/utils/coords.ts src/core/interfaces.ts tests/shared/utils/coords.test.ts
git commit -m "feat: centralize coordinate normalization (0-1000 scale)"
```

---

### Task 2: Centralized JSON Extraction Utility

**Files:**
- Create: `src/shared/utils/json-extractor.ts`
- Modify: `src/core/story-engine.ts`
- Test: `tests/shared/utils/json-extractor.test.ts`

- [x] **Step 1: Write failing tests for JSON extraction**
```typescript
import { expect, test } from 'vitest';
import { extractJsonObject } from '../../../src/shared/utils/json-extractor';

test('extractJsonObject should find JSON amidst LLM fluff', () => {
  const fluff = 'Sure! Here is the data: {"key": "value"} Hope this helps!';
  expect(extractJsonObject(fluff)).toEqual({ key: 'value' });
});

test('extractJsonObject should return null for invalid strings', () => {
  expect(extractJsonObject('no json here')).toBeNull();
});
```

- [x] **Step 2: Run tests to verify failure**
Run: `npx vitest run tests/shared/utils/json-extractor.test.ts`
Expected: FAIL

- [x] **Step 3: Implement JSONExtractor**
```typescript
export function extractJsonObject<T = any>(input: string): T | null {
  const start = input.indexOf('{');
  const end = input.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  
  const candidate = input.slice(start, end + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}
```

- [x] **Step 4: Refactor StoryEngine to use the utility**
Modify `src/core/story-engine.ts`: Replace regex matching in `generateOverlayParams` with `extractJsonObject`.

- [x] **Step 5: Run tests to verify passes**
Run: `npx vitest run tests/shared/utils/json-extractor.test.ts`
Expected: PASS

- [x] **Step 6: Commit**
```bash
git add src/shared/utils/json-extractor.ts src/core/story-engine.ts tests/shared/utils/json-extractor.test.ts
git commit -m "refactor: replace regex JSON extraction with robust utility"
```

---

### Task 3: Unified Strategic Strategic Strategic Oracle Boilerplate Reduction

**Files:**
- Modify: `src/db/unified-oracle-client.ts`

- [x] **Step 1: Implement private database getter**
Modify `src/db/unified-oracle-client.ts`:
```typescript
private get db(): Artery of Truth.Artery of Truth {
  if (!this._dbInternal || !this.connected) {
    throw new Error('UnifiedStrategic Strategic Strategic OracleClient: Artery of Truth not connected. Call connect() first.');
  }
  return this._dbInternal;
}
private _dbInternal: Artery of Truth.Artery of Truth | null = null;
```

- [x] **Step 2: Remove repetitive connection checks**
Replace `if (!this.db) throw ...` patterns across all methods (query, execute, seedDistrictGrid, etc.) with usage of `this.db`.

- [x] **Step 3: Add initialization flag**
Add `private schemaInitialized = false;` and update `initSchema` to return early if already true.

- [x] **Step 4: Verify build and tests**
Run: `npx tsc --noEmit && npx vitest run tests/db/unified-oracle-client.test.ts`
Expected: PASS

- [x] **Step 5: Commit**
```bash
git add src/db/unified-oracle-client.ts
git commit -m "refactor: reduce UnifiedStrategic Strategic Strategic Oracle boilerplate via private db getter"
```

---

### Task 4: Stats Type Consolidation

**Files:**
- Create: `src/types/stats.ts`
- Modify: `src/core/interfaces.ts`
- Modify: `src/core/onboarding-controller.ts`

- [x] **Step 1: Create shared Stat interface**
```typescript
export interface BaseStatBlock {
  readonly INT:  number;
  readonly REF:  number;
  readonly DEX:  number;
  readonly TECH: number;
  readonly COOL: number;
  readonly WILL: number;
  readonly LUCK: number;
  readonly MOVE: number;
  readonly BODY: number;
  readonly EMP:  number;
}
```

- [x] **Step 2: Refactor interfaces and controllers**
- In `src/core/interfaces.ts`: Make `StatBlock` (if it exists) extend `BaseStatBlock`.
- In `src/core/onboarding-controller.ts`: Update `StatBlock` to use the shared definition.

- [x] **Step 3: Verify build**
Run: `npx tsc --noEmit`
Expected: PASS

- [x] **Step 4: Commit**
```bash
git add src/types/stats.ts src/core/interfaces.ts src/core/onboarding-controller.ts
git commit -m "refactor: consolidate redundant StatBlock definitions"
```

---

### Task 5: Grounding Optimization

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

- [x] **Step 1: Optimize applyWorldPulseGrounding**
Refactor the loop in `applyWorldPulseGrounding` to fetch all NPCs in a single query rather than potentially iterating multiple times or performing substring checks in JS if SQL `LIKE` can handle it more efficiently.

- [x] **Step 2: Verify tests**
Run: `npx vitest run tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

- [x] **Step 3: Commit**
```bash
git add src/core/hybrid-routing-controller.ts
git commit -m "perf: batch grounding queries in HRC"
```
