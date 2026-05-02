# Design Specification: Phase 11 — Neural Uplink (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Subject:** Hardware-Level Electron Interaction & Visual Grounding
**Status:** DESIGN FINALIZED

## 1. Objective
Establish a persistent **Neural Uplink** between the Node B Orchestrator and the Foundry VTT Electron App. This uplink leverages the Chrome DevTools Protocol (CDP) to grant the AI direct visual perception and UI-control capabilities beyond the standard API sandbox.

## 2. Component Architecture

### 2.1 The Visual Monitor (Node B)
A new service in `src/core/` that manages the CDP connection.
- **Perception:** Triggers periodic GPU-level screenshots for LLava 1.6 analysis.
- **Reactivity:** Watches for DOM changes (e.g. new dialogs or sidebars) to adjust narrative focus.

### 2.2 The Inversion Engine (Visual Hardening)
Extends the **Black-Ice CSS Layer** with real-time injection.
- **Hot-Fixes:** Injecting CSS fixes for v12 / CPR 0.9.3 layout shifts on the fly.
- **Narrative FX:** Triggering "Neural Feedback" (screen shakes, color shifts) via CDP CSS overrides.

### 2.3 The Automation Hub
Allows Node B to "Drive" the Foundry UI.
- **Tooling:** Uses the `chrome-devtools-mcp` to click elements, type text, and manage the Foundry sidebar autonomously.

## 3. Protocol: CDP Handshake
- **Transport:** WebSocket over Port 9222.
- **Identifier:** Uses the `/json` endpoint to find the primary `page` target for the Foundry world.
- **Payloads:** JSON-RPC 2.0 (CDP Standard).

## 4. Security & Isolation
- **Loopback Only:** Port 9222 is strictly bound to `localhost`.
- **2nd Signature:** "Destructive" UI actions (e.g. deleting actors) still require the v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS `ACK` signature in the terminal.


---
**LINKS:** [[OS_CORE]]
