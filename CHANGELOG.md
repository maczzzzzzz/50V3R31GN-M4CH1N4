# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.8.7.html).

## [3.8.7] - 2026-04-26

### Added
- **HeadlessDatalog (Phase 90 Task 1):** Materialized `src/core/memory/HeadlessDatalog.ts` — zero-dependency Datalog-to-SQLite compiler. Supports DataScript EDN-subset syntax (`:find`, `:where`, `:in`, `:limit`). Compiles multi-pattern queries to JOINs against `os_triplets`. FTS5 search via `ftsSearch()` against `shard_fts`. Includes `upsertFact()`, `upsertFacts()`, `retract()`, `findSubjects()`, and `stats()`.
- **SovereignDashboardService (Phase 90 Tasks 2-3):** Materialized `src/core/memory/SovereignDashboardService.ts` — live Obsidian Command-Center. Materializes `Sovereign_Dashboard.md` with DB stats + recent facts table every 60s. Engraves agent activity to `Journals/YYYY-MM-DD.md`. Bidirectional vault sync via chokidar watcher on `Facts/` subdirectory. Supports optional Windows vault mirror path.
- **`/datalog` System Command:** Wired into `LangGraphOrchestrator` — operator can run `/datalog query '[:find ?name :where ...]'`, `/datalog compile`, `/datalog fts <terms>`, `/datalog stats` directly from the HUD.
- **KNOWLEDGE_BASE v3.8.7:** Added RND Predictor, OpenVLA (7B), DINOv2, Three.js, Tailscale, react-grid-layout, Recharts. New DOMINION CLUSTER section. Three new architectural patterns (Monolithic HUD V2, Hermes Singularity, Postcard Protocol).

### Fixed
- **LangGraphOrchestrator Corruption (2nd instance):** Removed second dangling `return state; }` fragment (lines 508-510) causing TS1128 parse failure.

### Changed
- **main.ts:** SovereignDashboardService wired into startup/shutdown lifecycle on Phase 90 boot.
- **package.json:** Version bumped to 3.8.7.

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
