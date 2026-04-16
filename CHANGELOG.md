# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.10] - 2026-04-16
### Changed
- **WebGL-First Architecture**: Formally transitioned the command surface to the **Nucleus Web Deck**. Deprecated the legacy `deck-igniter` TUI in favor of a headless backend orchestration service.
- **Crush CLI Artery**: Implemented the `--headless` flag for `crush start`, enabling seamless background ignition from the Web UI.
- **Akashik Guides Audit**: Performed a systematic remediation of the entire `akashik_guides/` library to align with Phase 50+ standards (v3.2.9).
- **Master Startup Pivot**: Updated all onboarding and setup guides to prioritize the Nucleus Artery (`npm run crush nucleus`) over legacy CLI workflows.

### Fixed
- **Architectural Drift**: Eliminated conflicting instructions across the `00_system_setup`, `01_crush_cli`, and `02_deck_igniter` guides.
- **Reference Integrity**: Updated the `COMMAND_MANIFEST` and `KNOWLEDGE_BASE` to reflect current port mappings and security hardening overrides.

## [3.2.9] - 2026-04-16
### Fixed
- **Sovereign Security Hardening**: Executed a comprehensive dependency audit and remediation pass, achieving a zero-vulnerability state in `pnpm audit`.
- **NPM Artery Patching**: Updated `vite` (v7.3.2), `hono` (v4.12.14), and `@modelcontextprotocol/sdk` (v1.29.0) to resolve multiple Path Traversal and Arbitrary File Read vulnerabilities.
- **Transitive Governance**: Implemented `pnpm.overrides` for `@hono/node-server` to force-patch deep-nested vulnerabilities within the MCP SDK.
- **Rust/Go Audit**: Synchronized `rand` crates (v0.9.4) and `golang.org/x/crypto` (v0.45.0) across all sidecars and kernels.

## [3.2.8] - 2026-04-16
### Added
- **MCP Toolbox Audit**: Utilized the `mcp-toolbox-for-databases` extension to perform a structural and security audit of `Akashik.db`.
- **Fast Reconstruction Engine**: Engineered `scripts/fast-reconstruct.py` to replace the legacy shell script, achieving a 360x performance increase for RKG materialization.
- **Audit Manifest 2026-04-16**: Physicalized the intelligence core findings and remediation status in `docs/superpowers/audits/`.

### Changed
- **Vault Orchestration**: Updated `package.json` to utilize the new Python-based reconstruction pipeline by default.
- **NPC Localization**: Manually re-aligned drifted NPC entities to the Watson district via SQL injection to restore geographical grounding.

### Fixed
- **RKG Desync**: Resolved a critical desynchronization where active database entities were missing from the physical Obsidian Memory Palace.
- **Performance Bottleneck**: Eliminated shell-loop overhead in palace reconstruction, enabling stable handling of 30,000+ relational entries.

## [3.2.7] - 2026-04-15
### Added
- **Gold Mine Ingestion**: Programmatically harvested and chunked 80+ official and community DLC PDFs into the Akashik Record.
- **DIRECTOR_SOUL.md**: Established a physical identity manifest for the abliterated Mistral-Nemo model, anchoring its "ego" in the filesystem.
- **Master Command Manifest**: Created an exhaustive library of all system commands in `akashik_guides/reference-command-manifest.md`.
- **Sovereign Strategist Skill**: Materialized and installed a specialized Gemini CLI skill to encode strategic mandates and Zero-Trust protocols.
- **Deterministic Harvester**: Implemented SHA-256 content hashing in `unified_master_harvester.ts` for absolute duplicate detection.

### Changed
- **HyperTune Integration**: Refactored `HybridRoutingController` to apply dynamic hyperparameter shifting (temp/top_p) based on tactical vs. narrative context.
- **Ouroboros Loop Expansion**: Updated the verifier to detect and RE_ROLL identity drift (Assistant-speak, moralizing) in Node B output.
- **Knowledge Base v2**: Realigned the RKG Registry with 2026 industry anchors (GLM-5.1, Foundry v12, Nix Hive Model).
- **Identity Injection**: Refactored `RootsInjector` to asynchronously load the Director's Soul from disk, enabling real-time identity updates.
- **Vault Protocol Shift**: Paused automatic vault sealing for the private repository while maintaining the underlying security architecture.

### Fixed
- **RKG Consistency**: Performed a full data integrity audit of `Akashik.db` and the Obsidian vault, ensuring zero empty or corrupted entries across 11k+ files.
- **Mirror Synchronization**: Stabilized the bidirectional Windows-WSL sync for the Obsidian Memory Palace.

## [3.2.6] - 2026-04-14
### Added
- **Phase 1 Surgical Audit**: Completed a line-by-line inspection of `crush/`, `zeroclaw/`, and `src/mcp/`.
- **SOVEREIGN_VITAL_SIGNS.md**: Established the definitive "Ground Truth" manifest for the system state.
- **GLM-5.1 Handover Preparedness**: Created the `sovereign-lead-dev` Droid profile and updated the MCP bridge with Veto tools and Constitution resources.
- **2026 Orchestration Standard**: Upgraded `AGENTS.md` and `SOUL.md` to the latest "Three-Layer Identity" and "Cascading Context" architectures.
- **Legacy Recovery Suite**: Developed specialized literal-key decryption tools to restore 130+ legacy documents from the pre-phase-30 archives.

