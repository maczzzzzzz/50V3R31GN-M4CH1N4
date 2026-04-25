# Design: Atlas Radar Evolution & ST3GG Grounding (v3.7.0)
**Date:** 2026-04-04
**Target:** Phase 23 (Neural World Engine)

## 1. Overview
The Atlas Radar Evolution transforms the `sidecar-atlas` into a high-performance **Strategic Command HUD**. It introduces a **Scanner HUD** pass to visualize hidden physical data embedded in map assets via **ST3GG (LSB Steganography)** and a **Command Interceptor** layer for interactive, coordinate-based mission generation.

## 2. Architecture & Data Flow: The Ghost Object Protocol
We introduce the **Ghost Object Protocol** to move "latent physical facts" from Node A's pixel-perception to the operator's HUD and the AI's mission-weaving context.

### 2.1 Extraction & Mirroring (Node A - ZeroClaw)
- **ST3GG Scanner:** The `Tactical-MMU` performs a high-speed LSB scan of active map assets to extract "Ghost Objects" (e.g., hidden contraband, wall-ports, structural weaknesses).
- **VSB HiddenState:** These objects are serialized into a `GhostBlip` array and pushed to a new `HiddenState` block in the VSB Shared Synapse.
- **GhostBlip Schema:**
    - `x, y`: Physical map coordinates.
    - `id`: Unique identifier (e.g., `CACHE_77`).
    - `stego_payload`: Raw data extracted from pixels (e.g., "Contains: Militech Prototype").
    - `visibility_mask`: Bit-field for "Detected" (HUD visible) vs. "Latent" (AI only) status.

### 2.2 Visualization (Sidecar-Atlas - Scanner HUD)
- **Scanner Pass:** A dedicated Egui/Rust rendering pass that uses a flickering "Pulse" shader to visualize `GhostBlips`.
- **Dithered Outlines:** Ghost Objects appear as red-dithered outlines, indicating they are "Physically Grounded" but not yet "Revealed" in the Foundry VTT scene.

### 2.3 Interaction (Node B - Director)
- **Command Interceptor:** An input listener in the Atlas window allows "Click-to-Generate." Clicking a coordinate or Ghost Object sends a **Radar-Intent** packet to Node B.
- **Mission Weaver:** A `claw-code` plugin in the `director-rs` harness receives the Intent. It injects the `stego_payload` and `coordinates` as **Hard Constraints** into the 12B Brain's prompt, forcing the generated mission to revolve around that specific physical secret.

## 3. Systemic Use Cases
- **Night Market Intelligence:** Visualizing hidden faction inventory or contraband locations before they are "officially" revealed.
- **Hideout Reconnaissance:** Identifying structurally weak points or hidden wall-ports in enemy hideouts via the Scanner HUD.
- **Anchored Mission Design:** Clicking a Heywood alleyway to generate a "Black Trade" mission specifically involving the prototype deck hidden in the dumpster at that coordinate.

## 4. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
