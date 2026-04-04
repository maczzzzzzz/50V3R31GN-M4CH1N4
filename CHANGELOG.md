# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-04-04
### Added
- **Linux-Native Migration:** Relocated Node B to internal NixOS/WSL filesystem (`/home/nixos/`) for O(1) FS performance.
- **Nix Sovereignty:** Established `shell.nix` and `flake.nix` for deterministic Node B dependency management.
- **Sovereign Highway (Phase 22.5):** New roadmap for Binary UDP stabilization between Node A and Node B.
- **Physicality Design (Phase 23):** Specs for autonomous NPC incarnation and `easy-phasey` integration.
- **SSH-Git Integration:** Secure, passwordless repository interaction for the NixOS environment.

### Changed
- **Binary Authority:** VSB Binary UDP established as the primary authority for rules validation.
- **Residency:** Shifted Node A authority to resident Llama-3.2-1B and Falcon (0.3B) models.
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