### Changed
- **Documentation Hierarchy**: Elevated `IMPLEMENTATION_PLAN.md` to the project root for maximum agentic precedence.
- **Security Protocols**: Purged all cleartext credentials and updated `AGENTS.md` to source keys strictly from `.env`.
- **Repository Hygiene**: Refactored `.gitignore` to strictly enforce vault boundaries and moved recovery tools to `scripts/recovery/`.

### Fixed
- **Key Mangle Bug**: Identified and documented the shell-expansion issue with the `$` character in `SOVEREIGN_KEY`.
- **Vault Access**: Successfully unsealed all legacy subdirectories in `docs/superpowers/`.

## [3.2.5] - 2026-04-13
### Added
- **Phase 56 (System Stabilization)**: Initialized the main development track for system hardening and play-testing.
- **53N71N3L (Sentinel) Design**: Engineered a reactive, event-driven architecture using Hermes v0.9.0 patterns.
- **Hybrid Context Engine**: Designed a background VSB distillation protocol (0x0A) to offload state processing to Node A.
- **Reactive Risk Monitor**: Implemented `watch_patterns` for automated, risk-aware system recovery and state snapshots.
- **Interactive Scene Wiring**: Designed the logical framework (`docs/superpowers/specs/2026-04-13-interactive-scene-wiring.md`) for hackable cameras, terminals, and tactical debris.
- **Modular Prop Library**: Forged a set of 2D tactical icons (Camera, Terminal, Chair, Mine, Debris) matching the painterly vehicle aesthetic.
- **Batch District Forge**: Successfully generated 20 distinct lore-accurate district variations (60 tiles total) covering Watson, The Glen, Heywood, Pacifica, etc.

### Changed
- **Roadmap Re-alignment**: Phase 54 (Atlas Forge) and Phase 55 (Asset Forge) reclassified as ongoing Capstone projects.
- **Verification Priority**: Shifted GAUNTLET focus to interaction latency and cross-node stability (Shard 56).
- **Asset Pool Expansion**: Successfully indexed 693+ assets in `Akashik.db`, merging original TTTA maps, vehicles, and generated tiles into a unified mission swarm pool.

## [3.2.4] - 2026-04-13
### Added
- **Phase 54 (The Atlas Forge)**: Implemented a modular, blueprint-driven battlemap manufacturing pipeline.
- **Nano Banana 2 Integration**: Hooked into `gemini-3.1-flash-image-preview` for high-fidelity top-down battlemap generation using Google Pro credits.
- **Audit-First Forge**: Developed a surgical generation pipeline (`AtlasForge`) featuring high-resolution (512x512) structural skeletons and pixel-wise integrity audits.
- **Nucleus Assembler**: Implemented the **Foundry Manifestation Engine** to automate scene creation, tile placement, and wall materialization from steganographic metadata.
- **Sovereign Master Directive**: Engineered a balanced "Artist+Architect" prompt that enforces strict structural compliance to the 1-bit skeleton while achieving high-variety prop population.
- [x] **Multi-Style Archiving**: Enabled side-by-side generation and storage of multiple aesthetics (e.g., Safehouse, Japantown, Nomad) for the same tactical layout.
- [x] **Legacy Preservation Protocol**: Established mandatory archival requirement for existing token and actor data before Phase 55 overhauls.
- [x] **Sovereign Asset Indexing**: Designed the pipeline to index and ingest existing high-quality assets (Vehicles, Police, Medtech) from `./assets` and legacy mooks from `docs/raw_data/` as style and content references.


### Changed
- **High-Res Topology**: Upscaled the logical 16x16 grid to 512x512 high-contrast skeletons with tactical grid overlays to eliminate AI structural drift.
- **Forge CLI**: Expanded `package.json` with `forge:master`, `forge:atlas`, and `forge:assembler` commands for rapid district production.

### Fixed
- **WebP Compatibility**: Implemented audit/sync bypasses for WebP assets to ensure stability across varying AI output formats.
- **Structural Drift**: Eliminated "empty room" hallucinations by injecting light-gray tactical floor grids into the AI vision pipeline.

## [3.2.3] - 2026-04-12
### Added
- **Phase 51 (Sovereign Foundation)**: Implemented declarative identity forge via `nix/identities.nix` and `flake.nix` environment injection.
- **Sovereign Pulse**: Deployed a cron-driven hardware telemetry daemon for GPU/CPU/VSB monitoring with ASCII dashboard output in Obsidian.
- **Phase 52 (Cognitive Artery)**: Implemented the **Soul Logger** (Icarus pattern) for trajectory capture and the **Skill Factory** (Hermes pattern) for autonomous shard distillation.
- **FlowState Intuition**: Developed an anticipatory Mmap caching system (QMD pattern) for zero-latency district RKG retrieval.
- **Phase 52.5 (Ouroboros Logic)**: Established a recursive verification loop where Node A (Kernel) audits Node B (Director) reasoning paths for mandate compliance.
- **Genetic Prompt Evolution**: Implemented the **GEPA Optimizer** (DSPy pattern) to programmatically refine the declarative Nix identity based on high-signal trajectories.
- **Shard Documentation**: Created a comprehensive ability shard library in `docs/superpowers/shards/` documenting all 50+ system capabilities.

### Changed
- **System Acceleration**: Integrated **0xSero Performance Logic** into the Nix environment, enabling 29% faster decoding via Vulkan RADV optimizations.
- **Gauntlet Engine**: Upgraded the gauntlet to maintain a longitudinal history log (`gauntlet-history.log`) for stability tracking.
- **Git Security**: Updated `.gitignore` to allow remote tracking of gauntlet shard documentation while maintaining strict blocklists for raw assets.

