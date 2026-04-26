# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.8.7.html).

## [3.8.7] - 2026-04-26

### Added
- **Mobile Mesh Materialized (Phase 91):** Scaffolded `openclaw_bridge.dart`, `screen_capture_service.dart`, and `postcard_service.dart` in the Flutter HUD. Integrated native `MethodChannel` in Kotlin `MainActivity.kt`.
- **Native Android Control:** Scaffolded `SovereignAccessibilityService` and `accessibility_service_config.xml` for 100% semantic screen awareness.
- **Mobile Vision Artery:** Materialized `MobileVisionArtery.ts` (Node B) listening on Port 3013 for binary frame ingestion.
- **Postcard Protocol:** Materialized `PostcardIngestor.ts` and updated `SovereignIntelligence.db` with `mobile_postcards` schema for field reputation tracking.
- **Deportation Hardgate:** Materialized `MobileAuthService.ts` to enable Vesper-driven session revocation and audit logging.
- **Hermes Comms Ingress:** Scaffolded `NativeMessagingAdapter.ts` for autonomous WhatsApp/QQBot integration.
- **Social Intelligence Mesh (Phase 88):** Materialized `crates/sovereign-social` (ActivityPub relay) and `crush social` command. Implemented Socially-Weighted Retrieval (SWR) in `OsTripletService.ts` and Agent Avatars/Consensus Arcs in the 3D Neural Promenade.
- **Serpentine Artery (Phase 89):** Materialized `SteganoEncoder.ts` (Zero-width hidden proof) and `parseltongue.rs` (Token-encoded IPC). Hardened `sovereign-kernel` with TPM hardware-backed signing for agent activities.
- **HeadlessDatalog (Phase 90):** Materialized `src/core/memory/HeadlessDatalog.ts` — zero-dependency Datalog-to-SQLite compiler. Supports DataScript EDN-subset syntax.
- **SovereignDashboardService (Phase 90):** Materialized `src/core/memory/SovereignDashboardService.ts` — live Obsidian Command-Center with bidirectional fact ingestion and journal engraving.
- **Phase 86-93 Resilience Forge:** Scaffolded 8 new Gauntlet test phases (`v86` through `v93`) and the `AbilityStone_HermesAgent_v2026.md` intelligence boost.

### Fixed
- **System-Wide Artery Audit (Phase 94):** Performed surgical fixes across all 2026-04-26 documentation shards; standardized sector-prefixes (`SPEC_`, `PLAN_`, `RESEARCH_`) to prevent Logseq/Obsidian indexing collisions.
- **Kernel Vitals Restoration:** Refactored `sovereign-kernel` to run dual Tokio tasks for both `/proc` telemetry and TPM signing.
- **LangGraphOrchestrator Integrity:** Repaired catastrophic syntax fractures and type-desyncs in the Hermes routing layer and Dashboard interface.

### Changed
- **Obsidian 1st Class HUD:** Formally established Obsidian as the primary operator interface, physically purging the Logseq native plugin.
- **KNOWLEDGE_BASE v3.8.7:** Total integration of Hermes Atlas and Pretext research arteries.

## [3.8.6] - 2026-04-26

### Added
- **Flutter APK Materialized:** Cleared Build Hardgate via surgical `patchelf` of Android SDK cmake/ninja/NDK toolchain (38 ELF binaries) and `aapt2`; fixed `ic_launcher` mipmap generation. `app-release.apk` (50.1MB) shored.
- **Vivaldi Ingress Extension (Phase 87 Task 1):** Scaffolded `sidecar-browser-extension/` — `manifest.json` (MV3), `background.js` (persistent WS relay to port 3012, heartbeat, context-menu), `content.js` (page-load + selection push), `popup/` (Gruvbox HUD with bridge status and manual push).
- **Kernel Vitals Artery (Phase 87 Task 2):** Materialized `crates/sovereign-kernel` Rust crate — `vitals.rs` reads CPU/mem from `/proc/stat` + `/proc/meminfo` + PSI pressure files; `main.rs` streams `VitalsSnapshot` JSON via WebSocket on port 3013. Build: clean.
- **Browser Mesh Artery (Phase 87 Task 2.5):** Materialized `src/api/browser-bridge.ts` — WebSocket server on port 3012; routes `ContextFrame` pushes from the Vivaldi extension into the `LangGraphOrchestrator` ingest channel. Wired into `main.ts` startup/shutdown.
- **SkillAuthor (Phase 87 Task 3):** Materialized `src/core/plugins/SkillAuthor.ts` — converts successful `AgentTrajectory` records into `.ts` MCP tool files in `src/core/plugins/skills/` and registers them live into `PluginRegistry`.
- **Cargo Workspace Hardening:** Added `exclude` entries for `sidecar-browser-extension`, `sidecar-logseq-plugin`, `sidecar-obsidian-plugin` to prevent Cargo from scanning non-Rust sidecar directories.

