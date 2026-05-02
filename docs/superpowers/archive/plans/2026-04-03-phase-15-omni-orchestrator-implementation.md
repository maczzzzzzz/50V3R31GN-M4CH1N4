# Implementation Plan: Phase 15 — Omni Orchestrator

**Version:** 3.8.25-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Baseline:** v3.8.25-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Resilient
**Goal:** Establish the reactive swarm reasoning and physical execution loop.

---

## Task 1: The Swarm Dispatcher (Node B)
**Goal:** Create the core logic to concurrently query Node A and Node B for event classification.

- **Step 1:** Implement `OmniOrchestratorService` in `src/core/`.
- **Step 2:** Integrate `Promise.all` logic to dispatch "Intensity" (Node A) and "Tone" (Node B) prompts.
- **Step 3:** Create the `ProfileMapper` to translate (Scalar, Tone) → Mesh Command.

## Task 2: Profile Physicalization (Mesh)
**Goal:** Implement the high-fidelity response profiles in the Foundry Mesh.

- **Step 1:** Update `foundry-api-bridge.js` to support named `ResponseProfiles`.
- **Step 2:** Implement the `HEAVY_COMBAT` profile using **Sequencer** and **FXMaster**.
- **Step 3:** Implement the `SYSTEM_GLITCH` profile using CSS Layers in `bridge-layers.css`.

## Task 3: The Sequential Grounder (Node A Sidecar)
**Goal:** Implement the Falcon Perception "Model Swap" logic on Node A.

- **Step 1:** Create `FalconSidecarClient` to manage the sequential model loading.
- **Step 2:** Implement the `/force-scan` CLI command.
- **Step 3:** Add the "Loading Screen" CSS glitch to mask the VRAM swap time.

## Task 4: High-Fidelity Integration (Controller)
**Goal:** Hook the Orchestrator into the live game loop.

- **Step 1:** Refactor `HybridRoutingController` to call `OmniOrchestrator.dispatch()` on all rules events.
- **Step 2:** Ensure `Akashik.db` logs all Omni-Events for RAG grounding.
- **Step 3:** Perform a full "Battle Stress Test" with concurrent players and AI effects.

---
*Omni Orchestrator: Physicalizing the Living City.*


---
**LINKS:** [[OS_CORE]]
