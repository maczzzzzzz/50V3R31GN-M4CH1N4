# Design Specification: Phase 12 — The Architect Pass (v1.0.0)
**Subject:** Automated Campaign Materialization & Scene Construction
**Status:** DESIGN FINALIZED

## 1. Executive Summary
The Architect Pass is the final fulfillment of the "Grounded GM" vision. It enables the AI to read a campaign "Script" (Ticket to the Afterlife Journals) and physically construct the tactical environment in Foundry VTT. This includes intelligent wall placement, atmospheric lighting orchestration, and tactical NPC deployment via the Phase 11 Neural Uplink.

## 2. Component Architecture

### 2.1 The Mission Parser (Context Layer)
Utilizes the **RulesGrepService** to perform precision extraction of "Scene Setup" data.
- **Input:** Journal Entry ID (e.g. "Mission 1: Grand Opening").
- **Logic:** Identifies map requirements, NPC rosters, and ambient descriptions.

### 2.2 The Geometric Materializer (Physical Layer)
Bridges the Node A **Geometric Wall Engine** to the Foundry Canvas.
- **Workflow:** Rust detects lines → Node B serializes to JSON → Neural Uplink executes `WallDocument.create` via CDP.
- **Intelligence:** LLava 1.6 identifies doors/windows to set appropriate Foundry flags.

### 2.3 The Atmosphere Engine (Immersion Layer)
Transforms narrative descriptions into physical lighting and sound.
- **Mapping:** Translates text (e.g. "Emergency Red Strobe") into Foundry `AmbientLight` documents with specific colors, intensities, and animations.

### 2.4 The Deployment Manager (Tactical Layer)
Automates the "Set Dressing" of combat encounters.
- **Mook Integration:** Pulls actor templates from the Night City Gang Pack.
- **Spatial Positioning:** Places tokens in semantic "Tactical Regions" (snipers in high cover, guards near security terminals).

## 3. Tooling Spec: The Architect Hub
- `materialize_mission(journalId)`: Full E2E setup.
- `architect_walls()`: Direct geometric-to-physical wall creation.
- `orchestrate_lighting(description)`: Narrative-driven light placement.

## 4. Performance Targets
- **Scene Setup:** Full mission materialization (Walls + 10 NPCs + Lighting) in **<60s**.
- **Accuracy:** 100% adherence to Journal-specified NPC rosters.
