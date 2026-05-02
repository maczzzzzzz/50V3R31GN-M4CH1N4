# Design: Unified Cyberdeck & Tactical Scanner (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

**Date:** 2026-04-05
**Status:** Approved
**Vision:** Consolidate distributed sidecars into a single "Cyberdeck" interface with deep world-manipulation powers and zero-trust security.

## 1. ARCHITECTURE OVERVIEW

### 1.1 The Unified Sidecar (Rust/Egui)
- **Binary:** `sidecar-cyberdeck` (Consolidates `sidecar-atlas` and `sidecar-netrunning`).
- **Synapse:** Single `black_ice_state.mem` Mmap handle for all tactical data (Actors, Ghost Blips, Network Nodes).
- **Interface:** Tabbed navigation ([ATLAS], [NETRUN], [DECK/HACKS]).

### 1.2 The Sovereign Control Plane (Node B/Node A)
- **Director (Node B):** TypeScript orchestrator managing the WebSocket bridge and Mmap state updates.
- **Auditor (Node A):** Open-Reasoner-Zero-1.5B enforcing rules/security on all injected scripts.
- **Controller (Go):** `crush` CLI for user-driven world-state manipulation.

## 2. CORE FEATURES

### 2.1 The [SCAN] Revelation
- **Trigger:** Clicking `[SCAN]` in the `DECK` tab or `crush scan`.
- **Visuals:** 
    - **Foundry:** `canvas.effects.ping()` at player position.
    - **HUD:** Brief intensification of the Egui glitch shader (noise/jitter).
- **Logic:** The `DECK` tab populates a list of interactable objects (Doors, Lights, Turrets) and Mooks by filtering the local Mmap data (ST3GG `BLIP_OBJECTIVE` and `BLIP_HAZARD`).

### 2.2 The Glitch Engine (Immersion)
- **Mechanism:** Egui `PaintCallback` or custom shader applying hue-rotation, scanline jitter, and dithered noise.
- **Trigger:** Tied to `intrusion_level` in the Mmap. High intrusion (Enemy Netrunner active) creates hardware-level UI instability.
- **Alerts:** The `[NETRUN]` tab button pulses red when an intrusion is detected, persisting across all tabs.

### 2.3 World State Authority (WSA)
- **Actions:** `[UNLOCK]`, `[DIM-LIGHTS]`, `[HACK-CAMERA]`, `[SHUT-DOWN]`.
- **Flow:** User/AI Command → Node B → Node A (Rules Check) → Foundry `runScript`.
- **Feedback:** "ACCESS GRANTED" (Green overlay) or "FIREWALL REJECTION" (Red glitch) based on Node A's reasoning.

## 3. REFACTOR ALIGNMENT
- **Phase 1 (Rust):** Port `sidecar-atlas` and `sidecar-netrunning` logic into the new `sidecar-cyberdeck` crate.
- **Phase 2 (Go):** Expand `crush` CLI to support the new `WSA` command set.
- **Phase 3 (TS):** Implement the `runScript` security gate in `FoundryAdapter`.

---
*Verified by Gemini CLI v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
