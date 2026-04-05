# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
