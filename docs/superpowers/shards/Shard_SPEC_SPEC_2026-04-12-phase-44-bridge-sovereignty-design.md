# Design Spec: Mesh Sovereignty & Motor Cortex
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Date:** 2026-04-12
**Phase:** 44
**Goal:** Implement the "Motor Cortex" within the Foundry Mesh to allow the Sovereign Machina to execute high-privilege administrative actions.

## 1. Overview
The **Motor Cortex** is the active counterpart to the Mesh's existing sensory layers (hovers, events). It provides a hardened command pipe for the AI to manipulate the Foundry environment directly, enabling automated campaign materialization.

## 2. Command Pipeline
The Mesh's `_dispatch` method is expanded to handle three primary "Motor" command types:

### 2.1 `create_actor`
- **Payload:** Raw Foundry Actor JSON data (Stats, Items, Images).
- **Execution:** Calls `Actor.create(payload)`.
- **Purpose:** Spawning mooks, NPCs, and boss entities from the RKG or archived packs.

### 2.2 `create_scene`
- **Payload:** Scene configuration (Background path, grid settings, vision state).
- **Execution:** Calls `Scene.create(payload)`.
- **Purpose:** Materializing forged campaign districts from the Atlas Forge.

### 2.3 `run_script`
- **Payload:** A string of raw JavaScript code.
- **Execution:** Uses **Socketlib** to execute the script as the Gamemaster (`this.socket.executeAsGM`).
- **Purpose:** Arbitrary environment manipulation (Light levels, wall toggling, FX triggers).

## 3. Security & Safety
- **Administrative Lock:** The Motor Cortex only initializes if the current user `isGM`.
- **Pretext Feedback:** Any execution failure within the motor handlers triggers an immediate "S1GN4L_L055" red overlay to notify the operator.

## 4. Integration
- **Socketlib Dependency:** Requires the `socketlib` Foundry module to be active for cross-client GM execution.
- **Machina Uplink:** Mapped to the `bridge.runScript()` and `bridge.createActor()` hooks in the `GauntletContext`.


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
