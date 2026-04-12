# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.2)

**Context:** The Nucleus Deck is online. We are now implementing the **Intelligence Infrastructure** (mined from Hermes and NousResearch) to provide a solid foundation for the campaign engine.

**Objective:** Implement Phase 51: Sovereign Foundation.

---

## 🛠️ TASK 1: DECLARATIVE IDENTITY (NIX-HERMES PATTERN)
1. **Framework:** Create `nix/identities.nix`. Move `SOUL.md` and `AGENTS.md` content into immutable Nix strings.
2. **Injection:** Update `flake.nix` to export these as `SOVEREIGN_SOUL` and `SOVEREIGN_AGENTS` environment variables.
3. **Persistence:** Add a `shellHook` to manifest these files on entry.

---

## 🛠️ TASK 2: SOVEREIGN PULSE (MONITORING PATTERN)
1. **Heartbeat:** Implement `scripts/dev/sovereign-pulse.ts`.
2. **Observability:** Create a cron-driven background service that updates `VITAL_SIGNS.md` in the Obsidian vault with GPU/CPU/VSB metrics.

---

## 🛠️ TASK 3: GAUNTLET EVOLUTION (HEADLESS AUDIT)
1. **Heartbeats:** Implement `DAEMON_HEARTBEAT` in headless sidecars via Mmap.
2. **Audit:** Update Gauntlet shards to verify heartbeats instead of window handles.

---

## 📖 REFERENCES
- **Foundation Spec:** `docs/superpowers/specs/2026-04-12-cl4w-unification-design.md`
- **Logic Research:** `docs/superpowers/research/2026-04-12-ouroboros-logic-evolution.md`
- **Hermes Mapping:** `docs/superpowers/research/2026-04-12-hermes-cl4w-unification.md`

**Final Validation:** `nix develop` -> Verify Vitals in Obsidian -> Run `npm run gauntlet` -> 100% PASS.

*Directive Issued by Gemini CLI (Strategist).*
