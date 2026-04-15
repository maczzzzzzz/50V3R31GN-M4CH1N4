# Sovereign Asset Forge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mass-produce high-fidelity top-down tactical sprites and props by repurposing legacy ST3GG metadata and leveraging Nano Banana 2 (Imagen 3) with recursive vision audits.

**Architecture:** A transfusion pipeline that extracts JSON from old tokens, constructs aesthetic prompts for Node B, audits output quality via Node A vision logic, and hot-swaps assets in Foundry VTT via Motor Cortex.

**Tech Stack:** Nano Banana 2 (Imagen 3 API), Llama-server (Node A/B), TypeScript, crush-cli (ST3GG), CDP (Chrome DevTools Protocol).

---

### Task 1: ST3GG Transfusion Engine

**Files:**
- Create: `scripts/forge/st3gg-transfusion.ts`
- Modify: `akashik_guides/KNOWLEDGE_BASE.md` (Update pattern registry)

- [ ] **Step 1: Implement Metadata Extractor**
Create a utility that uses `crush-cli` to extract JSON from a list of image paths.

```typescript
// scripts/forge/st3gg-transfusion.ts
import { execSync } from 'node:child_process';
export function extractBody(imgPath: string) {
  const result = execSync(`./crush/crush forge extract ${imgPath}`);
  return JSON.parse(result.toString());
}
```

- [ ] **Step 2: Implement Prompt Constructor**
Build a function that maps ST3GG fields (Faction, Role, Gear) to high-fidelity Imagen 3 prompts.

```typescript
export function buildTokenPrompt(dna: any) {
  return `Top-down tactical token, ${dna.faction} ${dna.role}, wearing ${dna.gear.join(', ')}, realistic textures, grimy cyberpunk aesthetic, transparent background.`;
}
```

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/st3gg-transfusion.ts
git commit -m "feat: implement ST3GG transfusion extractor and prompt logic"
```

---

### Task 2: Recursive Vision Audit (Node A)

**Files:**
- Create: `scripts/forge/vision-audit.ts`
- Create: `tests/forge/vision-audit.test.ts`

- [ ] **Step 1: Write failing test for perspective detection**
Define a test that fails if an image is not top-down.

```typescript
// tests/forge/vision-audit.test.ts
import { auditPerspective } from '../../scripts/forge/vision-audit.js';
test('should fail non-top-down perspective', async () => {
  const result = await auditPerspective('tests/fixtures/portrait.png');
  expect(result.score).toBeLessThan(0.8);
});
```

- [ ] **Step 2: Implement Node A Vision Audit**
Use Node A's vision engine to score generated tokens against perspective and gear requirements.

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/vision-audit.ts tests/forge/vision-audit.test.ts
git commit -m "feat: implement recursive vision audit for token integrity"
```

---

### Task 3: The Prop & Camera Library

**Files:**
- Create: `scripts/forge/prop-factory.ts`
- Create: `scripts/forge/topology-lib/props.json`

- [ ] **Step 1: Define Prop Metadata Schema**
Extend the `TileDNA` patterns to include camera-specific metadata (`vision_arc`, `detection_skill`).

- [ ] **Step 2: Implement Prop Generation Loop**
Create a script to generate the signature prop set (Terminals, Crates, Security Cameras).

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/prop-factory.ts
git commit -m "feat: implement modular prop factory and security camera logic"
```

---

### Task 4: Hot-Swap Infiltration

**Files:**
- Create: `scripts/forge/infiltration-swap.ts`
- Modify: `src/core/motor-cortex.ts` (Add `UPDATE_TOKEN` handler)

- [ ] **Step 1: Implement Global Asset Registry**
Create `scripts/forge/registry.tsv` to track the mapping of UUIDs to new Top-Down files.

- [ ] **Step 2: Implement the Hot-Swap Script**
Use CDP to iterate through Foundry Actors and update their image paths to the new forged assets.

```typescript
// scripts/forge/infiltration-swap.ts
export async function hotSwapTokens(mappings: Map<string, string>) {
  // Use bridge.executeAsGM('Actor.update', ...)
}
```

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/infiltration-swap.ts src/core/motor-cortex.ts
git commit -m "feat: implement foundry token hot-swap infiltration"
```

---

### Task 5: Gauntlet Shard 55 (Asset Verification)

**Files:**
- Create: `scripts/gauntlet/phases/orch-55.ts`

- [ ] **Step 1: Write the Shard 55 Audit**
Verify that a sample set of mooks now uses high-fidelity top-down tokens while retaining original JSON stats.

- [ ] **Step 2: Run Gauntlet**
Run: `npm run gauntlet --shard=55`
Expected: 100% PASS.

- [ ] **Step 3: Final Commit**
```bash
git add scripts/gauntlet/phases/orch-55.ts
git commit -m "chore: finalize Phase 55 Sovereign Asset Forge"
```