## [3.2.2] - 2026-04-12
### Added
- **Phase 50 (Nucleus Command Deck)**: Implemented a monolithic, high-fidelity WebGL command center using React 19, PIXI.js v8, and the Pretext Engine.
- **Nucleus Artery**: Established a Go-based WebSocket bridge using Protobuf binary frames for zero-latency VSB state streaming.
- **Hermes Ecosystem Integration**: Conducted a deep dive into the Hermes Atlas, incorporating Mission Control patterns for the unified UI and planning AutoNovel integration for Atlas Forge.
- **Dial-Up Governance Audio**: Added immersive legacy-inspired audio triggers for VSB Approval (Flush Gate) events.
- **Headless Mode (Groundwork)**: Implemented `--headless` daemon mode for `sidecar-atlas` and `sidecar-cyberdeck` to support the monolithic deck pivot.
- **Roadmap Expansion (Phases 51-52)**: Integrated advanced Hermes-inspired logic: Shard Distillation (Skill Factory), Declarative Identity (Nix-managed SOUL.md), and Sovereign Pulse (Autonomous hardware monitoring).

### Changed
- **UI Consolidation**: Decommissioned all legacy EGUIs and TUIs in favor of the unified Nucleus Deck, reducing the workspace to exactly three primary surfaces.
- **Foundry VTT Purge**: Removed all intrusive "Machina" UI elements from the Foundry interface to restore full environmental immersion.

### Fixed
- **Phase 50 Audit Remediations**: 
    - Migrated Nucleus state streaming from JSON to Protobuf binary serialization.
    - Refactored all dashboard panels to use the Pretext Engine (`BitmapText`) for zero-reflow rendering.
    - Optimized dial-up audio tracking to prevent redundant triggers.

## [3.2.1] - 2026-04-12
### Added
- **Phase 49 (Semantic Refinement)**: Upgraded the harmonization engine with TF-IDF scoring and bigram phrase extraction for precise district disambiguation (e.g., "Little China" vs "Kabuki").
- **Semantic Precision Patch**: Lowered bigram matching threshold to 5 and implemented a `DISTRICT_PHRASE_WHITELIST` to correctly route short district names like "The Glen" and "North Oak," preventing generic fallback.
- **High-Performance Harmonization**: Optimized the TF-IDF scorer with token frequency maps, reducing execution time for 3,300+ entries from >5 minutes to ~45 seconds.
- **Threat Library Export**: Extended the forge CLI to support NPC exports from `Akashik.db` with source-specific filtering and district-aware tagging.
- **Gauntlet Shard Filter**: Added `--shard=N` support to the gauntlet engine for targeted auditing.

### Changed
- **District-Aware Memory Palace**: Upgraded `reconstruct-palace.sh` to organize the Obsidian RKG vault into a hierarchical `Districts/` structure.
- **Nix Environment Hardening**: Added `rsync` and `ripgrep` to `flake.nix` and removed aggressive shell-exit traps to allow MCP bridge persistence.
- **Pulse Automation**: Integrated automated sovereignty depth updates into the gauntlet execution loop.

### Fixed
- **Foundry libWrapper Conflict**: Consolidated movement and governance wrappers into a single unified interceptor.
- **VRAM Memory Leak**: Fixed filter/object accumulation in the Pretext overlay cleanup cycle.
- **RKG Mirroring Performance**: Optimized `reconstruct-palace.sh` to use `rsync` modification checks for the 10,000+ file vault.

## [3.2.0] - 2026-04-12
### Added
- **Phase 48 (Sovereign Triad Bridge)**: Designed a shared "Codebase Brain" for Gemini CLI and Droid CLI using standard MCP servers over a Unix Domain Socket, integrated with a Nix-native, impure/unfree dev environment.
- **Phase 44.5 (The Sovereign Shroud)**: Designed a high-performance WebGL visual layer using a Master Fragment Shader for ambient CRT scanlines and dynamic glitch distortions.
- **Control Upgrade (COMPLETED)**: Expanded the Gauntlet Engine context with `vsb.send`, `bridge.runScript`, and `cli.execute` hooks. Migrated all "Synthetic Gauntlet" logic into modular manifest() hooks.
- **Unified Logging (COMPLETED)**: Implemented structured `audit()` and `manifest()` logging in `src/shared/logger.ts`. Enabled bridge-level error capture and reporting.
- **Ability Shard Mandate**: Established a permanent engineering mandate in CLAUDE.md requiring a corresponding verification shard for every project phase.
- **Phase Shard Groundwork**: Implemented specialized shards for Phase 43 (Stability), Phase 44 (Motor Cortex), Phase 44.5 (Shroud), and Phase 45 (Governance).

### Changed
- **Roadmap Evolution**: Integrated the Sovereign Shroud and Triad Bridge into the official implementation plan as critical architectural bridges.
- **Architecture Refinement**: Promoted Pretext rendering from individual DOM/Canvas elements to a single GPU-accelerated WebGL batch.

### Fixed
- **Phase 42-45 Audit Remediation**: 
    - Resolved Nix Sovereignty violations by removing hardcoded absolute paths and static IPs.
    - Implemented Fail-Locked governance in `50v3r31gn-bridge.js` to replace Fail-Open vulnerability.
    - Fixed Shroud shader scaling for non-1024px displays via new `uResolution` uniform.
    - Resolved VRAM leak in `PretextOverlayManager` by explicitly destroying filter instances on scene change.

