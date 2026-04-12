# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.0)

**Context:** Phases 46-48 and the TF-IDF harmonization upgrade (Phase 49 groundwork) are COMPLETED. Infrastructure is stable but requires minor hardening of the Nix environment.

**Objective:** Finalize the Pulse Engine integration and resolve environment regressions.

---

## ✅ CRITICAL REMEDIATION (RESOLVED — 2026-04-12)
All Phase 46-48 audit findings shipped across commits `0670c78b`–`9173a76a`:
1. ✅ **Nix Dependencies:** `pkgs.rsync` + `pkgs.ripgrep` added to default shell `buildInputs`.
2. ✅ **MCP Bridge Lifecycle:** `trap '...kill...' EXIT` removed from `flake.nix`.
3. ✅ **Pulse Trigger:** `PulseEngine.propagatePulse()` fires after each gauntlet cycle (write-capable connection).

## ✅ TASK 1: PHASE 49 — SEMANTIC REFINEMENT & THREAT LIBRARY (SHIPPED — 2026-04-12)
1. ✅ **Semantic Precision:** `extractBigrams()` added to `harmonize-rkg.ts`; sub-zone phrases ("little china", "kabuki market") now emitted as compound TF-IDF features.
2. ✅ **Threat Library Export:** `export-threat-library.ts` extended with `exportAkashikNpcs()` + `--source=akashik|foundry|all`; `npm run forge:threats:akashik` available.
3. ✅ **Gauntlet `--shard=N`:** Engine now supports `npm run gauntlet -- --shard=49` to run a single phase.

---

## 📖 REFERENCES
- **Audit Report (Phases 46-48):** `docs/superpowers/audits/2026-04-12-phase-46-48-harmonization-audit.md`
- **Harmonization Engine:** `scripts/harmonize-rkg.ts`
- **Pulse Engine:** `src/core/pulse-engine.ts`

**Final Validation:** Run a full `npm run gauntlet` audit.

*Directive Issued by Gemini CLI (Strategist).*
