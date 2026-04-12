# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.0)

**Context:** Phase 42-45 and all critical audit remediations (Sovereignty, Fail-Lock, Shaders, Memory) are COMPLETED. The infrastructure is now stable and hardened.

**Objective:** Implement the high-priority consolidation of the Memory Palace and the expansion of Machina influence via the Pulse Engine.

---

## 🛠️ TASK 1: PHASE 46 - PULSE PROPAGATION
1. **Sovereignty Depth:** Implement authority tracking in `system_state`.
   - Update `Akashik.db` to track Machina dominance vs Human manual overrides.
2. **Faction Ripple:** 
   - Integrate duel outcomes into the Faction Engine. 
   - High authority -> Machina compliance; Low authority -> Faction rebellion/instability.
3. **Linguistic Drift:**
   - Link `_hijackJournal` corruption probabilities directly to the current `sovereignty_depth`.

---

## 🛠️ TASK 2: PHASE 47 - UN1V3R54L-C0D3X & MEMORY CONSOLIDATION (HIGH PRIORITY)
1. **Schema Upgrade:** Implement formal `district_id` linking across all tables (`npcs`, `factions`, `locations`, `triplets`).
2. **Harmonization Engine:** 
   - Build/Update the script to scan 3,300+ chronicles and 36 `district_dna` entries.
   - Establish formal RKG links based on semantic overlap.
3. **Palace Reconstruction:**
   - Update `reconstruct-palace.sh` to organize the Obsidian vault by: `District -> Faction -> Category`.
   - Implement auto-tagging based on provenance.
4. **Search Optimization:**
   - Ensure zero-latency cross-source lore retrieval using SQLite FTS5 and pgvector.

---

## 🛠️ TASK 3: PHASE 48 - THE SOVEREIGN TRIAD MCP BRIDGE
1. **Shared Brain:** 
   - Deploy the Node.js MCP daemon (`scripts/dev/mcp-daemon.ts`) as a background sidecar.
2. **Impure Integration:**
   - Verify the `flake.nix` `shellHook` correctly spawns the daemon over the Unix Domain Socket.
   - Ensure `NIXPKGS_ALLOW_UNFREE=1` is exported.

---

## 📖 REFERENCES
- **Sovereign Triad Bridge Spec:** `docs/superpowers/specs/2026-04-12-sovereign-triad-mcp-bridge-design.md`
- **Memory Palace Spec:** `docs/superpowers/specs/2026-04-12-memory-palace-harmonization.md`
- **Audit Report (Archived):** `docs/superpowers/audits/2026-04-12-phase-42-45-code-review.md`

**Final Validation:** Run a full `npm run gauntlet` audit to verify the integrity of the new District mappings.

*Directive Issued by Gemini CLI (Strategist).*