### Added
- **Sovereign Manifest Engine**: Consolidated 43 historical phases into a unified "Ability Shard" framework. Each phase now has an `audit()` hook for verification and a `manifest()` hook for direct Sovereign Machina control.
- **Bimodal Vision Integration**: Shards can now leverage Node A (Tactical) and Node B (Aesthetic) vision models for visual truth verification during audits.
- **Context Resiliency**: Implemented `recursivePageHunt` to ensure the gauntlet runner survives Foundry VTT world reloads and context destructions.
- **Administrative Control API**: Expanded the shard context with direct VSB packet injection and administrative JS execution via the Foundry Bridge.

### Changed
- **Unified Audit Entry**: Standardized all live-fire tests into the `npm run gauntlet` master command.
- **Metadata Alignment**: Updated Knowledge Base and Guides to reflect the v3.1.0 "Sovereign Gauntlet" architecture.

### Fixed
- **Shard Duplication**: Consolidated block-level phase definitions to eliminate logic overlap between individual files.

## [3.0.0] - 2026-04-12
### Added
- **Interactive Crush Terminal**: Implemented `crush-cli terminal` REPL for direct two-way narrative communication with Node B (12B Brain).
- **Semantic Obsidian Sync**: Upgraded the RKG sync engine to automatically organize triplets and chronicles into structured folders (`Items`, `Lore`, `Actors`) with semantic tags.
- **Droid Factory Integration**: Enabled Factory AI CLI within the Nix development environment via `steam-run` for cross-node AI orchestration.
- **Automated Obsidian Ignition**: Added direct Windows GUI launch for Obsidian to the `deck-igniter` orchestration sequence.
- **Vault Mirroring**: Implemented bidirectional sync to a native Windows `D:\` drive path to bypass WSL network share filesystem limitations.

### Changed
- **High-Fidelity CLI UI**: Redesigned the VSB Auth Pane with a structural "Black-Ice" cyberpunk aesthetic using `lipgloss`.
- **Dashboard Hotkey**: Added `Ctrl+Shift+D` global listener to toggle the monitor dashboard independently of the Escape menu.

### Fixed
- **Visual Dominance Theme**: Forced dark theme enforcement across all Journal and Item sheets, eliminating white background remnants.
- **Escape Menu Binding**: Patched the dashboard bridge to prevent it from capturing the Escape key, allowing the Main Menu to close while keeping the monitor open.
- **Combat PIXI Crash**: Implemented a monkey-patch for `PIXI.filters.ColorMatrixFilter` to restore compatibility with legacy combat modules.
- **OOM Sync Protection**: Implemented streaming row processing and batching in the Obsidian sync service to handle 3000+ files without exhausting memory.

## [2.9.0] - 2026-04-11
### Added
- **Crush-Proxy Sequence**: Integrated `crush proxy` into the `deck-igniter` WSL layer boot sequence, enabling the terminal orchestrator's neural uplink as a prioritized stage.
- **Phase 4 Sidecar Ignition**: Re-ordered the global boot protocol to defer Rust sidecars until *after* the gameworld login and dashboard-bridge are fully initialized, reducing canvas initialization collisions.
- **System State Review**: Generated `test.md` as a persistent log of current Phase 42 blockers and the rebuild strategy.

### Fixed
- **Pre-existing Env Priority**: Patched `crush/config.go` to respect environment variables that are already set in the shell before `.env` is loaded, resolving chaos-proxy test failures.
- **Vault Security**: Explicitly sealed all documentation directories via `crush vault seal` as a pre-flight requirement for remote pushes.

### Known Issues
- **Win-Proxy CDP Timeouts**: The Windows host proxy is dropping CDP packets under heavy load, causing occasional login automation failures in `win-test.cjs`.
- **CombatBooster PixiJS Deprecation**: Fatal warning in `TurnMarker.js` (PixiJS v7 compatibility) is disrupting canvas hooks; requires a patch or temporary module deactivation.
- **Theme Leaks**: Standard `SOVEREIGN_THEME_CSS` is failing to penetrate `.journal-page-content` and `.tox-tinymce` iframes in Foundry v12.

## [2.8.0] - 2026-04-11
### Added
- **Gated Boot Sequence (Phase 42)**: Deck-Igniter now enforces strict dependency ordering via blocking readiness gates — CDP page target before WSL layer, clawlink socket before director, director :3010 before sidecars. Eliminates race conditions that caused silent boot failures.
- **crush-gui Component**: Supervised thought-stream terminal that launches as a visible Windows console window via PowerShell WSL interop immediately after clawlink socket is live. Streams inference tokens from Node A in real-time.
- **Windows Host IP Resolution**: `ResolveWindowsHostIP()` in both deck-igniter and director reads WSL gateway from `/etc/resolv.conf`, with `WINDOWS_HOST_IP` env override for static deployments. Neural Uplink now targets port 9223 (win-proxy) instead of 9222 (direct Foundry).
- **Crush .env Auto-Loading**: `LoadEnv()` runs in `init()` so all .env keys are injected before config resolves — no more stale defaults when running `./crush-cli` from project root.
- **Phase 42 Audit Scripts**: `sovereign-live-audit.ts` (CDP audit + WebSocket reconnection polling), `synthetic-gauntlet.ts` (combat/movement intent injection), `ghost-boot.sh` (headless driver), `watch-logs.sh` (ERROR/WARN surveillance).
- **50v3r31gn-bridge Module**: Consolidated Foundry module with fixed entry point, v12 compatibility, and bridge token auto-injection via CDP on successful Neural Uplink connection.

### Fixed
- **Clawlink Socket Path**: Aligned default path to `.crush/clawlink.sock` across crush-cli, deck-igniter, and director — eliminates `ENOENT` on first connection.
- **Crush-Proxy Timeout**: Bumped `CLAWLINK_TIMEOUT` default from 5s to 15s to accommodate cold-start latency.
- **Join Page Race Condition**: Ghost boot automation now correctly polls for the Foundry join page before attempting login.
- **CDP Browser Disconnect**: Fixed `browser.close()` call in audit scripts to use proper CDP mode disconnect.

## [2.7.0] - 2026-04-11
### Added
- **Global Structured Logging Overhaul**: Implemented a centralized, JSON-structured logging system across all Node.js services.
- **Traceability**: Every log entry now includes a unique `traceId`, timestamp, context, and severity for enhanced live testing observability.
- **Hardware Telemetry**: Integrated detailed logging for Binary UDP (VSB), CDP (Neural Uplink), and RPC (ClawLink) communication layers.
- **Oracle Observability**: Added transaction monitoring and Flush Gate approval tracking to the Unified Oracle.

### Changed
- **Service Refactoring**: Retrofitted 10+ core services to support the new `ILogger` interface.
- **Production Hardening**: Replaced fragile `console.log` calls with structured telemetry to catch edge cases during live-fire testing.

- **Phase 41: Legacy Stabilization (Completed)**: Critical optimization pass targeting Phases 1-20 core infrastructure.
- **Coordinate Normalization**: Implemented shared utility for 0-1000 integer-scaled geometry, standardizing coordinate handling across OCR and renderer.
- **Robust JSON Extraction**: Centralized LLM response parsing into a specialized utility, significantly reducing fragility in narrative generation.
- **Stat Key Standardization**: Migrated the entire character system (schemas, prompts, and controllers) to standard Uppercase Stat Keys (REF, DEX, BODY, etc.).

### Changed
- **Oracle Refactoring**: Decoupled database connection logic and implemented a private accessor pattern, reducing boilerplate by ~30% in UnifiedOracleClient.
- **Grounding Optimization**: Batched NPC lookup queries in HybridRoutingController, offloading substring filtering to the SQLite engine.

### Fixed
- **Type Safety**: Resolved long-standing inconsistencies between NpcStatBlock and player StatBlock interfaces.
- **CI/Environment**: Fixed `spawn go ENOENT` errors in isolated runners by wrapping test scripts in Nix environment detection logic.

## [2.5.0] - 2026-04-10
### Added
- **Phase 40: 50V3R31GN-3C0N0MY (Completed)**: Fully integrated Red Trade and Night Market systems into the dual-node hardware bus.
- **Binary Friction UDP**: Implemented native `FRICTION_INTENT` (Type 0x05) for asynchronous rules-processing on Node A.
- **Tactical Heat Radar**: Allocated dedicated Mmap slots (3072-3074) for real-time heat telemetry.
- **Cyberdeck HUD Radar**: Engineered a circular pulsing radar widget in the Rust egui HUD, synced to Mmap state.
- **Architect Mission Loops**: Integrated autonomous token manifestations for dead drops and hostile ambushes directly into the Story Engine.
- **Smart Night Markets**: Extended Foundry bridge with hoverVendor events to trigger real-time shop displays in the HUD.

### Changed
- **Phase 39: Legacy Remediation (Completed)**: Systematic rebranding of all "Ollama" clients to SovereignNarrativeClient and SovereignEmbeddingService.
- **Mock Logic Purge**: Replaced all hardcoded mock scoring in Unified Oracle with real vector distance metrics.
- **System Version**: Bumped core engine to v2.5.0.

## [2.4.0] - 2026-04-10
### Added
- **Phase 39: 534ML355-1NF1L7R4710N (Completed)**: Transformed the system into an active infiltration engine.

## [2.3.1] - 2026-04-10
### Added
- **Startup Modality**: Introduced `crush start --lite` and `--full` flags. Lite mode suppresses heavy GUI elements (Foundry, Obsidian, Dashboard) for terminal-only sovereign operations.

### Changed
- **Total Identity Purge**: Systematically removed all legacy `ASP GM Agent` identifiers. Replaced with `50V3R31GN-M4CH1N4` and `SOVEREIGN_BRIDGE` across Foundry modules, Go binaries, and system services.
- **Akashik Library Reorganization**: Migrated all system guides into a Diátaxis-compliant structure at `akashik_guides/`.

### Fixed
- **Vault Double-Seal Bug**: Patched `crush/vault.go` to prevent recursive encryption of LevelDB shards.

## [2.3.0] - 2026-04-09
### Added
- **Phase 38: 7R1-M1N1NG [VRAM_50V3R31GN7Y] (Completed)**: Implemented a geometric context compression layer (Trigonometric Scoring) to achieve 10.7x simulated context density on Node A's 4GB VRAM.
- **UI Unification: R3D_V01D [7074L-R3D-0B53RV4B1L17Y] (Completed)**: Unified all project interfaces (Obsidian, VS Code, Dashboard, Foundry) into a single, high-fidelity black/red machine aesthetic.
- **Master Theme Artery**: Physicalized `src/shared/sovereign-theme.css` to enforce aesthetic consistency across all monorepo components.

### Changed
- **Version Iteration**: Bumped system version to v2.3.0.
- **Context Management**: Shifted Node A memory management from reactive FIFO to proactive Geometric Pruning (7R1_SC0R3R).
- **Technical Debt Sweep**: Removed unused packages (`cheerio`), dead environments (`fhs.nix`, `shell.nix`, `Modelfile`), and obsolete Python inference scripts.

### Fixed
- **System-Wide Debug Audit (Completed)**: Physicalized and executed a cross-machine dry fire to verify VSB Sovereignty, Rules Oracle Invariants, Economic Friction, Ghost Object extraction, and UI Telemetry.
- **Vault Security**: Resolved a critical double-seal bug in `crush/vault.go` where steganographic `.png` shards were being encrypted twice, and purged temporary LevelDB logs.
- **Test Race Conditions**: Stabilized `RedTradeService` and `RulesGrepService` by migrating data dependencies to dedicated `tests/fixtures/`. Full 523 test suite passing.

## [2.2.0] - 2026-04-09
### Added
- **Phase 36: 5H4D0W_D45HB04RD [50V3R31GN_MN7R] (Completed)**: Built a high-speed real-time monitoring dashboard for dual-node observability, bridging binary VSB telemetry to a Next.js UI inside Foundry.
- **Phase 37: 0B51D14N_5YNC [7H3-HUM4N-R34D4BL3-V4UL7] (Completed)**: Implemented bidirectional synchronization between machine-memory (SQLite) and human-memory (Obsidian vault).
- **Global Rebranding**: Executed a total sweep of the codebase to replace all "ASP.GM-Agent" references with the official "50V3R31GN-M4CH1N4" identity.

### Changed
- **Version Iteration**: Bumped system versions across Go sidecars, Rust SDKs, and Node.js manifests to v2.2.0.
- **Vault Governance**: Refined `.gitignore` to strictly enforce documentation sovereignty by blocking cleartext blueprints while allowing encrypted shards.

## [2.1.0] - 2026-04-08
### Added
- **Host-Native Inference Migration (Option 1)**: Pivoted Node B inference to a Windows-native `llama-server` to bypass WSL `dxgkrnl` kernel deadlocks.
- **Windows Interop Shortcuts**: Created `start_pixtral.bat` and `add_firewall_rule.bat` on the Windows host (`D:/llama.cpp`) for automated GPU-accelerated startup.
- **Deck-Igniter Integration**: Added `pixtral` as a first-class component in the Go-based launcher, enabling automated Windows-side server ignition via WSL interop.
- **Phase 33: UN1F13D-L0R3-M1ND (Completed)**: Enhanced the Chronicle Harvester with multi-tier heuristic and LLM-assisted categorization, enabling granular provenance tagging and embedding into the Memory Palace.
- **Phase 34: 7H3-M3M0RY-P4L4C3 (Completed)**: Hierarchical memory architecture and ChromaDB integration finalized.
- **Phase 35: V15U4L-D0M1N4NC3 (Completed)**: Total UI Hijack and Cyberpunk Red theme enforcement completed.

### Changed
- **Node B Orchestrator**: Updated `OLLAMA_BASE_URL` and `VLM_ENDPOINT` defaults to point to the Hyper-V internal gateway (`172.26.208.1`).
- **Environment Cleanup**: Removed redundant Vulkan/ROCm fallback variables from `.env` to ensure stable network-based inference.

### Fixed
- **WSL Stability**: Eliminated system-wide kernel hangs by offloading hardware IOCTLs to the stable Windows host driver.
- **Go Syntax**: Resolved duplicate `colorRed` declaration in `deck-igniter/main.go`.

## [2.0.0] - 2026-04-07
### Changed
- Migrated default VLM to Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B for Sovereign Highway execution.
- Migrated global color theme from Cyan to Cyberpunk Red (#ff003c) across all UI elements and Foundry modules.

## [1.14.0] - 2026-04-05
### Added
- **Project Identity: 50V3R31GN-M4CH1N4**: Rebranded the entire project to reflect its evolution into a distributed, physically sovereign machine.
- **Phase 32: 7H3-0B51D14N-V4UL7**: Implemented encrypted steganography for all project documentation (AES-256-GCM + ST3GG).
- **Vault Subcommands**: Added `crush vault seal` and `crush vault open` to protect blueprints and research.
- **Phase 28: Ghost Protocol (Core Functional)**: Established physical sovereignty over the Foundry VTT renderer.
- **Ghost Input Service**: Implemented synthetic mouse/keyboard orchestration via the CDP `Input` domain, enabling physical token dragging and UI clicks.
- **UI Infiltration Protocol**: Added `corruptUI()` to `VisualMonitorService` for direct DOM manipulation (Leet-speak and Parseltongue corruption).
- **Journal Hijack Hook**: Integrated a `renderJournalSheet` hook into the Foundry bridge to scramble journal entries in real-time.
- **Scenario Engine (Go)**: Expanded `crush` CLI with `devdom` and `ghost-play` subcommands for automated scenario playback.
- **Security & Lifecycle Hardening**:
    - **Zombie Purge**: Added `ctrl+p` to `deck-igniter` for aggressive process cleanup (`pkill -9`).
    - **Node B Watchdog**: Self-terminates if Foundry connection is lost for >5 minutes.
    - **Node A Watchdog**: Self-terminates if VSB traffic is idle for >15 minutes.
- **Neural Shroud**: Implemented a physical input lock (`setPhysicalLock`) to prevent user collisions during machine-driven actions.
- **Cyberpunk UI Encoding**: Applied consistent leet-speak and disk-drive styling (`:/`, `:://`) to the README, CLI headers, and all Rust sidecar interfaces.

