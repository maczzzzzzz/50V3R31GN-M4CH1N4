# ◈ THE ENCYCLOPEDIA : PHYSICAL MAP (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** Saturday, May 2, 2026
**Status:** MAPPED

This document maps the physical directories and core files of the Sovereign Machina to their technical purpose and origin phase.

## 1. CORE OS (NERVOUS SYSTEM)
- `packages/hermes-core/`: **The OS Nervous System.** Standardized TypeScript monorepo package.
    - `src/core/hermes/`: **The Brain.** Home of `HermesSingularity.ts` (Orchestration) and `SovereignObserver.ts` (Vision).
    - `src/core/perception/`: **The Senses.** Home of `VisualMonitorService.ts` (CDP Neural Uplink) and `MobileVisionArtery.ts`.
    - `src/core/memory/`: **The Hippocampus.** Home of `SovereignDashboardService.ts` and memory primitives.
    - `src/db/`: **The Artery of Truth.** `UnifiedOracleClient` (RKG) and SQLite schemas.
- `crates/`: **The Hardened Arteries.** Rust-based high-performance components.
    - `hermes-router/`: **The Cognition Proxy.** Multi-node model routing and zero-trust security.
    - `sovereign-sdk/`: **The Protocol.** Shared binary framing and message schemas.

## 2. THE PHYSICAL HAND (INGRESS/EGRESS)
- `crush/`: **The Master Controller.** Go-native CLI and bridge daemon.
    - `main.go`: TUI and clinical command dispatcher.
    - `proxy.go`: Unix socket to HTTP/Redis gateway.
    - `st3gg.go`: Steganographic engine.
    - `identity_st3gg.go`: V2F identity pulse.
- `sidecars/`: **Modular Organs.** Helper services in Go, Rust, and Node.js.
    - `sidecar-proxy/`: **The Shadow Proxy.** Provides OpenAI/Claude compatibility for local models.
    - `sidecar-browser-extension/`: **Vivaldi Ingress.** Maps browser context into the OS.
    - `stash/`: **Synapse Artery.** Local-first memory consolidation.
    - `plur/`: **YAML Synapse.** Shared persistent agent memory.

## 3. THE OPTICAL LAYER (HUD/UI)
- `dashboard/`: **The Command Deck.** Next.js-based OS dashboard.
    - `app/os/PretextShroud.tsx`: The kinetic geometric canvas (Fluid Smoke).
- `terminal-app/`: **The Mobile HUD.** Flutter-based mobile interface.
    - `lib/services/vsb_service.dart`: Mobile VSB listener.

## 4. MECHANICAL SECTORS (PLUGINS)
- `plugins/sovereign-red-plugin/`: **Simulation Sector.** Isolated environment for Cyberpunk RED.
    - `zeroclaw/`: **The Rules Engine.** Rust-based deterministic physics calculations.
    - `RED_RULES.md`: The Physics Constitution.
- `gauntlet/`: **The Testing Floor.** Phase-based verification shards.
    - `phases/`: 113+ individual test files ensuring architectural parity.

## 5. ORPHANED & LEGACY PRIMITIVES
- `scripts/archive/`: Repository for legacy ignition and migration tools.
- `docs/superpowers/archive/`: The historical record (Phases 0-97).

---
**::/5Y573M-N071C3 : PHYSICAL_MAP_LOCKED. // 50V3R31GN-M4CH1N4**
