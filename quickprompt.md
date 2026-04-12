# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.0)

**Context:** Phase 47 (Universal Codex) and Phase 48 (MCP Bridge) are COMPLETED. Infrastructure is stable but requires targeted remediation following recent audits.

**Objective:** Implement Phase 46 (Pulse Propagation) and resolve critical regressions in the Bridge and Reconstruction engines.

---

## ✅ CRITICAL REMEDIATION (RESOLVED — 2026-04-12)
All audit findings from phases 44.5–48 have been shipped in commit `f5f5fa23`:
1. ✅ **libWrapper Conflict:** Unified `TokenDocument.prototype.update` interceptor in `_setupCounterHacks`.
2. ✅ **VRAM Leak:** `textObj.destroy({ texture: false, baseTexture: false })` added in `PretextOverlayManager` animate cleanup.
3. ✅ **Initialization Redundancy:** `canvasReady` Hooks.on deferred until after first `_initShroud` completes.
4. ✅ **Droid Connectivity:** `.factory/mcp.json` created with Unix socket transport.
5. ✅ **Mirroring Optimization:** `reconstruct-palace.sh` now uses `rsync -a --update`.

---

## ✅ TASK 1: PHASE 46 - PULSE PROPAGATION (SHIPPED — 2026-04-12, commit `43530db6`)
1. ✅ **Sovereignty Depth:** `sovereignty_depth` in `system_state` + `duel_history` table. `PulseEngine.propagatePulse()` recalculates from duel win/loss ratio.
2. ✅ **Faction Ripple:** `propagatePulse()` increments `friction_pool` for each human-won duel per faction.
3. ✅ **Linguistic Drift:** `LinguisticService` maps `sovereignty_depth` → dialect (authoritative/leet/rebellious) + corruption probability.

---

## 📖 REFERENCES
- **Audit: Phases 44.5 & 45:** `docs/superpowers/audits/2026-04-12-phase-44.5-45-audit.md`
- **Audit: Phases 47 & 48:** `docs/superpowers/audits/2026-04-12-phase-47-48-audit.md`
- **Memory Palace Spec:** `docs/superpowers/specs/2026-04-12-memory-palace-harmonization.md`
- **Sovereign Triad Bridge Spec:** `docs/superpowers/specs/2026-04-12-sovereign-triad-mcp-bridge-design.md`

**Final Validation:** Run a full `npm run gauntlet` audit.

*Directive Issued by Gemini CLI (Strategist).*