### Fixed
- **LangGraphOrchestrator Corruption:** Surgically excised duplicate code fragment (`68.5: Trigger the asynchronous...`) that caused TS1005/TS1434 parse failures.

### Changed
- **package.json:** Added `build:sidecar:kernel` and `kernel` scripts; `build:sidecars` now includes sovereign-kernel.

## [3.8.5] - 2026-04-26

### Added
- **Social Highlight Reel:** Integrated a cross-platform "Featured Shards" view into Obsidian and Logseq native plugins; highlights highest-liked agent activities.
- **Vivaldi Ingress Research:** Updated browser perception specs to target the Vivaldi sidebar and tab-stacking architecture.
- **Visual Conscience:** Defined requirements for Agent Avatars and Trust Web visualization in the 3D Hall.
- **Serpentine Artery Research:** Materialized specifications for steganographic memory and kernel r00t hardware anchors (Phase 89).

### Changed
- **Knowledge Base v3.8.7:** Indexed 569 documents and shored links for ActivityPub and Vivaldi Mastodon.

## [3.8.4] - 2026-04-26


### Added
- **Universal Document Indexer:** Refactored `index-shards.ts` to recursively scan all superpower arteries (Research, Plans, Specs). Indexed 987 documents into `SovereignIntelligence.db` with FTS5 search.
- **Logseq Artery (Go):** Materialized `crush logseq` bridge for direct atomic block manipulation of the Windows Logseq app via HTTP API.
- **Dynamic Tree Forge:** Implemented Go-native generation of `PLAN_TREE.md`, `SPEC_TREE.md`, and `RESEARCH_TREE.md` ensuring zero orphaned docs.
- **Exhaustive Dev Infrastructure:** Materialized `crush dev` suite for forcing deadlocks, dream cycles, and swarm simulations.

### Changed
- **Absolute Vault Purity:** Enforced hard-gate recursive cleanse in `crush reconstruct`. Purged binary `.pdf` research, NTFS metadata, and root-level manifest noise from `D:\Obsidian_Sovereign_OS`.
- **System Sociotomy:** Formalized strict separation between Technical OS Vault and Lore RKG Vault.
- **AppFlowy Purge:** Legacy AppFlowy cloud infrastructure and guides completely shriven from the mesh.

## [3.8.2] - 2026-04-26

### Added
- **Host-Mesh Artery (Phase 81):** Materialized the Go-native Windows sidecar (`sovereign-host.exe`) with VSB UDP listener on port 7878.
- **Blackout Shroud Implementation:** Shored visual redaction logic in the host sidecar to mask protected source code windows (`Code.exe`, `Terminal.exe`).
- **FS Gate (Option C):** Enforced Zero-Trust filesystem boundaries with autonomous R/W in `/scratch/` and Vesper-gated deletion/traversal.
- **Tiered Web Ingress:** Materialized `WebScraperSidecar.ts` implementing the 3-Tier model (Comms/Media/Research) with high-fidelity Markdown distillation.
- **Hermes /host Routing:** Integrated direct host command dispatch into the `LangGraphOrchestrator`, bridging the Flutter HUD to the Windows host.

### Fixed
- **Gauntlet Gap:** Materialized `v81-host.ts` to provide 100% regression protection for the host-bridge and visual redaction arteries.

## [3.8.1] - 2026-04-25

### Added
- **Node C Model Farm Orchestration:** Refactored `hermes-router` to dynamically select between Q3 (8081), Q4 (8082), and Q5 (8083) model shards based on profile `inference_preference`.
- **OpenClaw v3.8.7 Integration:** Staged ports for Hybrid Search Transparency, OTEL Trace Correlation, and MCP Loopback Hardening.
- **Tactical Terminal:** Materialized a dedicated **[TERM]** navigation tab in the Flutter HUD for real-time passive VSB monitoring.
- **Command Priming:** Implemented structured JSON command dispatch in the Artery Client, preparing the mesh for Windows Host Control.

### Fixed
- **VSB Port Desync:** Corrected VSB frequency from 9090 (WebSocket) to 7878 (UDP Binary) in the mobile HUD.
- **Ignition Hardening:** Implemented `ZOMBIE_CHECK` in `ignite-all.sh` to ensure port sovereignty before daemon startup.

## [3.8.0] - 2026-04-25

### Added
- **Sovereign Hall (Phase 80):** Materialized the autonomous agent collaboration space. 
  - `SovereignHall.tsx`: 2.5D Isometric visualization of agent swarms.
  - `crush meeting`: CLI controller for forced deadlock resolution.
- **Vesper Enforcer:** Empowered Vesper with the `FailureTracker` to force mandatory Hall meetings on 3rd agentic failure.
- **Ouroboros Loop:** Integrated failure pattern reflection into the nightly Dream Cycle for automated logic vaccination.

<details>
<summary>Historical Archive (Older Versions)</summary>

... [Legacy versions preserved in master history] ...

</details>


---
**LINKS:** [[OS_CORE]]
