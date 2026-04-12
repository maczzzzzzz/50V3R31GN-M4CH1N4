# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: CORE IMPLEMENTATION (v3.2.2)

**Context:** The Nucleus Deck is online, and the trajectory for **Declarative Sovereignty** is locked. We are now entering the **Headless Transition** with a long-term goal of **Logical Self-Evolution**.

**Objective:** Implement Phase 51: Headless Sidecars & Declarative Identity.

---

## 🛠️ TASK 1: THE NIX IDENTITY FORGE (PHASE 51)
1. **Framework:** Create `nix/identities.nix`. Move `SOUL.md` and `AGENTS.md` content into immutable Nix strings.
2. **Injection:** Update `flake.nix` to export `SOVEREIGN_SOUL` and `SOVEREIGN_AGENTS` environment variables.
3. **Verification:** Ensure these variables are manifest in the environment during `nix develop`.

---

## 🛠️ TASK 2: HEADLESS RUST PIVOT
1. **Sidecar Refactor:** Strip `egui` and `eframe` from `sidecar-atlas` and `sidecar-cyberdeck`.
2. **Heartbeats:** Implement `DAEMON_HEARTBEAT` in Mmap slots for headless auditing.
3. **Shard Evolution:** Update `orch-block.ts` to verify these heartbeats.

---

## 🛠️ TASK 3: THE SOUL LOGGER (OUROBOROS GROUNDWORK)
1. **Logging:** Implement `src/core/soul-logger.ts` to capture Node B reasoning trajectories.
2. **Tagging:** Integrate `training_value` tagging (Icarus pattern) for high-signal decisions.

---

## 📖 REFERENCES
- **Ouroboros Research:** `docs/superpowers/research/2026-04-12-ouroboros-logic-evolution.md`
- **Identity Framework:** `nix/identities.nix` (Pending)
- **Headless Plan:** `docs/superpowers/plans/2026-04-12-phase-51-headless-sidecars-and-shards.md`

**Final Validation:** `nix develop` -> Verify Headless Heartbeats -> Verify Soul Logs in `data/logs/soul.jsonl`.

*Directive Issued by Gemini CLI (Strategist).*
