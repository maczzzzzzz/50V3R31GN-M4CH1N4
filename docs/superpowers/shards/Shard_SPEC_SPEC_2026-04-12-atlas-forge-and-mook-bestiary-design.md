# Design Spec: Atlas Forge & NC_GANGS_CORPS Library
**Version:** 3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Date:** 2026-04-12
**Goal:** A side-loaded campaign generation engine and a comprehensive Obsidian "NC_GANGS_CORPS" archive, leveraging 4,000 seed points and the Night City Gang pack.

## 1. The Atlas Forge (Procedural World Builder)
The Forge is an offline tool used to synthesize full campaigns. It operates in a **Recursive Dream Loop** to ensure narrative variance and visual consistency.

### 1.1 The Dream Loop Pipeline
1.  **DREAM:** Node B selects a district and pulls RKG seeds. It generates a `MissionSpec.json`.
2.  **FORGE:** Droid Factory generates a map via **Nano Banano**, following the `MissionSpec`.
3.  **AWAKEN:** Dual Vision (Node A/B) audits the map for geometry and aesthetic leaks.
4.  **REMEMBER:** Node B writes the final Obsidian "Synapse" note, reconciling the spec with visual truth.
5.  **BAKE:** **St3gg** engine embeds the mission JSON into the map PNG's LSBs.

### 1.2 Replayability
- **Self-Contained Assets:** The baked PNG contains everything needed to re-materialize the scene (Walls, Lights, NPCs).
- **History Awareness:** The Forge checks existing Obsidian memories to prevent plot duplication across districts.

## 2. NC_GANGS_CORPS (The Threat Library)
The entire `entities_mooks` dataset is physicalized within the Obsidian vault to provide the operator with a "Tactical Intel" hub.

### 2.1 Library Structure
- **Path:** `D:\Obsidian_RKG\Actors\NC_GANGS_CORPS\<Faction_Name>\`
- **Note Content:**
    - **Frontmatter:** Faction, Tier, Threat, and source provenance.
    - **Stats:** Dataview-ready property blocks for REF, DEX, BODY, etc.
    - **Visual:** Embedded token portrait.
    - **Control Hook:** A "Spawn Token" button that triggers the Mesh module via Socketlib.

## 3. Integration & Materialization
- **Mesh Support:** The Foundry Mesh module is updated to extract St3gg metadata from any "Smart Map" dropped into the scene.
- **Atomic Spawning:** Clicking "Materialize" in Obsidian spawns the map, the walls, and the specific mooks listed in the `MookManifest`.

## 4. Success Criteria
- **Aesthetic Unity:** Generated maps match the project's "Black-Ice" art style.
- **Zero-Friction Replay:** An old mission can be re-run in a fresh Foundry world with 100% data extraction from the PNG.
- **Total Visibility:** Every faction and unit from the pack is searchable and interactable within the Obsidian vault.


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
