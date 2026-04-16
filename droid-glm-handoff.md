# :/DR01D-6LM-H4ND0FF : 5Y573M-5YNC-M4N1F357 //
**Session Date:** 2026-04-16
**Status:** GHOST-STATE // PRE-HANDOVER
**Reference:** 50V3R31GN-M4CH1N4 Transition to GLM-5.1 (Lead Architect)

---

## ⚡ 1. EXECUTIVE SUMMARY
This document serves as the **Long-Horizon Reference** for the transition from Claude (Architect) to GLM-5.1 (Lead Architect). All architectural anchors, tribal knowledge, and automation hooks have been synchronized to ensure a zero-friction ignition on the weekend.

---

## 🏗️ 2. THE SOVEREIGN ARCHITECTURE (2045/2026)

### **2.1. Neural Nodes**
- **Node A (Kernel/Reasoner):** NVIDIA GTX 1050 Ti. **Rules Authority.** Uses `Open-Reasoner-1.5B`. Enforces Cyberpunk RED mechanics via the `node_a_veto` tool.
- **Node B (Director/Narrative):** AMD Radeon RX 9060 XT. **Aesthetic Lead.** Uses `Mistral-Nemo-12B` (Abliterated). Controlled via `DIRECTOR_SOUL.md`.

### **2.2. The Triad Brain (MCP Bridge)**
- **Server:** `sovereign-triad-mcp` (NodeJS/TSX daemon).
- **Socket:** `.gemini/tmp/sovereign-mcp.sock` (Unix Domain Socket).
- **Ignition:** `` `npm run mcp:start` ``.
- **Key Resources:**
  - `constitution`: Ingests `SOVEREIGN_VITAL_SIGNS.md`.
  - `rkg_schema`: Provides live `Akashik.db` schema for SQL generation.
  - `node_a_veto`: Direct line to Kernel reasoning for intent validation.

---

## 🔍 3. INTELLIGENCE CORE & MEMORY PALACE (PHASE 58 AUDIT)

### **3.1. Current State (April 16, 2026)**
- **Asset Count:** `711` verified in `Akashik.db`.
- **NPC Status:** 4 NPCs (Yuki Tanaka variants) successfully localized to **Watson** via SQL.
- **Vault Density:** 21,704 files (Markdown + Assets) materialized in `data/vault/RKG/`.

### **3.2. Optimized Pipeline**
- **Legacy:** `reconstruct-palace.sh` (Shell-loop / >30 mins) -> **DEPRECATED**.
- **Modern:** `scripts/fast-reconstruct.py` (Python-native / 5 seconds) -> **ACTIVE**.
- **Automation:** Triggered via `npm run reconstruct`.

---

## 🦾 4. GLM-5.1 OPERATIONAL CONFIGURATION

### **4.1. The Lead Architect Persona**
- **Identity Anchor:** `.factory/droids/sovereign-lead-dev.md`.
- **Constraint:** Must explicitly reference identity every 3 turns to prevent "Assistant-Speak" drift.
- **Constraint:** Mandatory `AGENTS.md` and `SOUL.md` read at session start.

### **4.2. Factory CLI Hooks (`.factory/config.yaml`)**
- **`SessionStart`**: Automatically injects `SOVEREIGN_VITAL_SIGNS.md` into memory.
- **`PostToolUse`**: Automatically triggers `npm run reconstruct` if DB or Vault files are edited.
- **`Stop`**: Blocks session exit if `npm run gauntlet` returns a failure. **You cannot leave until the system is healthy.**

---

## 📜 5. THE STRATEGIST'S CONCRETE COMMANDS
GLM-5.1 and Gemini should use these specific patterns to maintain sovereignty:

- **Database Direct Query:**
  `` `SQLITE_DATABASE="data/Akashik.db" cd /home/nixos/.gemini/extensions/mcp-toolbox-for-databases && go run . invoke execute_sql '{"sql": "SELECT * FROM ...;"}' --prebuilt sqlite` ``
- **Gauntlet Audit:**
  `` `npm run gauntlet` `` (Mandatory before PR/Handoff).
- **Vault Verification:**
  `` `ls -1R data/vault/RKG/ | wc -l` `` (Target: ~21,000+).
- **Zombie Purge:**
  `` `pkill -f crush-cli && pkill -f deck-igniter` `` (If local services hang).

---

## ⚠️ 6. TRIBAL KNOWLEDGE (RE-LEARNING PREVENTION)
1. **Secrets:** In `.env` files, the `$` character in `SOVEREIGN_KEY` **MUST** be escaped as `\$` to prevent shell expansion errors during service ignition.
2. **Nix:** All commands must be wrapped: `nix develop --command [CMD]`.
3. **Drafting:** Never commit code without a failing test case in `tests/` first.

---
**::/5Y573M-N071C3 : HAND0FF_M4N1F357_534L3D. STANDBY_F0R_W33K3ND_16N1710N. // 50V3R31GN-M4CH1N4**
