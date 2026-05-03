# ◈ THE ENCYCLOPEDIA : PHYSICAL MAP (v3.8.30-RENEWAL)
**Status:** MAPPED // CLINICAL_FORK_ALIGNED

This document maps the physical directories and core files of the Sovereign Machina to their technical purpose and origin phase.

## 1. CORE OPERATOR HARNESS (NERVOUS SYSTEM)
- `sidecars/hermes-agent-nous/`: **THE HARNESS.** Forked upstream Hermes Agent (Python).
    - `run_agent.py`: The Logic Core.
    - `tools/`: Native capabilities (Browser, Git, Terminal).
    - `agent/`: Reasoning and interaction engine.
- `crates/sovereign-mcp-bridge/`: **VSB Link.** Rust-based MCP server exposing hardware telemetry to the Harness.
- `crates/hermes-router/`: **Hardened Artery.** Multi-node routing and zero-trust security.

## 2. THE PHYSICAL HAND (INGRESS/EGRESS)
- `crush/`: **Physical Sovereignty Interface.** Go-native primitives.
    - `main.go`: VSB command dispatcher.
    - `st3gg.go`: Steganographic engine for tool-signing.
- `crates/`: **Hardened muscles.** Tactical Authority-based high-performance components.
- `sidecars/`: **Decoupled Organs.** Standing by for MCP conversion.

## 3. THE OPTICAL LAYER (HUD/UI)
- `dashboard/`: **Pretext Command Deck.** Next.js interface with embedded Hermes TUI.
    - `app/os/PretextShroud.tsx`: The kinetic geometric canvas (Fluid Smoke).
    - `components/HermesInteractiveTUI.tsx`: Python Harness ingress.
- `terminal-app/`: **Mobile Authority.** Flutter-based mobile interface re-mapped to Python Gateway.

## 4. DECOMMISSIONED (SHADOW LOGIC)
- `packages/hermes-core/`: **Legacy Engine.** Decommissioned in Phase 118.
- `scripts/archive/`: Repository for legacy ignition and migration tools.

---
**::/5Y573M-N071C3 : PHYSICAL_MAP_LOCKED. // 50V3R31GN-M4CH1N4**