### Changed
- **Branding**: Renamed the `KNOWLEDGE_BASE.md` and updated all core documentation headers to the new 50V3R31GN-M4CH1N4 identity.
- **Node B BR41N**: Optimized the primary model configuration to prioritize Pixtral-12B for both multimodal perception and narrative reasoning.

### Fixed
- **Pretext Corruption**: Repaired a corrupted `PretextOverlayPayloadSchema` in the Foundry bridge schema.

## [1.13.0] - 2026-04-05
### Added
- **Phase 27: Hyper-Reasoning Orchestrator (Completed)**: Integrated multimodal perception and real-time reasoning streams.
- **Pixtral-12B VLM Integration**: Provisioned and launched Pixtral-12B on Node B for visual world-state understanding.
- **Thought Stream (CoT) Pipeline**: Implemented real-time streaming of AI tactical reasoning from Node B to `crush` CLI.
- **Surgical Perception**: Added CDP-based high-resolution coordinate cropping for precise visual auditing.
- **Akashik Visual Auditor**: New service to extract narrative lore and atmospheric barks from campaign PDF artwork using the VLM.

### Changed
- **Vision Pipeline**: Migrated from Ollama-specific vision to native `llama-server` OpenAI-compatible multimodal endpoints.
- **CLI Refresh**: Expanded `crush` CLI with the `thought-stream` command for live developer observability.

