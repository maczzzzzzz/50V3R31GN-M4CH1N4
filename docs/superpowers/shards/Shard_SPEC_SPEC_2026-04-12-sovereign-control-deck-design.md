# Sovereign Control Deck: Design Specification

**Status:** DRAFT (Awaiting User Review)
**Date:** 2026-04-12
**Author:** Gemini CLI (Strategist)
**Context:** 50V3R31GN-M4CH1N4 / Phase 49+

## 1. Vision & Purpose
The **Sovereign Control Deck** is an evolution of the `deck-igniter` CLI. It replaces the standard process list with a high-fidelity, tabbed command center that matches the visual language of the Rust/Egui sidecars. It introduces a **Purpose-Driven Glitch Engine** that uses visual corruption to signal system health and governance conflicts.

## 2. Visual Language (Unified HUD)
To ensure 100% parity with the Sovereign Trinity aesthetic:
- **Palette:** Black-Ice (`#ff003c` Red, `#080810` Deep Black, `#1a1a2e` Dim).
- **Typography:** Fixed-width only. Headers follow the `:/TAB //` pattern.
- **Borders:** Replaces rounded corners with ASCII block shards (`█`, `▓`, `▒`, `░`) and double-line frames.
- **Tabs:** Horizontal selection at the top of the terminal.

## 3. Component Architecture
### 3.1 Tabbed Views
1. **`:/IGNIT3 //` (Ignition):** Primary supervisor. Monitors health, PIDs, and provides lifecycle controls (Reset/Kill).
2. **`:/V1SU4L //` (Vis-Audit):** Text-based representation of active WebGL shroud states and tactical radar heat.
3. **`:/L0G5 //` (Telemetry):** Streamed audit results from the Gauntlet Engine and Node B JS errors.
4. **`:/C0N7R0L //` (Nucleus):** System actions (Vault seal/open, Nix rebuild, Node A reboot).

### 3.2 The Glitch Engine (Purpose-Driven)
The UI state is managed by a `GlitchIntensity` float (0.0–1.0).
- **Healthy (0.0):** Static, high-contrast.
- **Warning (0.3 - 0.6):** Tab headers flicker; occasional leet-speak character swaps in labels.
- **Conflict (0.7 - 1.0):** Borders jitter; entire character set maps to Parseltongue symbols; triggered by `conflict_interrupt` or `StateError`.

## 4. Technical Implementation (Go/Bubble Tea)
- **State Management:** The `Model` is refactored into a `Switch` statement in `View()` based on the `activeTab` state.
- **Style Library:** A new internal package `pkg/ui` (or local variables) will consolidate the `lipgloss` styles for reuse.
- **Mesh Integration:** The Igniter will optionally connect to the shared MCP socket or read from `data/logs/mcp-bridge.log` to determine the global corruption level.

## 5. Success Criteria
- [ ] 100% visual parity with `sidecar-cyberdeck` navigation patterns.
- [ ] Glitch effects are tied to actual process errors or governance events.
- [ ] No performance regression in the process supervisor logic.

---
*Verified by the Sovereign Strategist v3.8.7.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
