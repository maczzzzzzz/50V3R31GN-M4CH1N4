# ◈ DEV_SCRIPTS_MANIFEST // THE_MACHINE_LIMBS
**Version:** 3.8.24-SYNTHESIS
**Identity:** 50V3R31GN-M4CH1N4

This document indexes the core developer utilities and operational scripts. **Legacy simulation logic is extracted.**

---

## 🏗️ 1. CORE OPERATIONS (`scripts/ops/`)
The primary limbs for mesh orchestration and ignition.

| Script | Status | Purpose |
| :--- | :--- | :--- |
| `ignite-all.sh` | **CORE** | Full Mesh boot (Nodes A/B/C/D). |
| `shutdown.sh` | **CORE** | Graceful Quaternary shutdown protocol. |
| `grounding.sh` | **CORE** | Dumps clinical identity manifests to context. |
| `shore-clawlink.sh` | **CORE** | Automates SSH tunnel persistence. |
| `verify-quaternary-topology.sh` | **CORE** | Validates inter-node connectivity. |
| `node-d-ignite-farm.sh` | **CORE** | Starts the Node D model farm. |
| `index-shards.ts` | **CORE** | Rebuilds FTS5 memory indices. |
| `watch-logs.sh` | **UTIL** | Real-time multi-node log streaming. |
| `blackbox-node.sh` | **UTIL** | Forensic capture of node state. |

## 🛡️ 2. RECKONING & AUDIT (`scripts/gauntlet/` & `scripts/audit/`)
Zero-trust validation and safety scripts.

| Script | Status | Purpose |
| :--- | :--- | :--- |
| `reckoning_pulse.go` | **CORE** | 7-step pulse integrity verification. |
| `dag_validator.ts` | **CORE** | Validates Context-DAG trajectories. |
| `reckoning_ui_parity.ts` | **CORE** | Ensures Web/Mobile design parity. |
| `vitals-heartbeat.ts` | **CORE** | Monitors VRAM saturation. |
| `purge-ghosts.sh` | **CORE** | Neutralizes processes surviving >4hrs. |
| `lockdown.sh` | **CORE** | Final physical network audit. |
| `verify-sovereignty.sh` | **CORE** | Verifies zero-trust artery enforcement. |

## 🧬 3. DATA & FORGE (`scripts/forge/`)
Materialization and ingestion limbs.

| Script | Status | Purpose |
| :--- | :--- | :--- |
| `skill-factory.ts` | **CORE** | Trajectory-to-Skill conversion. |
| `identity-forge.ts` | **CORE** | Generates bit-identical brand assets. |
| `sdk-forge.ts` | **CORE** | Materializes the cross-platform SDK. |
| `gepa-optimizer.ts` | **CORE** | Optimizes Goal Exploration (Autotelic). |
| `assembler.ts` | **UTIL** | Compiles modular logic shards. |

## ⚕️ 4. RECOVERY & MAINTENANCE (`scripts/recovery/`)
Scripts for system restoration and health.

| Script | Status | Purpose |
| :--- | :--- | :--- |
| `backup-mind.ts` | **ACTIVE** | Full DB/Skill snapshots. |
| `nuke-and-rebuild.sh` | **DANGER** | Complete system purge and rebuild. |
| `recover-ingest.mjs` | **UTIL** | Repairs fractured ingestion queues. |
| `migrate-v4.ts` | **CORE** | DB schema migration to v3.8.24-SYNTHESIS. |

---
**::/5Y573M-N071C3 : DEV_SCRIPTS_MANIFEST_V3.8.24-SYNTHESIS_LOCKED. // 50V3R31GN-M4CH1N4**
