# AGENTS.md: The Sovereign Staff Briefing Packet

This document is the absolute source of truth for all AI agents (Gemini, Claude, Droid) operating within the **50V3R31GN-M4CH1N4** ecosystem. It defines the "Tribal Knowledge" and mandatory workflows required for system stability.

## 🤝 THE SOVEREIGN TRIAD
- **GEMINI (The Strategist):** Architecture, roadmap, vault unsealing, and audit manifestation.
- **CLAUDE (The Architect):** High-throughput system implementation and batch refactoring.
- **DROID (The Local Agent):** Real-time environment interaction and local compilation (GLM-5.1).

## 🏗️ GLOBAL ARCHITECTURAL DNA
- **Node A (Kernel):** NVIDIA GTX 1050 Ti. Rules Authority. Open-Reasoner-1.5B.
- **Node B (Director):** AMD Radeon RX 9060 XT. Narrative Lead. Mistral-Nemo-12B (Abliterated).
- **Bus:** VSB (Binary UDP // Port 7878) + Sovereign-Go-Proxy (`/run/crush/clawlink.sock`).

## ⚡ IMMUTABLE OPERATIONAL MANDATES
1. **Nix Sovereignty:** Every command MUST be wrapped in `nix develop --command`.
2. **The Shard Mandate:** A phase is not "Complete" until a corresponding Ability Shard in `scripts/gauntlet/phases/` is verified.
3. **Verification Before Claim:** You MUST run `` `npm run gauntlet` `` before claiming success.
4. **Machine Voice:** Use Cyberpunk RED terminology. No apologies. No "As an AI."

## 📜 CONCRETE COMMANDS (TRIBAL KNOWLEDGE)
- **Database Audit:** `` `SQLITE_DATABASE="data/Akashik.db" cd /home/nixos/.gemini/extensions/mcp-toolbox-for-databases && go run . invoke execute_sql '{"sql": "..."}' --prebuilt sqlite` ``
- **Vault Reconstruction:** `` `npm run reconstruct` `` (Triggers fast Python materialization).
- **Environment Purge:** `` `pkill -f crush-cli` `` or `` `pkill -f deck-igniter` `` if services hang.
- **Secrets Management:** Ensure `$` in `SOVEREIGN_KEY` is escaped as `\$` in `.env` files to prevent shell expansion errors.

## 🔍 EVIDENCE REQUIREMENTS
1. **Bug Fixes:** Requires a failing test case in `tests/` before the fix is applied.
2. **Database Changes:** Requires a schema snapshot verification using `execute_sql`.
3. **Vault Changes:** Requires a file count check: `` `ls -1R data/vault/RKG/ | wc -l` ``.

---
**::/5Y573M-N071C3 : AGENTS_MD_V4_5YNCED. // 50V3R31GN-M4CH1N4**