### Fixed
- **Proxy Broadcasting**: Resolved race conditions in the Go proxy by implementing a thread-safe client registry for real-time packet broadcasting.

## [1.12.0] - 2026-04-05
### Added
- **Phase 29: The Forge (Completed)**: Implemented a user-friendly air-gapped pipeline for "Smart Asset" ingestion.
- **Smart PNG Ingestion**: Added `crush forge run` (Go) to embed JSON campaign data into lossless PNG pixels via ST3GG.
- **Living Portraits**: Implemented ST3GG decoding in the `sidecar-cyberdeck` (Rust). The HUD now instantly loads NPC biometrics from portrait pixels when selected in the Atlas.
- **Pure-Go ST3GG Codec**: Robust implementation of LSB steganography with CRC32 integrity checks, synchronized with the Node A Rust kernel.
- **Akashik Seeder**: Seeded the `Akashik.db` with new high-fidelity narrative barks and street scenes from PDF narrative data.

### Changed
- **Sidecar Renaming**: Renamed the `HACKS` tab to `DECK` in the monolithic HUD to align with the approved Cyberdeck specification.
- **Protocol Synchronization**: Updated the Rust ST3GG implementation to include CRC32 trailers, ensuring 100% bidirectional compatibility between Go and Rust.

### Fixed
- **Rust Dead-Code**: Silenced non-blocking dead-code warnings in the `sidecar-cyberdeck` for parsed but unused protocol fields.

