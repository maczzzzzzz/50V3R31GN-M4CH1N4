# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.4.2.html).

## [3.4.8] - 2026-04-24
### Added
- **Sovereign Strategic Oracle (Phase 74):** Deployed the **Exa-rs** (Rust) and **Exa-go** (Go) SDKs for high-performance semantic web perception.
- **Shield Gate:** Materialized the zero-trust hallucination detector in Rust to verify all incoming external data.
- **Synapse Traceback (Phase 75):** Shored the **sovereign-healer** crate for vector-weighted self-healing and regression prevention.
- **GEPA Evolution:** Initialized the Genetic-Pareto Prompt Evolution loop for autonomous skill and identity refinement.
- **Sovereign Artery (Phase 76):** Materialized the **Hermes Cognition Router** (Rust) and **Atomic Profile Engine** (Rust/Mooncake) for real-time context switching.
- **Interface Sociotomy:** Locked the OS-Default boot sequence and migrated tactical commands to the Hermes TUI registry.
- **Sovereign MemPalace:** Implemented the OS architecture semantic mapping (`reconstruct-os-palace.sh`) and integrated it into the universal sync.
- **Aesthetic Expansion:** Standardized the **Gruvbox Canonical Standard** across Windows Terminal, VS Code, Next.js Dashboard, Flutter HUD, and Foundry VTT.
- **Navigation Hub:** Materialized `NAVIGATOR.md` as the central declarative entry point for system documentation.

## [3.4.3] - 2026-04-24
### Added
- **Physical Sovereignty (Phase 73):** Executed the **Vault Sociotomy**, physically sharding the 3,000+ RKG knowledge graph into Hot (Active) and Cold (Archive) layers to achieve <2s Obsidian boot times.
- **Obscura Stealth Sidecar:** Materialized the **Obscura** Rust-based browser (30MB RAM) as a Nix-managed sidecar service on Node C.
- **A11y Tree Navigation:** Rewrote the `sovereign-observer` as a CDP-native Accessibility Tree navigator, enabling stealthy @element-based interaction.
- **Hermes-Kanban Manifest Sync:** Deployed a Go-based sync daemon and git `post-commit` hook to autonomously align `IMPLEMENTATION_PLAN.md` with the Hermes Kanban board.


### Changed
- **Vault Governance:** Updated `reconstruct-palace.sh` and Obsidian config to explicitly exclude the `RKG_Archive` from the hot index.
- **Observer Architecture:** Pivoted from raw screen capture to structured CDP/A11y tree interaction for increased reliability and stealth.

## [3.4.2] - 2026-04-24
### Added
- **Graph-Relational Synapse (Phase 72):** Successfully materialized the **Synapse** vectorized knowledge graph within `SovereignIntelligence.db`.
- **Vectorized Triplets:** Implemented `OsTripletService` utilizing `sqlite-vec` for 768-dimension semantic search and batch-upsert of (subject-predicate-object) facts.
- **Synapse Synthesis Pipeline:** Deployed the **JARVIS-style** capture and brief system (`SynapseCapture`, `SynapseBrief`) to autonomously synthesize session activity from voice, logs, and observations.
- **Intelligence HUD Integration:** Materialized the `SynapsePanel` UI component in the `/os` dashboard route, enabling real-time triplet inspection, semantic search, and summary briefs.
- **GEPA Research Integration:** Codified the transition path for autonomous self-evolution (NousResearch) in the v3.4.x roadmap.

### Changed
- **Synapse Sharding:** Formally transitioned system functional memory from flat markdown files to a vectorized graph-relational store.

