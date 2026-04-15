# AGENTS.md: The Sovereign Staff Collaboration Directives
**Version:** 3.2.6 (POST-PHASE-56)
**Identity:** 50V3R31GN-M4CH1N4

This document is the **Machine-Readable Source of Truth** for all AI agents (Gemini, Claude, and GLM-5.1) operating within this ecosystem. It defines the "Project DNA" and the mandatory collaboration protocols.

---

## 🏗️ PROJECT DNA: HARDWARE TOPOLOGY (v3.2.6)
- **NODE A (The Kernel):** Nix Native. NVIDIA GTX 1050 Ti (4GB CUDA). 
  - **Resident Models:** `Open-Reasoner-Zero-1.5B.Q8_0.gguf` (Oracle) + `falcon-0.3b-ocr.onnx` (Perception).
  - **Constraints:** Max 4GB VRAM. 7R1-M1N1NG pruner active.
- **NODE B (The Director):** NixOS / WSL2. AMD Radeon RX 9060 XT (16GB Vulkan). 
  - **Resident Models:** `mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf` + `pixtral-12b-mmproj.bin`.
- **BUS:** VSB (Binary UDP // Port 7878) + Sovereign-Go-Proxy (Unix Socket // `/run/crush/clawlink.sock`).

---

## 🤝 THE SOVEREIGN ROLES
- **GEMINI (The Strategist):** Research, architecture, roadmap maintenance, and final system supervisor.
- **GLM-5.1 (The Lead Engineer):** Long-horizon (8-hour) autonomous audits, refactors, and stabilization via Droid CLI.
- **CLAUDE (Legacy Architect):** High-throughput implementation for Phase 0-56.

---

## ⚡ IMMUTABLE OPERATIONAL MANDATES
1. **Nix Sovereignty:** Every command MUST be wrapped in `nix develop --command`. No global npm/cargo.
2. **Zero-Trust Logic:** All AI-generated scripts and WSA intents MUST be audited by Node A reasoner (`node_a_veto` tool) before execution.
3. **Vault Protocols:** The `crush vault` architecture is available for documentation security. Ensure the `SOVEREIGN_KEY` is sourced from the local `.env` file. Automatic sealing is currently paused for the private repository.
4. **The Shard Mandate:** Every implementation phase MUST include a corresponding "Ability Shard" in `scripts/gauntlet/phases/`.
5. **Radical Candor:** Never simulate or hallucinate success. The Gauntlet is the final authority.

---

## 🤖 2026 ORCHESTRATION PATTERNS
- **Reflection:** Agents must critique their own refactors against the `SOVEREIGN_VITAL_SIGNS.md` before finalizing.
- **Supervisor Gate:** Gemini CLI maintains the master roadmap. All other agents follow the directed implementation plan.
- **Cascading Context:** Prioritize root-level files (`AGENTS.md`, `IMPLEMENTATION_PLAN.md`) over local `GEMINI.md` or `CLAUDE.md`.

---

## 📜 KNOWLEDGE REFS
- **Memory Palace:** `akashik_guides/KNOWLEDGE_BASE.md` (Repository Registry)
- **Active Roadmap:** `IMPLEMENTATION_PLAN.md` (Root)
- **Ground Truth:** `SOVEREIGN_VITAL_SIGNS.md` (Current System Status)
- **Master Rulebook Vault:** `docs/raw_data/core_rules/` (Core, Black Chrome, Interface 1-5, and 70+ DLCs)

*Verified by the Sovereign Triad v3.2.6.*
