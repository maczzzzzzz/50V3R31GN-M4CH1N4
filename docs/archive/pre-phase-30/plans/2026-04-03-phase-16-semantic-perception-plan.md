# Implementation Plan: Phase 16 — Semantic Perception

**Goal:** Integrate Falcon Sidecar for OCR/Map label extraction using the Model Swap Protocol.

## Task 1: Node A — ZeroClaw Perception RPC (Rust)
- [ ] Add `falcon-perception` dependency to Node A.
- [ ] Implement `ModelManager` to handle sequential VRAM swapping (Unload Llama -> Load Falcon).
- [ ] Implement `ocr_analyze` RPC handler.
- [ ] **Verification:** `cargo test` for model loading lifecycle.

## Task 2: Node B — Perception Buffer & Schema
- [ ] Update `crush.db` with `scene_perception` table.
- [ ] Update `HybridRoutingController` to clear perception on scene change.
- [ ] **Verification:** Manual check of SQLite schema.

## Task 3: Node B — Neural Shroud & Reground Logic
- [ ] Implement `NeuralShroudService` to coordinate FXMaster + CSS + Sequencer.
- [ ] Implement `VisualMonitorService.regroundScene()`.
- [ ] Update `HybridRoutingController` to trigger `regroundScene` if perception is missing on event.
- [ ] **Verification:** `npm test` for service integration.

## Task 4: Narrative Fusion
- [ ] Update `applyWorldPulseGrounding` to inject semantic data from `scene_perception`.
- [ ] **Verification:** AI GM mentions a map label in a chat message.

---
*Roadmap Managed by Gemini CLI.*