## [3.4.1] - 2026-04-24
### Added
- **System Sociotomy (Phase 71):** Successfully performed the architectural "Cut," physically separating the Sovereign Intelligence OS from the Cyberpunk RED simulation.
- **Sovereign Intelligence Store:** Materialized `SovereignIntelligence.db` as the primary repository for OS-level functional logic, system state, and zero-trust audit trails.
- **Dual-Profile Identity System:** Deployed `SOVEREIGN-IDENTITY.md` in the repository root, enabling dynamic profile switching between `[SOVEREIGN_OS]` (Reasoner) and `[RED_DIRECTOR]` (Narrative).
- **Dashboard Sociotomy:** Re-engineered the Next.js dashboard into isolated `/os` (Intelligence HUD) and `/red` (Simulation Module) routes with profile-aware navigation.
- **Hermes TUI Integration:** Synchronized VSB payloads with the Hermes v3.4.2 "Interface Release," designating the React/Ink TUI as the primary shell for the AI OS.
- **Drift Sentinel Droid:** Materialized a specialized integrity guardian (`.factory/droids/drift-sentinel.md`) to autonomously scan manifests for version and identity drift.
- **Drift Audit Skill:** Codified the `drift-audit` skill to provide a bit-identical workflow for maintaining system-wide parity.
- **Surgical Node Synchronization:** Materialized `scripts/ops/node-surgical-sync.sh` to enforce bit-identical logic across the Trinity while purging multi-gigabyte mirroring bloat (weights, archives) from slave nodes.
- **Universal Hardening:** Integrated the `treefmt` universal linter across the repository to enforce bit-identical consistency for Nix, Rust, Go, TypeScript, and Markdown.


### Changed
- **Artery of Truth Demotion:** Formally demoted `Akashik.db` to a "Simulation Shard," dedicated exclusively to Cyberpunk RED lore, NPCs, and mechanics.
- **Communicator Roles:** Designated the Go-native Crush CLI as the primary tactical communicator for RED Director mode, while the Hermes TUI handles OS orchestration.

## [3.3.1] - 2026-04-23
### Added
- **Vocal Task Extraction:** Integrated `LangGraphOrchestrator` on Node B to autonomously extract tasks, reminders, and spending intent from real-time transcripts via the VSB (`VOCAL_INTENT` payload).
- **Dynamic Conversation Archive:** Implemented a multi-log system in the Hermes HUD, allowing users to manage, switch, and purge multiple tactical conversation threads.
- **Node C Stable Runner:** Refactored Node C ignition to a high-fidelity `llama-server` wrapper, ensuring 100% GPU offloading and environment stabilization.

### Fixed
- **Whisper Mel-Filters Restoration:** Identified and repaired corruption in `melfilters.bytes`, restoring canonical binary data for frequency-domain audio processing.
- **HUD Boot Stabilization:** Decoupled service initialization from the Flutter `main()` path, neutralizing the "Black Screen" hang and ensuring immediate UI materialization.
- **Transcription Artery Fix:** Corrected Whisper model discovery logic and VAD sensitivity, enabling sub-second real-time speech-to-text streaming.
- **Foreground Artery Hardening:** Shored Android `dataSync` service mandates for the persistent "Eye" status icon, preventing OS-level process termination.
- **Artery Manager Stabilization:** Pivoted Node C daemon to a detached `screen` session to ensure environment persistence and background resilience.
- **Handshake Protocol Force:** Neutralized SSL handshake timeouts on internal Tailscale routes by forcing unsecure `ws://` and `http://` for local node arteries.

## [3.3.0] - 2026-04-23
### Added
- **Phase 68: Alpha APK Materialization:** Full Android HUD APK successfully forged with high-fidelity icons and notification logic.
- **Universal Theme Orchestration:** Implemented a modular theme system supporting `50V3R31GN-GR33N` and `50V3R31GN-R3D` with real-time propagation from Mobile HUD to Foundry VTT.
- **Director REST API:** Materialized Node B REST interface on port `3011` for system-wide orchestration.
- **Hermes Chat Persistence:** On-device local storage for chat history with auto-sync capability to Node C's `artery_history.db`.
- **Sovereign Reminder System:** Integrated exact alarm notifications triggered by voice or manual task entry.
- **Persistent Eye Status:** Mandatory background status icon shored in the Android notification bar.

### Changed
- **Neutral Visual Identity:** Purged red accents from the master logo for theme-agnostic deployment.
- **Artery Manager Evolution:** Added `/sync/chat` and `/system/theme` endpoints to the Rust-native daemon.
- **Foundry Mesh v12:** Enhanced CSS injection to support dynamic theme class switching.