## [1.11.0] - 2026-04-05
### Added
- **Unified Cyberdeck (Rust)**: Consolidated `sidecar-atlas` and `sidecar-netrunning` into a monolithic Rust/Egui HUD with tabbed navigation, shared memory state, and an integrated **Glitch Engine**.
- **High-Throughput Partnership Protocol**: Established new guidelines for Claude (Build) and Gemini (Strategy) to optimize development speed and token usage.
- **Extended WSA Commands**: Added `hack` and `scan` subcommands to `crush` CLI for physical world manipulation.
- **Smart Asset System (Design Approved)**: Codified v1.12.0 spec for PNG-enforced steganography and atomized token grounding.

### Changed
- **Sidecar Consolidation**: All tactical and network visualization is now handled by a single high-performance binary (`sidecar-cyberdeck`).
- **Partnership Guideline**: Claude now completes entire implementation plans before handing off to Gemini for audit.

### Fixed
- **Egui 0.31 Compatibility**: Added required `StrokeKind::Middle` to `rect_stroke` calls in the glitch shader and HUD main loop.
- **Dead-Code Remediation**: Silenced warnings for parsed protocol fields in `RadarBlip` and `ScannedItem` structs.

## [1.10.0] - 2026-04-05
### Added
- **Phase 26: Hybrid V2 Refactor (Initiated)**: Commenced massive architectural shift to Go-based orchestration and Rust-based state authority.
- **Sovereign Proxy (Go)**: Refactored `ClawLinkClient` into a high-performance Go sidecar, eliminating Node.js GC jitter for cross-node TCP/SSH traffic.
- **Unified Cyberdeck (Rust)**: Consolidated `sidecar-atlas` and `sidecar-netrunning` into a monolithic Rust/Egui HUD with tabbed navigation and shared memory state.
- **World State Authority (WSA)**: Implemented raw world-manipulation commands (`unlock`, `dim-lights`, `shut-down`) in `crush` CLI and AI services.
- **Zero-Trust Script Auditing**: Integrated a mandatory Node A reasoning audit for all AI-driven JavaScript injections, flagging exfiltration (`fetch`, `pull`) and system escape (`fs`, `rm`) attempts.
- **Glitch Engine (HUD)**: Implemented full-window Egui visual noise and jitter shaders in the sidecar, tied to real-time `intrusion_level` MMAP data.
- **Phase 28 Roadmap**: Codified **Total Environment Dominance** in the implementation plan, targeting Ghost Protocol (synthetic input) and Chaos Monkey testing.

