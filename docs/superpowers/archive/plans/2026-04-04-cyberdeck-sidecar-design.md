# Design: Cyberdeck Sidecar & Quick-Hack HUD (v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** 2026-04-04
**Target:** Phase 23 (Neural World Engine)

## 1. Overview
The Cyberdeck Sidecar is a high-performance **Tactical Interface** (Egui/Rust) that acts as the "Hardware Mirror" for the Netrunner. It introduces a **Dual-Mode Interface** with a **Deep Dive (Program Hotbar)** and a **Ghost Protocol (Quick-Hack HUD)**, synchronized via the **Deck-Bus (VSB Shared Synapse)**.

## 2. Architecture: The Dual-Mode HUD
The sidecar is a modular component managed by the **Crush CLI**, integrated into the **Netrunning Ecosystem** (Node A Rules Judge + Netrunning Sidecar).

### 2.1 Deep Dive Mode (Program Hotbar)
- **Program Tile-Grid:** A custom Egui widget that renders currently loaded Programs (ZAP, WORM, KILLER) as tactical tiles.
- **Tactical Handshake:** Clicking a program "Arms" it in the `DeckBus`. The **Netrunning Sidecar** (Isometric Tower) detects the selection and highlights valid target nodes (e.g., Black ICE) for execution.

### 2.2 Ghost Protocol Mode (Quick-Hack HUD)
- **Proximity Scanner:** A scrolling list of nearby `INTERACTIVE_*` Ghost Objects (Cameras, Door Locks, Turrets) detected by Node A's **Tactical-MMU**.
- **Quick-Hack Intents:** Clicking an object reveals available surface-level hacks (Ping, Glitch, Loop), which are sent as **Sub-1ms VSB Intents** to the 1B Judge for immediate physical resolution.

### 2.3 Deck-Bus VSB Protocol (Mechanical)
- **DeckState Block:** A synchronized shared memory block for tracking hardware health and armed status.
- **DeckState Schema:**
    - `armed_program_id`: Selected program in the Hotbar.
    - `deck_memory_load`: Current RAM usage vs. capacity.
    - `heat_level`: Thermal state affecting hack DV.
    - `proximity_targets`: Filtered array of nearby Ghost Objects for the Quick-Hack HUD.

## 3. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