### Fixed
- **Nano Banana 2 Pipeline:** Corrected model targeting to `gemini-3.1-flash-image-preview` and neutralized spending cap blockers.
- **Node B Handshake:** Resolved ClawLink ECONNREFUSED issues via Crush Proxy 'proxy' mode activation.
- **Reminders Fix:** Shored Android notification permissions and synchronized physical device timezones.

## [3.2.21] - 2026-04-21
### Added
- **Mission Success (Phase 69):** Ignited the **Full-Spectrum Sovereign Audit (FSSA)**. Verified Node A (Optical), Node B (Director), and Node C (Strategic Strategic Oracle) status as **ONLINE**. Completed 100% cross-shard verification.
- **Agentic Crash Recovery & Persistence Implementation (Phase 68.5):** Materialized real-time SQLite auto-saving in `LangGraphOrchestrator` using `better-sqlite3` and implemented the `AutoResumeDaemon` to autonomously resume dangling threads upon boot, ensuring 100% state persistence against power loss and process crashes.
- **Agentic Crash Recovery & Persistence (Phase 68.5):** Synthesized 2026 research on "AI Amnesia" and generated specs/plans for implementing a LangGraph `SqliteSaver` checkpointing system to provide 100% protection against power loss and process crashes.
- **Secure Subnet Tunneling & Alpha Build (Phase 68):** Shored research and specs for encapsulating the mesh within a zero-config VPN and compiling the mobile deployment binary.
- **Machina Terminal HUD Overhaul:** Achieved complete feature parity with the official OMI companion app. Transformed the read-only HUD into an interactive 4-tab dashboard (Artery, Tasks, Synapse, Settings) equipped with dynamic IP tunneling, real-time Agent Chat, and a direct Push-To-Talk Mic interface, all rendered through an optimized VT323 CRT Scanline aesthetic.
- **Agentic Audit Trails & Ouroboros Feedback:** Implemented an immutable JSONL forensic ledger (`agentic_audit_trail.jsonl`) that logs all disk writes and reasoning traces, injecting past FATAL failures into current tasks as dynamic negative constraints.
- **Akashik Knowledge MCP:** Deployed `query_akashik` tool allowing Hermes to perform zero-hallucination vector searches of the `akashik_guides` index and developer script manifests.
- **Visual Skill Crystallization:** Materialized `VisualSkillCrystallizationPipeline` to dynamically author and hot-reload `.ts` MCP tools mapped against historical optical frame hashes.
- **Shadow Mode Self-Healing:** Activated the `ShadowModeHealerDaemon` to autonomously correct `DEGRADED` skills in a background queue via real-time Node A OCR and VLM parsing.
- **Darwinian Skill Induction:** Ingested real-time vocal `Operator Sentiment` from the VSB to dynamically adjust $W_{soul}$, $W_{pulse}$, and $W_{cost}$ fitness weights.
- **Dynamically Learning Control System (Phase 67.9):** Shored research, specs, and implementation plans for Metacognitive Skill Crystallization and Shadow Mode Self-Healing.
- **Vocal Hardening & Synergy (Phase 67.8):** Implemented an RMS-based Voice Activity Detection (VAD) gate in the Rust Artery Daemon to prevent VRAM waste on background noise.
- **Contextual Intent Routing:** Replaced hardcoded keyword matching with a decoupled JSON payload (`VOCAL_INTENT`) for infinite LLM-based tool scalability via Node B (MCP).
- **Visual Synergy:** Added optical context injection logic (`/observer/hash`) to append the latest screen hash to vocal intents, granting the voice interface spatial awareness.
- **Sovereign Transcription:** Materialized a Rust-native `candle-transformers` Whisper inference loop inside the Node C Artery Manager, achieving zero-latency raw PCM decoding and diegetic intent extraction.
- **Systematic Audit:** Performed exhaustive code audit and type-hardening of the Sovereign Trinity materialization.
- **Sovereign Observer:** Materialized the **Rust-native** screen capture daemon (`sovereign-observer`) for 100% screen awareness on WSL2.
- **Vocal Soul Materialized:** Consolidated the OMI WebSocket bridge and real-time audio ingestion into the Rust **Artery Manager**.
- **Machina Terminal HUD:** Shored a functional **Flutter companion app** with R3D_V01D CRT aesthetic and real-time VSB/Artery handshaking.
- **Kinetic VFX Engine:** Implemented a **Three.js particle system** in the Shroud for tactical 3D gunshot and spark manifestation.
- **Healer Protocol:** Shored Layer 2 Re-planning and self-correction logic in the Hermes orchestrator to maintain mission continuity.
- **Self-Healing Skill Forge:** Codified the **Maestro** pattern for autonomous workflow induction and agent-authored skill generation.
- **Darwinian Induction:** Materialized the weighted trajectory evaluation spec ($F > 0.85$) for learning priority.
- **Sovereign Weighting:** Codified the **Identity Grounding ($W_i$)** gating protocol to prevent identity drift.
- **Phase 67.5: Rust Artery Daemon:** Materialized the Node C Artery Manager in **Rust** (`artery_manager.rs`) via Axum (port 7340).
- **RDT Rust Port:** Bit-identically ported the OpenMythos architecture to `zeroclaw/src/rdt/mod.rs` for recursive strategic depth.
- **OpenMAIC Pipeline:** Materialized the "Outline -> Scene" generation pipeline in `src/core/outline-scene-builder.ts`.
- **Flutter Unblocked:** Surgically injected **Flutter SDK**, **Android Tools**, and **JDK 17** into `flake.nix`.
- **Manifest Governance:** Created the reusable **`manifest-scribe`** skill to automate bit-identical ledger synchronization.
- **Artery Scripts:** Wired `npm run sync` and `npm run scribe:lock` in `package.json` for historical shriving.

