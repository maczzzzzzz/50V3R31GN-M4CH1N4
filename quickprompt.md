# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.3)

**Context:** The Topology Library and Master Blueprint Engine are complete and verified. All 50+ system shards are documented. We are now integrating the **Audit-First Forge Pipeline** and the **Nucleus Assembler** to complete Phase 54.

**Objective:** Implement Phase 54: Tasks 3 and 4.

---

## 🛠️ TASK 3: AUDIT-FIRST FORGE PIPELINE
1. **Integration:** Hook into Nano Banana 2 (Imagen 3) via the existing vision pipeline.
2. **Skinning:** Use the 1-bit skeleton as a control image to generate high-fidelity TTTA-style WebP tiles.
3. **Audit:** Implement Node A pixel-wise mask audit to ensure generated floors don't bleed into walls.
4. **Sync:** Use `ST3GG` to embed the `TileDNA` metadata (wallSegments, exits) into the final WebP LSB.
5. **Ability Shard:** Create `scripts/gauntlet/phases/orch-54-3.ts` to verify the audit logic and metadata embedding.

---

## 🛠️ TASK 4: NUCLEUS ASSEMBLER
1. **Implementation:** Create `scripts/forge/assembler.ts`.
2. **Foundry Sync:** Use the Motor Cortex to create a Scene, place the tiles, and materialize walls/lights from embedded metadata.
3. **Observability:** Expose the assembly status to the Nucleus Deck `SENSORY` quadrant.
4. **Ability Shard:** Create `scripts/gauntlet/phases/orch-54-4.ts` to verify end-to-end scene manifestation in Foundry.

---

## 🛡️ SYSTEM INTEGRITY
1. **Vault Security:** NEVER include `docs/raw_data/` in any `vault seal` operation.
2. **Roadmap:** Phase 55 (District Harvest) is now locked in the implementation plan for mass production.
3. **Validation:** `npm run gauntlet --shard=54` -> 100% PASS.

*Directive Issued by Gemini CLI (Strategist).*
