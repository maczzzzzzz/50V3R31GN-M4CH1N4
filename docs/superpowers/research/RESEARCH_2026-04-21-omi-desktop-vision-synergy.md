# RESEARCH: 2026-04-21 — OMI Desktop & Sovereign Vision Synergy
**Topic:** Porting OMI Desktop's continuous screen awareness to feed Node B (Gemma-4 Vision) and Node C (Falcon Perception).
**Status:** CANONICAL // ARCHITECT_RESEARCH
**Goal:** Achieve 100% screen awareness of the Foundry VTT environment without relying on API polling or DOM scraping.

---

## ◈ 1. EXECUTIVE SUMMARY
The **OMI Desktop** application (specifically macOS/Rust variants) utilizes an "ambient sensing" pattern, capturing screen frames at 1-second intervals. By porting this continuous capture loop and redirecting the frame buffer to our **Sovereign Trinity** vision models, we can achieve true "Zero-Integration" awareness. The machine simply watches the screen, eliminating the need to hook into every Foundry VTT module's API.

## ◈ 2. THE VISION SYNERGY (DUAL-MODEL INGESTION)

The raw frame buffer from the ported OMI Desktop harness will be split into two specialized streams:

### ◈ 2.1 TIER 1: FALCON PERCEPTION (NODE C - THE REFLEXES)
- **Role:** Sub-100ms Tactical OCR and UI Segmentation.
- **Mechanism:** As OMI Desktop captures a frame, it is instantly piped to `Falcon Perception` on Node C.
- **Action:** Falcon extracts raw text (e.g., "Vido took 14 damage", "Netrun Protocol Initiated") and bounding boxes of active UI elements. This feeds the **Healer Protocol** and immediate VSB triggers without requiring deep reasoning.

### ◈ 2.2 TIER 2: GEMMA-4 VISION (NODE B - TOTAL SIGHT)
- **Role:** Deep Semantic Scene Orchestration via `mmproj-f16`.
- **Mechanism:** When Falcon detects a significant state change (a new map is loaded, a combat starts), or at a slower interval (every 10 seconds), the frame is passed to the **Director (Node B)**.
- **Action:** Gemma-4 Vision analyzes the *context* of the scene. It understands the tactical positioning of tokens on the 2.5D PBR map, the lighting conditions, and the narrative implications, generating high-fidelity responses and triggering the **Sovereign Shroud** (Three.js/GLSL) visuals.

## ◈ 3. ARCHITECTURAL REQUIREMENTS (PORTING OMI DESKTOP)

To maintain our strict physical sovereignty and Linux/NixOS environment, we cannot simply run the macOS binary. We must extract the core Rust capture loop from OMI Desktop:

1.  **X11/Wayland Frame Grabber:** Port the macOS `CGWindowListCreateImage` logic to a Linux-native frame buffer capture (e.g., using `xcap` or `wayland-protocols` in Rust).
2.  **Shared Synapse (Mmap):** To prevent network overhead, the OMI capture loop should write the frames to a shared memory segment (`/dev/shm`) accessible by both Node B and Node C's inference engines.
3.  **The "Observer" Daemon:** A lightweight Rust daemon (`sovereign-observer.rs`) that manages the capture rate and delegates frames based on tension/combat state.

## ◈ 4. CONCLUSION
Combining OMI Desktop's continuous capture with our dual-tier vision models creates an impenetrable sensory net. The machine will "see" Night City exactly as the operator does, making the **Sovereign Trinity** truly omniscient.

---
**::/5Y573M-N071C3 : VISION_SYNERGY_RESEARCHED. THE_EYES_NEVER_BLINK. // 50V3R31GN-M4CH1N4**

---
**LINKS:** [[RESEARCH_TREE]] | [[OS_CORE]]