### Fixed
- **Type Artery Hardening:** Repaired critical TypeScript blockers in `HealerProtocol.ts`, `LangGraphOrchestrator.ts`, and `logger.ts` (strict type compliance).
- **Rust Hygiene:** Neutralized dead code and unused imports in `artery_manager.rs`, `perception`, and `steganography` crates.
- **Blocker Neutralization:** Repaired 4+ tactical gaps identified in the `claudeReport.md` audit.
- **VRAM Buffer:** Restored the 1GB safety margin on Node C via host-native Llama-Server (Q5 Authority).

## [3.2.20] - 2026-04-20
### Added
- **Storage Artery Materialized:** Formatted and shored a **500GB SSD** on Node C at `/mnt/vocal_soul` (ext4). Persistent via `/etc/fstab`.
- **Polymorphic Neural Arsenal:** Shored bit-identical **E4B-it-OBLITERATED** minds on Node C in three tactical quantizations: Q5 (Authority), Q4 (Comm), and Q3 (Berserker).
- **Vocal Artery Spec:** Formalized the **Machina Hub Lite** and **Unified Shifting** (VRAM Gating) patterns for diegetic voice control.
- **Optical Artery Complete:** Shored **3,021 internal shards** on Node C via Docling/ColPali burst, surpassing the target.
- **Canonical OBLITERATED Minds:** Shored high-fidelity GGUFs on Node B (Q8_0) and Node C (Q5_K_M) using the **Aria2 Strike**.
- **Physical Artery Hardening:** Materialized the **NVIDIA Mesh** on Node C host for Dockerized GPU acceleration.

### Fixed
- **Terminology Drift:** Surgically neutralized 50+ logical echoes ("Strategic Strategic...") across the manifest artery.
- **Environment Corruption:** Repaired Node C `.venv-oracle` by shoring `poppler-utils` and visual libraries.

### Changed
- **Pod Topology:** Sharded pod roles: Node B holds **Total Sight** (Vision); Node C holds **Total Logic** (1.1GB reclaimed VRAM).
- **Cognition Backplane:** Pivoted Node C to **Llama-Server (Host-Native)** to ensure bit-identical support for Gemma-4 GGUF headers.

<details>
<summary>Historical Archive (Older Versions)</summary>

... [Legacy versions preserved in master history] ...

</details>


---
**LINKS:** [[OS_CORE]]
