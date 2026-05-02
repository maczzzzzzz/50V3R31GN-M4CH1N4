# MASTER IMPLEMENTATION PLAN: Atlas Forge Assembler (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular, blueprint-driven battlemap manufacturing pipeline that generates high-fidelity Cyberpunk RED maps matching the TTTA aesthetic.

**Architecture:** A "Structure-First" pipeline where Node B plans a slot-based layout using 1-bit topology skeletons, Nano Banana 2 skinning those skeletons, Node A auditing the results, and the Nucleus Deck physicalizing the final assembly in Foundry VTT.

**Tech Stack:** Nano Banana 2 (Imagen 3), Llama-server (Node A/B), TypeScript (Core), Rust (SDK/FFI), CDP (Foundry Infiltration).

---

### Task 1: Topology Skeleton Library & Metadata

**Files:**
- Create: `scripts/forge/topology-lib/index.ts`
- Create: `scripts/forge/topology-lib/skeletons/gaff.png` (Draft Placeholder)
- Create: `scripts/forge/topology-lib/schema.ts`

- [ ] **Step 1: Define the Topology Metadata Schema**
Define the interface for "Tile DNA" including wall segments and exit indices.

```typescript
// scripts/forge/topology-lib/schema.ts
export interface TileDNA {
  id: string;
  type: 'room' | 'passageway' | 'hub';
  exits: {
    N?: [number, number];
    S?: [number, number];
    E?: [number, number];
    W?: [number, number];
  };
  wallSegments: [number, number, number, number][];
  anchors: { x: number; y: number; type: string }[];
}
```

- [ ] **Step 2: Implement Skeleton Indexer**
Create a utility to load 1-bit skeletons and their metadata.

```typescript
// scripts/forge/topology-lib/index.ts
import { TileDNA } from './schema.js';
export const SKELETON_LIBRARY: Record<string, TileDNA> = {
  'gaff_01': {
    id: 'gaff_01',
    type: 'room',
    exits: { N: [256, 0] },
    wallSegments: [[0,0,512,0], [0,0,0,512], [512,0,512,512], [0,512,512,512]], // simplified
    anchors: [{ x: 128, y: 128, type: 'terminal' }]
  }
};
```

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/topology-lib/
git commit -m "feat: implement topology skeleton schema and library"
```

---

### Task 2: Master Blueprint Engine (Node B)

**Files:**
- Create: `scripts/forge/blueprints/megabuilding.json`
- Create: `scripts/forge/blueprint-engine.ts`

- [ ] **Step 1: Define a Master Blueprint JSON**
Create a slot-based configuration for a 3x3 megabuilding floor.

```json
{
  "id": "megabuilding_floor_01",
  "grid": [
    ["hub_01", "artery_01", "elbow_01"],
    [null, null, "gaff_01"]
  ]
}
```

- [ ] **Step 2: Implement the Blueprint Parser**
Build a script that takes a Blueprint ID and returns a list of required topology tasks.

```typescript
// scripts/forge/blueprint-engine.ts
export function planAssembly(blueprintId: string) {
  // Load JSON, map slots to SKELETON_LIBRARY entries
  // Return assembly instructions
}
```

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/blueprints/ scripts/forge/blueprint-engine.ts
git commit -m "feat: implement master blueprint engine"
```

---

### Task 3: The Audit-First Forge (Node A Audit)

**Files:**
- Create: `scripts/forge/atlas-forge.ts`
- Modify: `scripts/gauntlet/engine.ts` (Register Shard 54)

- [ ] **Step 1: Implement the Image-Skeleton Audit**
Create a function where Node A (Kernel) compares a generated WebP against its 1-bit skeleton to detect wall bleed.

```typescript
// scripts/forge/atlas-forge.ts
export async function auditTile(generatedPath: string, skeletonId: string): Promise<boolean> {
  // 1. Load generated image and skeleton mask
  // 2. Perform pixel-wise comparison: if 'wall' zone in skeleton has 'floor' color in image, fail.
  // 3. Return true if < 5% mismatch
  return true; 
}
```

- [ ] **Step 2: Implement the ST3GG Sync**
Embed the `TileDNA` wall segments into the WebP LSB.

```typescript
// scripts/forge/atlas-forge.ts
export async function syncMetadata(imagePath: string, dna: TileDNA) {
  // Use existing ST3GG logic to write dna as hidden JSON
}
```

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/atlas-forge.ts
git commit -m "feat: implement audit-first forge pipeline"
```

---

### Task 4: The Nucleus Assembler (Foundry Manifestation)

**Files:**
- Create: `scripts/forge/assembler.ts`
- Modify: `src/core/motor-cortex.ts`

- [ ] **Step 1: Implement the Manifest Dispatcher**
Build the logic to create a Scene and place tiles in Foundry.

```typescript
// scripts/forge/assembler.ts
export async function manifestMap(plan: any) {
  // 1. Create Scene via bridge.executeAsGM('Scene.create', ...)
  // 2. Iterate tiles, place via bridge.executeAsGM('Tile.create', ...)
  // 3. Extract ST3GG walls and write to Scene.walls
}
```

- [ ] **Step 2: Add `MANIFEST_MAP` to Motor Cortex**
Update the privileged bridge handlers to accept the new map payload.

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/assembler.ts src/core/motor-cortex.ts
git commit -m "feat: implement nucleus assembler and foundry manifestation"
```

---

### Task 5: Gauntlet Shard 54 (Map-Gen Verification)

**Files:**
- Create: `scripts/gauntlet/phases/orch-54.ts`

- [ ] **Step 1: Write the Verification Logic**
Shard 54 must verify that a full 3-tile assembly results in matching wall segments in the database.

- [ ] **Step 2: Run Gauntlet**
Run: `npm run gauntlet --shard=54`
Expected: 100% PASS.

- [ ] **Step 3: Final Commit**
```bash
git add scripts/gauntlet/phases/orch-54.ts
git commit -m "chore: finalize Phase 54 Atlas Forge Assembler"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
