# ◈ THE ENCYCLOPEDIA : PHYSICAL MAP (v3.8.8)
**Date:** Friday, May 1, 2026
**Status:** MAPPED

This document maps the physical directories and core files of the Sovereign Machina to their technical purpose and origin phase.

## 1. CORE OS (NERVOUS SYSTEM)
- `packages/hermes-core/src/core/hermes/`: **The Brain.** Home of `HermesSingularity.ts` (Orchestration) and `SovereignObserver.ts` (Vision).
- `packages/hermes-core/src/core/perception/`: **The Senses.** Home of `VisualMonitorService.ts` (CDP Neural Uplink) and `MobileVisionArtery.ts`.
- `packages/hermes-core/src/core/memory/`: **The Hippocampus.** Home of `SynapseStore.ts` (Vector DB) and `HeadlessDatalog.ts`.
- `packages/hermes-core/src/shared/`: **The Synapse.** Common protocols, schemas, and loggers used across the Node B environment.

## 2. THE PHYSICAL HAND (INGRESS/EGRESS)
- `crush/`: **The Master Controller.** Go-native CLI and bridge daemon.
    - `main.go`: TUI and command dispatcher.
    - `proxy.go`: Unix socket to HTTP/Redis gateway.
    - `st3gg.go`: Steganographic engine.
    - `identity_st3gg.go`: V2F identity pulse (Phase 106).
- `crates/hermes-router/`: **The Artery.** Rust-based high-throughput inference proxy.
    - `main.rs`: Dynamic multi-node model routing.
    - `security.rs`: V2F token extraction (Phase 106).
- `sidecars/sidecar-proxy/`: **The Shadow Proxy.** (CLIProxyAPI) Provides OpenAI/Claude compatibility for local models.

## 3. THE OPTICAL LAYER (HUD/UI)
- `dashboard/`: **The Command Deck.** Next.js-based OS dashboard.
    - `app/os/PretextShroud.tsx`: The kinetic geometric canvas (Fluid Smoke).
- `terminal-app/`: **The Mobile HUD.** Flutter-based mobile interface.
    - `lib/services/vsb_service.dart`: Mobile VSB listener.

## 4. MECHANICAL SECTORS
- `zeroclaw/`: **The Combat/Rules Engine.** Isolated Rust environment for deterministic simulations (Cyberpunk RED).
- `gauntlet/`: **The Testing Floor.** Phase-based verification shards.
    - `phases/`: 113+ individual test files ensuring architectural parity.

## 5. ORPHANED & LEGACY PRIMITIVES (STILL PHYSICAL)
- `scripts/archive/`: Repository for legacy ignition and migration tools.
- `docs/superpowers/archive/`: The historical record (Phases 0-97).

---
**::/5Y573M-N071C3 : PHYSICAL_MAP_LOCKED. // 50V3R31GN-M4CH1N4**
