# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.3)

**Context:** Phase 53 (Ouroboros Logic) is code-complete and verified. We have established recursive verification and genetic prompt evolution. The system is accelerated via 0xSero RADV logic. We are now moving to the first half of the Atlas Forge.

**Objective:** Implement Phase 54: Atlas Forge (Infrastructure & Assembler).

---

## 🛠️ TASK 1: TOPOLOGY SKELETON LIBRARY
1. **Implementation:** Create `scripts/forge/topology-lib/`.
2. **Assets:** Define 1-bit topology skeletons (PNG) for standard rooms: THE GAFF, THE ARTERY, THE HUB.
3. **Metadata:** Implement the `TileDNA` schema to map skeletons to wall/exit coordinates.
4. **Ability Shard:** Create `scripts/gauntlet/phases/orch-54-1.ts` to verify library indexing.

---

## 🛠️ TASK 2: MASTER BLUEPRINT ENGINE
1. **Implementation:** Create `scripts/forge/blueprint-engine.ts`.
2. **Logic:** Define slot-based layout configurations (e.g. 3x3 megabuilding floor).
3. **Orchestration:** Enable Node B to plan a coherent layout by selecting valid neighbor tiles based on exit compatibility.
4. **Ability Shard:** Create `scripts/gauntlet/phases/orch-54-2.ts` to verify layout connectivity.

---

## 🛠️ TASK 3: AUDIT-FIRST FORGE PIPELINE
1. **Integration:** Hook into Nano Banana 2 (Imagen 3) via the existing vision pipeline.
2. **Skinning:** Use the 1-bit skeleton as a control image to generate high-fidelity TTTA-style WebP tiles.
3. **Audit:** Implement Node A pixel-wise mask audit to ensure generated floors don't bleed into walls.
4. **Sync:** Use `ST3GG` to embed the `TileDNA` metadata into the final WebP LSB.

---

## 🛠️ TASK 4: NUCLEUS ASSEMBLER
1. **Implementation:** Create `scripts/forge/assembler.ts`.
2. **Foundry Sync:** Use the Motor Cortex to create a Scene, place the tiles, and materialize walls/lights from embedded metadata.
3. **Observability:** Expose the assembly status to the Nucleus Deck `SENSORY` quadrant.

---

## 🛡️ SYSTEM INTEGRITY
1. **Vault Security:** NEVER include `docs/raw_data/` in any `vault seal` operation.
2. **Performance:** Monitor the 0xSero RADV speedup during the audit phase.
3. **Validation:** `npm run gauntlet --shard=54` -> 100% PASS.

*Directive Issued by Gemini CLI (Strategist).*
