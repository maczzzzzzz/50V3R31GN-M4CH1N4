# Design: Netrunning Sidecar & Isometric Tower (v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** 2026-04-04
**Target:** Phase 23 (Neural World Engine)

## 1. Overview
The Netrunning Sidecar is a high-performance **Isometric Interface** (Egui/Rust) designed for sub-1ms Net Architecture combat. It introduces a **ST3GG Port Handshake** that only activates the HUD when the character is physically near a hidden map port, and an **Isometric Tower HUD** for visualizing and navigating Net nodes.

## 2. Architecture: The "Jack-In" Handshake
The sidecar is a modular component managed by the **Crush CLI**, synchronized via the **Net-Bus (VSB Shared Synapse)**.

### 2.1 ST3GG Port Integration (Node A - ZeroClaw)
- **Physical Trigger:** The `Tactical-MMU` on Node A monitors character coordinates. When within 2m of a `PORT_*` Ghost Object (embedded via ST3GG), it broadcasts an `ACCESS_PORT_AVAILABLE` signal.
- **Sidecar Activation:** The Netrunning Sidecar detects the signal and "Powers Up," automatically pulling the `stego_payload` (Net Architecture JSON) from the VSB.

### 2.2 Isometric Tower HUD (Visual)
- **TowerHUD Render-Pass:** A custom Egui widget that renders a stack of glowing red nodes representing the Net Architecture (File, Control, Password, Black ICE).
- **Z-Axis Clipping:** Uses depth-ordering to create a 3D "Tower" feel for level-by-level navigation.

### 2.3 Net-Bus VSB Protocol (Mechanical)
- **NetState Block:** A synchronized shared memory block for sub-1ms hacker-vs-ICE combat.
- **Combat Handshake:**
    1. **Action:** Sidecar writes a `HACK_ACTION` (e.g., ZAP, COPY) to the `NetBus`.
    2. **Logic (Node A):** The 1B Judge performs the Interface check (vs. Node DV) and updates the `NetBus` state (e.g., ICE HP, Node Path).
    3. **Visual Update:** The sidecar renders the result within 16ms.
    4. **Commit:** If the hack affects the physical world (e.g., a door), Node B pushes the state change to Foundry VTT via Port 9222.

## 3. Data Flow & Schema: `NetState`
- **id**: Current node being accessed.
- **node_path**: Bitmask of architecture levels.
- **interface_dv**: Difficulty Value enforced by the 1B Judge.
- **hacker_stats**: Interface, Cyberdeck Synapse, Active Programs.
- **ice_state**: HP and Status Effects of active Black ICE.

## 4. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
