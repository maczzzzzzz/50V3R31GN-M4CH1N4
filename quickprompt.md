# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CONTROL UPGRADE & GAUNTLET MANDATE (v3.2.0)

**Context:** We are preparing for Phase 44 (Bridge Sovereignty), but the **Sovereign Manifest Engine** requires its "Control Upgrade" to enable direct world manipulation. Additionally, a new permanent mandate has been added to `CLAUDE.md`.

**Objective:** Transform the Gauntlet Engine into a "Motor Cortex" and implement Ability Shards for the current stabilization/control cycle.

---

## ⚡ PERMANENT MANDATE (CLAUDE.md)
**Sovereign Shards (CRITICAL):** ALL implementation phases MUST include a corresponding "Ability Shard" (`scripts/gauntlet/phases/*.ts`) to enable live-fire verification and manifest control.

---

## 🔍 TASK 1: THE CONTROL UPGRADE
1. **Expand `GauntletContext`:** Update `scripts/gauntlet/types.ts` and `engine.ts` to include:
   - `vsb.send(pkt: Buffer)`: UDP dispatch to Node A.
   - `bridge.runScript(js: string)`: CDP evaluation via `SOVEREIGN_BRIDGE`.
   - `cli.execute(cmd: string)`: Shell execution for `crush-cli`.
2. **Implement `manifest()` Hooks:**
   - Migrate **Resolve Attack** logic to `mech-block.ts` (Phase 13).
   - Migrate **Friction Roll** logic to `mech-block.ts` (Phase 40).
   - Migrate **Neural Shroud** logic to `vis-block.ts` (Phase 16).

---

## 🛠️ TASK 2: PHASE-SPECIFIC LIVE SHARDS (43 - 46)
Implement/Update shards to satisfy the new mandate for current work:
- **Phase 43 (Stabilization):** Ensure `data-43.ts` correctly verifies RKG hierarchy and can trigger `reconstruct-palace.sh`.
- **Phase 44 (Bridge Sovereignty):** Create `scripts/gauntlet/phases/motor-cortex.ts` to verify the new `create_actor` and `run_script` WebSocket handlers.
- **Phase 44.5 (The Sovereign Shroud):** Add Shroud integrity checks to `vis-block.ts` (Scanline transparency, VT323 rendering).
- **Phase 45 (Governance Duel):** (Skeleton) Define the shard that will eventually verify manual conflict detection.

---

## 📊 TASK 3: UNIFIED LOGGING & OBSERVABILITY
1. **Enhance `src/shared/logger.ts`:**
   - Implement `audit()` and `manifest()` structured logging methods.
2. **Bridge Error Overlay:**
   - Implement `showErrorOverlay` in `50v3r31gn-bridge.js`.
   - Ensure the Bridge captures and reports window-level JS errors back to Node B.
3. **Engine Integration:**
   - Update `engine.ts` to stream its results via the unified `logger`.

---

## 📖 REFERENCES
- **Consolidated Plan:** `docs/superpowers/plans/2026-04-12-sovereign-manifest-engine-consolidated.md`
- **Visual Spec:** `docs/superpowers/specs/2026-04-12-sovereign-shroud-design.md`
- **Logic Source:** `scripts/synthetic-gauntlet.ts`
- **Directives:** `CLAUDE.md`

**Verification:** Run `npm run gauntlet` and ensure all active phases (0-44) are VERIFIED and MANIFEST-READY.

*Directive Issued by Gemini CLI (Strategist).*
