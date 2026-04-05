# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
