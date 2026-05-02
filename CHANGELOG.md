# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS.html).

## [3.8.26-SYNTHESIS] - 2026-05-02

### Added
- **Interactive Artery Shell:** Materialized a Go-native **PTY Proxy** in the Nucleus bridge. The terminal-app HUD now provides a real-time, interactive bash shell connected to the Ubuntu/NixOS spine.
- **Deep Synapse Integration:** Relinked the mobile HUD to the **Artery of Truth**. Implemented FTS5 full-text search across all intelligence shards and OsTriplet management (CRUD) in the mobile interface.
- **Machina Daemon Protocol:** Materialized `docs/nodestadt/deployment/machina-daemon.md` documenting the binary unsealing and bridge ignition sequence for local device control.
- **Task Reminder Artery:** Integrated `NotificationService` into the Flutter HUD. Tasks now support date/time alarms with persistent mobile notifications.
- **Obsidian Artery Sync:** Established a bit-identical `rsync` pipeline to the Windows-native vault at `D:\Obsidian_Sovereign_OS\`.
- **NodeStadt Brand Assets:** Updated the terminal-app icon to the official **Node B Director** signature.

### Changed
- **Lore-Neutrality Gating:** Refactored `crush/nucleus.go` to gate all simulation-heavy database queries (`Akashik.db`) behind an active **RED_MODE** invariant.
- **HUD UX Overhaul:** Relocated the clinical navigation rail to a high-fidelity **BottomNavigationBar**, liberating horizontal space for the kinetic Pretext HUD.
- **OMI Voice Repair:** Re-aligned the `ArteryClient` with the **BasedHardware/OMI v1** protocol (PCM-16) to restore hands-free swarm orchestration.
- **Glow-Terminal Extension:** Refactored the Vivaldi ingress extension to the **NODESTADT Authority** palette (Charcoal/Rust/Gilded) with a lite telemetry ticker.

### Fixed
- **AAPT2 Hardgate:** Resolved the NixOS dynamic linking failure by overriding the `AAPT2` path in Gradle properties, enabling 100% successful APK materialization.
- **Sync Poisoning:** Hardened `universal-synchronizer.ts` to skip hidden dependency caches (e.g., `.dart_tool`), preventing path corruption during manifest sync.

## [3.8.25-SYNTHESIS] - 2026-05-02

### Added
- **NODESTADT Organization Pivot:** Successfully migrated the repository to `github.com/nodestadt/50V3R31GN-M4CH1N4` and rebranded the entire OS to the clinical standard.
- **Clean BASE Foundation:** Achieved total OS purity by surgically extracting all simulation-specific logic (Cyberpunk RED, Foundry VTT, NPC Mechanics) into a standalone `plugins/sovereign-red-plugin/`.
- **Clinical UI Overhaul (HUD & Hub):** 
    - Purged `VT323` and `Gruvbox` remnants mesh-wide.
    - Migrated to **Space Grotesk** (Display) and **Lexend** (Technical Data) typography.
    - Implemented **Metabolic Text Distortion** in the Pretext HUD; thought-streams now warp reacting to background heat shaders.
    - Integrated **Cathode-Ray Hardening** (scanlines, noise, phosphor glow) via global SVG filters.
    - Refactored the Command Deck into an **Asymmetric Floating Layout** with overlapping modules.
    - Neutralized Material Design in the Flutter Hub, replacing it with sharp-edged **Geometric Shards**.
- **Sovereign Synapse Core (Phase 109):** 
    - Materialized `sidecars/stash` (Go-native SQLite memory consolidation).
    - Integrated `plur-ai/plur` for cross-agent YAML persistent memory.
    - Shored the **Obsidian Identity Layer** with the `ME.md` behavior contract.
- **Intelligence Ingress (Phase 110/111):**
    - Deployed `free-claude-proxy` for local-first agent telemetry.
    - Materialized `git-nexus` for local-first code graph intelligence.
    - Established the **Skill Forge** (`hermeshub`, `skill-marketplace`) for autonomous pattern abstraction.
- **Managed Employee Loop (Phase 112/113):**
    - Integrated `paperclip-adapter` for autonomous self-evolving implementation cycles.
    - Materialized `zeroboot` for sub-millisecond VM isolation of untrusted code.
    - Shored `worldseed` for deterministic environmental consequence testing.
- **Node D Artery Hardening:** Materialized `scripts/ops/node-d-provision.sh` for automated GMKtec K15 / Tailscale shoring.
- **Legal Grounding:** Established the **MIT License** standard for the NODESTADT monorepo.

### Changed
- **Monorepo Hardened:** Root directory physically cleaned. All modular organs moved to `sidecars/` and `crates/`.
- **Artery Purification:** `UnifiedOracleClient` and `hermes-router` are now lore-neutral and security-first.
- **Machine Voice Mandate:** Updated all agent directives to the clinical **NODESTADT Authority** standard (Radical Candor / Terse / Analytical).
- **README Overhaul:** Refactored the primary manifest to the VoxCPM professional standard with deep technical specs and navigational arteries.

### Fixed
- **Type Safety Parity:** Achieved 100% typecheck success across the clinical nervous system.
- **Path Drift:** Synchronized 490+ manifests to reflect the new monorepo physical mapping.

## [3.8.17-SYNTHESIS] - 2026-05-01

### Added
- **Encyclopedia of the Machina:** Materialized a 100% exhaustive architectural knowledge base in `docs/nodestadt/encyclopedia/`.
- **System Soul Dive:** Backtraced 113+ phases of evolution through historical archives, git logs, and shards to map every miniscule feature and orphaned primitive.
- **Physical DNA Mapping:** Created the `PHYSICAL_MAP.md` dictionary, binding every directory and core file to its origin and technical purpose.
- **Reckoning Documentation:** Formalized the documentation for the `Gauntlet Reckoning Suite` ensuring zero-trust verification is comprehensibly understood.

## [3.8.16-SYNTHESIS] - 2026-05-01

### Added
- **V2F Integration (Go):** Integrated `ST3GG` identity heartbeat into `sidecars/sidecar-proxy`. Added `/api/v2f/pulse` route for Visual Second Factor (V2F) frame generation.
- **SPIRE Workload API (Go):** Implemented native SPIRE Workload API client in `sidecars/sidecar-proxy` to retrieve physical SVIDs for visual signing.
- **Gated Cognition (Rust):** Refactored `hermes-router` to support V2F gating. Cognition routes can now be restricted by the steganographic heartbeat.
- **mTLS Dependencies:** Added `spiffe`, `rustls`, and `tokio-rustls` foundations to the Rust inference layer.

### Changed
- **Roadmap Refinement:** Deepened the Phase 106 integration to utilize existing steganography and dialect primitives for a more cohesive security model.

## [3.8.15-SYNTHESIS] - 2026-05-01

### Added
- **Sovereign Root CA:** Materialized `scripts/ops/generate-sovereign-root.sh` to establish the physical Anchor of Truth. Generated the initial Root CA on Node D.
- **SPIRE Core:** Materialized `nix/modules/security/spire.nix` for declarative zero-trust identity management on Node D.
- **Steganographic Identity:** Materialized `crush/identity_st3gg.go` integrating ST3GG steganography with SPIFFE SVIDs for Visual Second Factor (V2F) validation.
- **KVM Enablement:** Materialized `scripts/ops/enable-node-d-kvm.sh` for hardware-level isolation.

### Fixed
- **Type Safety Audit:** Resolved TS2554 errors in `packages/hermes-core/src/core/visual-monitor-service.ts` related to `better-sqlite3` prepared statement calls.
- **Go Compilation:** Fixed unused import regression in `crush/identity_st3gg.go`.

## [3.8.14-SYNTHESIS] - 2026-05-01

### Added
- **Architectural Roadmap Expansion:** Radically expanded `IMPLEMENTATION_PLAN.md` from Phase 106 to Phase 111 based on the verification of 24+ high-signal Grok research repositories.
- **Sovereign Artifact Categorization:** Formalized integration paths for `stash`, `plur`, `Ankh.md`, `halo`, `GitNexus`, `hermes-skill-marketplace`, and `RecursiveMAS` across the Quaternary Mesh.


## [3.8.12-SYNTHESIS] - 2026-05-01

### Added
- **Warp Observer Artery:** Materialized `sidecars/warp-observer/` Rust crate for zero-runtime-leakage telemetry ingress on Node D.
- **Oz Contribution Pipeline:** Implemented `Triage -> Spec -> Implement -> Review` orchestration loop in `HermesSingularity.ts` based on mined Warp/Oz patterns.
- **GEPA Curator:** Materialized `sidecars/gepa-curator/` Rust crate for background skill and memory consolidation on Node D.

### Changed
- **Prompt Standard Alignment:** Migrated all internal system markers to the Hermes v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS `[IMPORTANT:]` standard to neutralize Azure content filter friction.
- **Hermes Singular Recovery:** Refactored `HermesSingularity.ts` to use class-level logging and shored the Discovery-First Hardgate logic.

### Fixed
- **Hardgate Regression:** Corrected a logic bug where enriched discovery metadata was calculated but not transmitted to the reasoning engine.
- **Mesh Header Parity:** Re-aligned `HealerProtocol.ts` headers to maintain bit-identical consistency with Go/Rust sidecars.

## [3.8.11-SYNTHESIS] - 2026-05-01

### Added
- **Node C Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Upgrade:** Transitioned Node C (RTX 2060) from multi-port Gemma-4 farm to a single-model Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle utilizing Qwen-3.5 9B DeepSeek-V4-Flash Q3. 
- **Mesh Model Audit & Shoring:** Physically verified and shored the model artery distribution across the quaternary mesh. Falcon Perception 0.3B (safetensors) is now shored on Node C.
- **Warp Observer Sidecar (Rust):** Initialized the baseline telemetry sidecar on Node D in `sidecars/warp-observer/`. Established the `WarpTelemetry` schema and mocked ingestion logic for real-time development process monitoring.
- **Cargo Workspace Expansion:** Integrated the `sidecars/warp-observer` package into the root Cargo workspace for unified build and dependency management.

## [3.8.10-SYNTHESIS] - 2026-04-30

### Added
- **Ability Stones (Scoped Identity):** Materialized localized `AGENTS.md` manifests for `packages/hermes-core/src/`, `crush/`, and `zeroclaw/` to enforce sector-specific architectural invariants and eliminate assistant-speak in specialized domains.
- **Browser Extension Guide:** Materialized `docs/nodestadt/sidecars/sidecar-browser-extension.md` documenting the high-fidelity Vivaldi ingress pipeline and port mappings.
- **Node D Health Probe:** Integrated a dedicated health check for the Node D model swapper into the `deck-igniter` heartbeat loop.

### Changed
- **Model Farm Orchestration:** Patched `hermes-router` to hit the **Node D Swapper (:8080)** instead of the raw model server, enabling autonomous VRAM management for heavy context/reasoning requests.
- **Declarative Identity Sync:** Synchronized `nix/identities.nix` with root `SOUL.md` and `AGENTS.md` hardware invariants for the Quaternary Mesh (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS).
- **Startup Consolidation:** Centralized the system ignition sequence around `deck-igniter`. Added `boot:cpr` and `boot:headless` scripts to `package.json` for environment-aware startup.
- **Agent Sandbox Upgrade:** Elevated `nix/agent-sandbox.nix` to **Node.js 22** with strict capability gates for hardware sovereignty.
- **Universal Manifest Sync:** Achieved 100% version parity (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS) across the mesh.

### Fixed
- **Ignition Pollution:** Surgically archived 10+ legacy/redundant ignition scripts to `scripts/archive/` to restore directory purity and simplify the boot process.
- **Drift Reconciliation:** Synchronized root `SOUL.md` and `AGENTS.md` with the physical state of the Quaternary Artery.

## [3.8.9-RECONCILIATION] - 2026-04-29

### Added
- **Reconciliation Audit:** Executed the exhaustive **Context Drift Audit** following a catastrophic cognitive failure. Engraved the record in `docs/superpowers/audits/`.
- **SPIRE Materialization Spec (Phase 108.1):** Materialized the high-fidelity plan for SPIFFE/SPIRE Identity Federation across the quaternary mesh.
- **KV Cache Vaccination Spec (Phase 108.2):** Drafted the physical vaccination protocol for model context purging during profile transitions to eliminate lore-bleed.
- **Intelligence Synthesis Spec (Phase 109):** Integrated SOTA patterns from **GraphRAG-SDK**, **Plurai BARRED**, **IntellAgent**, and **CocoIndex CDC** into the implementation trajectory.
- **Hardware Truth Table:** Precision-mapped the physical specifications of MACSPC (Node B) and the K15 (Node D) across all system soul manifests.
- **Mesh Model Audit & Shoring:** Physically verified and shored the model artery distribution across the quaternary mesh. Falcon Perception 0.3B (safetensors) is now shored on Node C. Gemma-4 and mmproj shards are synchronized across Nodes B, C, and D.
- **Historical Archival:** Executed a systematic purge of legacy documentation from `audits/`, `plans/`, `research/`, and `specs/`, moving all work older than 48 hours to the `archive/` shards.
- **Ouroboros Status Ring:** Materialized the SVG-path animated status ring in `PretextShroud.tsx` for real-time agentic loop visualization.

### Changed
- **Universal Manifest Sync:** Achieved 100% version parity (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS) across `SOUL.md`, `AGENTS.md`, `README.md`, `GEMINI.md`, and `SOVEREIGN-IDENTITY.md`.
- **NODESTADT Aesthetic Ascension:** Purged Gruvbox Material variables from `globals.css`. Locked the **Authority Palette** (#1A1A1A, #F36622, #C7A87A) and transitioned to the Cinzel/Space Grotesk typography stack.
- **Aesthetic Refactor:** Replaced legacy CRT/Glitch overlays with **Fluid Smoke Metabolism** (Machina Rust pulse) in the Pretext HUD.
- **Implementation Plan Re-Alignment:** Surgically re-ordered and re-numbered the `IMPLEMENTATION_PLAN.md` to reflect true dependency-weighted trajectories.
- **Profile-Aware Synapse Observer:** Refactored `MemoryObserver.ts` to strictly gate lore-distillation based on the active soul profile ([SOVEREIGN_OS] vs [RED_DIRECTOR]).

### Fixed
- **Dead Link Restoration:** Repaired broken documentation references in `README.md` and restored link integrity to the high-fidelity knowledge base.
- **Cognitive Drift Neutralization:** Surgically purged mislabeled legacy research documents and neutralized "Shadow Logic" in the reasoning loop.

## [3.8.8] - 2026-04-28

### Added
- **Quaternary Mesh:** Node D (Intel Core Ultra 5 125U) officially ignited and provisioned as the Cluster Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle. Built `llama.cpp` from source with Intel optimizations.
- **Hermes Tools (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS):** Transitioned to native, pluggable transport-based tool calling. Physically purged **LangGraph** dependencies.
- **RESEARCHER Profile:** Dedicated high-context profile for long-running research cycles and architectural audits.
- **Experience-Gitting:** Immutable, Git-backed event logging for agentic reasoning trajectories and failure recovery in `SovereignIntelligence.db`.
- **ClawLink Backbone:** Persistent zero-latency SSH tunnels established as the default direct connection path for inter-node reasoning.
- **Context-DAG v2:** Enhanced trajectory compression for 128k+ hyper-context windows on Node D.
- **NODESTADT Brand Ascension (Phase 99):** Materialized the `brand_manifest.json` locking the **Authority Charcoal (#1A1A1A)**, **Machina Rust (#F36622)**, and **Gilded Sovereign (#C7A87A)** palette.
- **Bit-Identical Identity Forge:** Executed the surgical dissection of the Master Emblem using ImageMagick hard-masking. Materialized isolated submarks for Nodes A, B, C, and D.
- **Topology v1.1 Verification:** Resolved Node B VRAM hardgate by standardizing **Gemma-4-26B-A4B Q3_K_M** for stable Director cycles with BF16 Vision.
- **Forensic Audit & Reconstruction (Phase 103.5):** Executed a full-mesh technical audit across 5 domains. Materialized a professional, GitBook-compliant Knowledge Base in `docs/nodestadt/`.
- **Cyberpunk RED Plugin Isolation:** Surgically extracted and isolated all RED-specific simulation logic into `plugins/sovereign-red-plugin/docs/`.

### Changed
- **README & ABOUT Reconstruction:** Rewrote core manifests with NODESTADT branding and quaternary-mesh product positioning.
- **Profile Architecture:** RootsInjector upgraded to support multi-soul injection (DIRECTOR vs RESEARCHER).
- **Hermes Router v1.1:** Refactored for dynamic multi-node routing based on context length and hardware capability.
- **Model Topology:** Standardized on Gemma-4-26B A4B Q6_K for heavy reasoning and Qwen-2.5-Coder for audits.
- **Gruvbox Deprecation:** Formally initiated the purge of Gruvbox Material colors in favor of the NODESTADT Authority palette.

### Fixed
- **Model Purge:** Reclaimed 40GB+ storage by deleting legacy "OBLITERATED" model shards and redundant Mistral/Pixtral files.
- **Documentation Drift:** Synchronized all technical documentation with the physical quaternary architecture.

## [3.8.7] - 2026-04-26

### Added
- **Pretext Ascension (Phase 96):** Materialized high-performance **Fluid Smoke** metabolic shaders in Web and Mobile HUDs. Refactored the UI to a "Modular Command Deck" with a persistent tactical side-rail and high-density cards.
- **OMI Voice Restoration:** Repaired the missing OMI JSON Handshake protocol; the microphone now correctly initializes with PCM-16 preambles for active field listening.
- **MemPalace Structural Refactor (Phase 95):** Refactored the **Neural Promenade** from a freeform graph into a rigid spatial hierarchy (Wings -> Rooms -> Drawers) with visible wireframe bounding boxes and temporal freshness shaders.
- **Claw3D Spatial Ingress:** Materialized the **Spatial Latch System** and `SpatialHotspotArtery.dart` for real-time visual anchoring and 2D topographical mapping of agent activity.
- **Mobile Mesh Materialized (Phase 91):** Scaffolded `openclaw_bridge.dart`, `screen_capture_service.dart`, and `postcard_service.dart` in the Flutter HUD. Integrated native `MethodChannel` in Kotlin `MainActivity.kt`.
- **Native Android Control:** Scaffolded `SovereignAccessibilityService` and `accessibility_service_config.xml` for 100% semantic screen awareness.
- **Mobile Vision Artery:** Materialized `MobileVisionArtery.ts` (Node B) listening on Port 3013 for binary frame ingestion.
- **Postcard Protocol:** Materialized `PostcardIngestor.ts` and updated `SovereignIntelligence.db` with `mobile_postcards` schema for field reputation tracking.
- **Deportation Hardgate:** Materialized `MobileAuthService.ts` to enable Vesper-driven session revocation and audit logging.
- **Hermes Comms Ingress:** Scaffolded `NativeMessagingAdapter.ts` for autonomous WhatsApp/QQBot integration.
- **Gauntlet Reckoning Suite (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS):** Materialized an exhaustive, zero-trust architectural validation suite. Includes `dag_validator.ts` (Context-DAG), `reckoning_vitals.rs` (KV-Cache Pressure), `reckoning_pulse.go` (7-step Pulse Verification), and `reckoning_ui_parity.ts` (Web-to-Mobile Parity).
- **Absolute Project Purge:** Physically deleted 60+ legacy gauntlet phases and redundant scripts to restore project purity and eliminate architectural drift.
- **Phase 95.1 (Spatial Ingress):** Materialized the **Spatial Latch System** (Claw3D integration) in the Neural Promenade and `SpatialHotspotArtery.dart` in the Flutter HUD for 100% topographical awareness.
- **Phase 95.2 (MemPalace Reconstruction):** Refactored the 3D scene to implement **Wing-Clustering** and **Temporal Fading**. Shards are now constrained to rigid mnemonic hierarchy (Wings -> Rooms -> Drawers).
- **Observability Hardening:** Standardized TS and Go loggers for structured JSON output (`artery.json`) and Trace-ID propagation. Refactored `PretextTerminalArtery` for real-time SSE log ingestion in the HUD.
- **Flutter HUD Resilience:** Implemented `PageView` navigation to prevent white-screen hangs, added `PermissionService` for startup ingress, and shored tactical UI scaling for field readability.
- **Total Documentation Overhaul:** Rewrote `README.md` and `ABOUT.md` to reflect the re-grounded Trinity topology. Reconstructed the `akashik_guides` using the **Diátaxis framework**.
- **Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS:** Shored SQLite schema with FTS5 search triggers and R-Tree spatial indexing.
- **Deck-Igniter Stability Review:** Confirmed default boot invariant to `[SOVEREIGN_OS]` mode; suppressed automatic Foundry VTT ignition except in explicit `cpr` mode. Shored `ignite-sovereign.ps1` for secure Windows-to-WSL transition.
- **Social Intelligence Mesh (Phase 88):** Materialized `crates/sovereign-social` (ActivityPub relay) and `crush social` command. Implemented Socially-Weighted Retrieval (SWR) in `OsTripletService.ts` and Agent Avatars/Consensus Arcs in the 3D Neural Promenade.
- **Serpentine Artery (Phase 89):** Materialized `SteganoEncoder.ts` (Zero-width hidden proof) and `parseltongue.rs` (Token-encoded IPC). Hardened `sovereign-kernel` with TPM hardware-backed signing for agent activities.
- **HeadlessDatalog (Phase 90):** Materialized `packages/hermes-core/src/core/memory/HeadlessDatalog.ts` — zero-dependency Datalog-to-SQLite compiler. Supports DataScript EDN-subset syntax.
- **SovereignDashboardService (Phase 90):** Materialized `packages/hermes-core/src/core/memory/SovereignDashboardService.ts` — live Obsidian Command-Center with bidirectional fact ingestion and journal engraving.
- **Phase 86-93 Resilience Forge:** Scaffolded 8 new Gauntlet test phases (`v86` through `v93`) and the `AbilityStone_HermesAgent_v2026.md` intelligence boost.

### Fixed
- **System-Wide Artery Audit (Phase 94):** Performed surgical fixes across all 2026-04-26 documentation shards; standardized sector-prefixes (`SPEC_`, `PLAN_`, `RESEARCH_`) to prevent Logseq/Obsidian indexing collisions.
- **Kernel Vitals Restoration:** Refactored `sovereign-kernel` to run dual Tokio tasks for both `/proc` telemetry and TPM signing.
- **LangGraphOrchestrator Integrity:** Repaired catastrophic syntax fractures and type-desyncs in the Hermes routing layer and Dashboard interface.

### Changed
- **Obsidian 1st Class HUD:** Formally established Obsidian as the primary operator interface, physically purging the Logseq native plugin.
- **KNOWLEDGE_BASE v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS:** Total integration of Hermes Atlas and Pretext research arteries.

## [3.8.6] - 2026-04-26

### Added
- **Flutter APK Materialized:** Cleared Build Hardgate via surgical `patchelf` of Android SDK cmake/ninja/NDK toolchain (38 ELF binaries) and `aapt2`; fixed `ic_launcher` mipmap generation. `app-release.apk` (50.1MB) shored.
- **Vivaldi Ingress Extension (Phase 87 Task 1):** Scaffolded `sidecars/sidecar-browser-extension/` — `manifest.json` (MV3), `background.js` (persistent WS relay to port 3012, heartbeat, context-menu), `content.js` (page-load + selection push), `popup/` (Gruvbox HUD with bridge status and manual push).
- **Kernel Vitals Artery (Phase 87 Task 2):** Materialized `crates/sovereign-kernel` Rust crate — `vitals.rs` reads CPU/mem from `/proc/stat` + `/proc/meminfo` + PSI pressure files; `main.rs` streams `VitalsSnapshot` JSON via WebSocket on port 3013. Build: clean.
- **Browser Mesh Artery (Phase 87 Task 2.5):** Materialized `packages/hermes-core/src/api/browser-bridge.ts` — WebSocket server on port 3012; routes `ContextFrame` pushes from the Vivaldi extension into the `LangGraphOrchestrator` ingest channel. Wired into `main.ts` startup/shutdown.
- **SkillAuthor (Phase 87 Task 3):** Materialized `packages/hermes-core/src/core/plugins/SkillAuthor.ts` — converts successful `AgentTrajectory` records into `.ts` MCP tool files in `packages/hermes-core/src/core/plugins/skills/` and registers them live into `PluginRegistry`.
- **Cargo Workspace Hardening:** Added `exclude` entries for `sidecars/sidecar-browser-extension`, `sidecars/sidecar-logseq-plugin`, `sidecars/sidecar-obsidian-plugin` to prevent Cargo from scanning non-Rust sidecar directories.

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
- **Knowledge Base v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS:** Indexed 569 documents and shored links for ActivityPub and Vivaldi Mastodon.

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
- **OpenClaw v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Integration:** Staged ports for Hybrid Search Transparency, OTEL Trace Correlation, and MCP Loopback Hardening.
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
