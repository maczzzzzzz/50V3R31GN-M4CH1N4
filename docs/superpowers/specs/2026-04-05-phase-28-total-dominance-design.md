# Design: Phase 28 — Total Environment Dominance (v3.6.0)

**Date:** 2026-04-05
**Status:** Approved
**Vision:** Grant the AI and the User 100% physical sovereignty over the Foundry VTT environment via CDP synthetic input and chaos engineering.

## 1. ARCHITECTURE OVERVIEW

### 1.1 The Ghost Protocol (TypeScript)
- **Domain:** CDP `Input` Domain.
- **Service:** `GhostInputService` wrapping `Input.dispatchMouseEvent` and `Input.dispatchKeyEvent`.
- **Capability:** Physically drag tokens, click UI buttons, and trigger hotkeys without using Foundry's internal API.

### 1.2 The Scenario Engine (Go)
- **Engine:** Built into the `crush` CLI.
- **Role:** High-speed playback of `.ghost` JSON sequences (recorded coordinates and keys).
- **Chaos Monkey:** Randomizes network lag and memory pressure to test system resilience.

## 2. CORE FEATURES

### 2.1 Synthetic Physicality
- **Feature:** AI can "Demonstrate" actions to the player by physically moving their mouse cursor in the Foundry window.
- **Integration:** `sidecar-cyberdeck` displays a **[GHOST CONTROL ACTIVE]** flashing warning during synthetic input.

### 2.2 DevDom Command Surface
- **Command:** `crush devdom --force-state <json>`
- **Logic:** Direct CDP `Runtime.evaluate` to bypass all game logic and force a specific visual or mechanical state for testing.

### 2.3 Visual Regression Guard
- **Logic:** Periodically captures CDP screenshots and compares them to "Pristine State" hashes.
- **Healing:** If a UI element is missing, the AI automatically "forces" it back into existence via CDP injection.

## 3. SECURITY (ZERO-TRUST)
- **Node A Audit:** All synthetic mouse/keyboard sequences must be audited by Node A to ensure they don't perform "OS-level" escapes (e.g., trying to click the 'Close' button of the browser or access system menus).

---
*Verified by Gemini CLI v3.6.0 Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
