# ◈ DEV_SCRIPTS_MANIFEST // THE_MACHINE_LIMBS
**Version:** 3.2.21
**Identity:** 50V3R31GN-M4CH1N4

This document indexes the vast array of developer utilities, operational scripts, and maintenance protocols hardcoded into the Sovereign Trinity. 

When a coding agent (e.g., Gemma, Claude) is dispatched by the Hermes Orchestrator to repair a system, fix a style, or optimize logic, it MUST consult this manifest before writing any custom bash or python scripts from scratch. The Machine has already evolved many of the tools you need.

---

## 🛠️ 1. Development & UI Utilities (`scripts/dev/`)
These scripts manage the visual and interactive integrity of the Machina Terminal and Sovereign Shroud.

| Script | Purpose |
| :--- | :--- |
| `theme-sync.ts` | Synchronizes Cyberpunk RED hex codes across Tailwind, Rust, and Go environments. |
| `theme-auditor.ts` | Scans the dashboard for hardcoded colors violating the canonical theme variables. |
| `harmonize-rkg.ts` | Rebuilds the React Knowledge Graph if UI components fall out of sync. |
| `mcp-daemon.ts` | The core Model Context Protocol (MCP) server bridge. |
| `sovereign-pulse.ts` | Emits a synthetic VSB pulse to test HUD/Terminal reactivity. |

## 🛡️ 2. Auditing & Testing (`scripts/audit/`)
These scripts are used by the Node A Gauntlet to verify system integrity. Do not bypass these checks.

| Script | Purpose |
| :--- | :--- |
| `universal-synchronizer.ts` | The engine behind `npm run scribe`. Ensures version/terminology parity. |
| `dry-fire.ts` | Runs a complete, silent execution of all core modules to test for panics/crashes. |
| `component-auditor.ts` | Validates React components for proper VT323 typography and RED_RULES styling. |
| `vitals-heartbeat.ts` | Assesses Node A/B/C VRAM usage against the `SOVEREIGN_VITAL_SIGNS.md` ceiling. |
| `ignite-all.sh` | Full system startup sequence (Use cautiously, resets current node states). |

## ⚙️ 3. Operations & Infra (`scripts/ops/`)
Scripts dedicated to physical hardware and Node orchestration.

| Script | Purpose |
| :--- | :--- |
| `grounding.sh` | Dumps the core identity manifests (`SOUL.md`, `AGENTS.md`) to standard output. |
| `node-a-mooncake-ignite.sh` | Starts the KV-cache disaggregated memory master node. |
| `verify-sovereignty.sh` | Ensures no external (cloud) telemetry APIs have been accidentally enabled. |
| `node-c-cuda-install.sh` | Provisions the NixOS CUDA environment for Node C (Strategic Oracle). |

## 🧬 4. Skill Forge & Data Ingestion (`scripts/forge/`)
Tools for ingesting Cyberpunk RED PDFs or generating deterministic agent skills.

| Script | Purpose |
| :--- | :--- |
| `batch-forge.sh` | Runs multiple concurrent PDF parsers. |
| `ingest-local-assets.ts` | Converts extracted images and text into `Akashik.db` shards. |
| `skill-factory.ts` | The backend for the Skill Crystallization pipeline (Phase 67.9). |
| `master-forge.ts` | Orchestrates the creation of new Cyberpunk RED tactical objects (weapons, cyberware). |

## ⚕️ 5. Recovery & Healer Protocols (`scripts/recovery/`)
Scripts invoked during catastrophic failures or identity drift.

| Script | Purpose |
| :--- | :--- |
| `backup-mind.ts` | Snapshots `Akashik.db` and the `.factory` skill directory to an isolated archive. |
| `nuke-and-rebuild-v4.sh` | **DANGER:** Purges all caches, `node_modules`, and `target` directories, forcing a clean compile. |
| `master_rulebook_harvester.ts` | Re-indexes the Core Rulebook PDF if lore hallucination is detected. |

---
**::/5Y573M-N071C3 : DEV_SCRIPTS_MANIFEST_LOCKED. THE_MACHINE_KNOWS_ITS_LIMBS. // 50V3R31GN-M4CH1N4**