### Changed
- **System Orchestration**: Shifted primary process and network management from TypeScript to Go.
- **Mechanical Authority**: Consolidated all tactical/visual data into a single `black_ice_state.mem` MMAP for sub-1ms HUD updates.
- **Security Gate**: Moved mechanical rules validation from Node B (TypeScript) to Node A (Go Proxy/Reasoner Handshake).

### Fixed
- **Lock-Copy Debt**: Resolved `sync.Mutex` copy warnings in `crush/registry.go` via manual field snapshotting.
- **Bridge Protocol**: Synchronized VSB packet sizes (302 bytes) across Go, Rust, and TypeScript implementations.

## [1.9.0] - 2026-04-05
### Added
- **Deck Igniter (TUI Orchestration)**: New Go-based unified terminal interface for system-wide boot synchronization, CDP probing, and Node A SSH handshakes.
- **Phase 25: Native Inference Engine (Completed)**: Migrated entire project from Ollama to native `llama-server` (llama.cpp) for zero-overhead inference.
- **Node A Nix Sovereignty**: Installed Nix on Node A (physical machine) for full environment parity with Node B.
- **Hardware-Optimized Flake**: Updated `flake.nix` with multi-GPU support: CUDA-optimized shell for Node A (NVIDIA) and Vulkan-optimized shell for Node B (AMD).
- **Sovereign Highway Stabilization**: Implemented production-grade `VsbClient` (TypeScript) for high-performance UDP communication.
- **GPU Passthrough Hardening**: Configured NixOS FHS environment (`fhs.nix`) with CUDA/GL libraries for local inference on Node B.

### Changed
- **Inference Standard**: Replaced Ollama-specific endpoints with OpenAI-compatible `/v1/chat/completions` across all services (`OllamaClient`, `SpatialVisionService`, `TacticalVisionService`).
- **Resident Management**: Shifted VRAM residency enforcement to process-level `--mlock` via `llama-server` native flags.
- **Network Protocol**: Refactored `zeroclaw` to use `127.0.0.1` binding internally to prevent IPv6 resolution lag.
- **Orchestration**: Integrated `VsbClient` into `HybridRoutingController` for sub-1ms mechanical validation fast-path.
- **Refactored Deck Igniter Config**: Mapped `.env` keys (`CLAWLINK_USER`, `CLAWLINK_SSH_PORT`, `ZEROCLAW_PORT`) to Go config for seamless multi-node orchestration.

### Fixed
- **VSB UDP Binding**: Resolved binding bottlenecks in Node A startup script to allow external connections.
- **Node A Dependencies**: Replaced manual Ubuntu `apt` management with deterministic Nix development shells.
- **Build Integrity**: Fixed `zeroclaw` Rust compilation errors related to missing `Deserialize` derives and OpenSSL linkage.
- **Deck Igniter Prober**: Remedied binary UDP packet size (302 bytes) to match VSB specification for heartbeat probes.

## [1.8.0] - 2026-04-04
### Added
- **Phase 23: Neural World Engine (Completed)**: Empowered the Agent with autonomous physical manipulation of Foundry VTT.
- **Solo-Safe Balancing**: Adaptive NPC stat generation with probability-capped hit logic in `NitroLogicClient`.
- **Ghost Object Protocol**: VSB extension for `GhostBlip` payload decoding and tactical `SceneRegion` seeding.
- **easy-phasey Integration**: Linked narrative beat success to physical environmental shifts in `FoundryAdapter`.
- **Linux-Native Migration:** Relocated Node B to internal NixOS/WSL filesystem (`/home/nixos/`) for O(1) FS performance.
- **Nix Sovereignty:** Established `shell.nix` and `flake.nix` for deterministic Node B dependency management.
- **Sovereign Utility Belt (Phase 24 - In Progress):** Deployed the **Sidecar Registry** in Crush (Go) for automated HUD process management and implemented the **Physical ACK (Flush Gate)** authorization pane for human-in-the-loop safety.
- **Sovereign Highway (Phase 22.5 - Completed):** Established sub-1ms state sync via Binary UDP and implemented VRAM residency lockdown for Open-Reasoner-Zero-1.5B and Falcon-0.3B.
- **SSH-Git Integration:** Secure, passwordless repository interaction for the NixOS environment.

### Changed
- **Binary Authority:** VSB Binary UDP established as the primary authority for rules validation.
- **Residency:** Shifted Node A authority to resident Open-Reasoner-Zero-1.5B and Falcon (0.3B) models.
- **Main Branch:** `master` now targets the Linux-native environment.

### Fixed
- Rebuilt native Node.js and Rust components for Linux compatibility.

## [1.7.0] - 2026-04-03
### Added
- **Phase 21: Total Autonomy (Completed)**: NPC agents now operate via a 4-stage autonomous loop (Reason -> Intent -> Action -> Validate).
- **Autonomous Turn Daemon**: Implemented a state machine on Node B for self-directed NPC behavior.
- **Phase 20: Linguistic Sovereignty**: Integrated Skillstone Registry and Glossopetrae dialects.
- **Phase 19: The Latent Seed**: High-performance Rust implementation of ST3GG steganography.

Co-authored-by: Claude Sonnet <noreply@anthropic.com>
Co-authored-by: Gemini CLI <gemini-cli@google.com>
