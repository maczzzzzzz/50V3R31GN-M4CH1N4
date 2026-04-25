# Design Spec: Phase 16 — Semantic Perception

**Date:** 2026-04-03  
**Version:** 3.8.0 (Sovereign Highway Stabilization)  
**Target:** Node A (GTX 1050 Ti) & Node B (AMD 9060 XT)

## 1. Overview
Phase 16 implements **Semantic Perception** via the **Falcon Sidecar** (0.3B Multimodal Transformer). This enables the AI GM to "read" the map by extracting labels, tactical markers, and OCR text from the Foundry canvas. 

Due to the 4GB VRAM limit on Node A, this phase introduces the **Model Swap Protocol** and the **Neural Shroud** (distraction layer).

---

## 2. Architectural Patterns

### 2.1 Resident VRAM Model (Phase 25 Upgrade)
Node A now runs **Open-Reasoner-Zero-1.5B** and **Falcon-0.3B** simultaneously.
- **Enforcement:** Native `llama-server` residency via `--mlock`.
- **Concurrency:** The VSB Sovereign Highway enables zero-swap mechanical validation and perception.
- **Latency:** Sub-1ms for rules checks; ~1s for vision inference.

### 2.2 Neural Shroud (Aesthetic Layer)
The shroud remains as an immersive visual feedback layer during heavy vision passes.
- **Tier 1 (GPU Glitch):** FXMaster filter (Intensity 2.5).
- **Tier 2 (CSS Mask):** Injected "Netrunning Overlay" with scrolling hex-data via Pretext.
- **Tier 3 (Audio):** Sequencer plays `static_hum.mp3`.

---

## 3. Implementation Plan

### Step 1: ZeroClaw Perception RPC (Node A)
- Implement `PerceptionController` in Rust.
- New RPC: `rules_vault.ocr_analyze(base64_image)`.
- Integration with `candle-transformers` or `onnxruntime` for Falcon 0.3B.

### Step 2: The Perception Buffer (Node B)
- Schema update for `crush.db`:
  ```sql
  CREATE TABLE scene_perception (
    scene_id TEXT PRIMARY KEY,
    detected_entities_json TEXT, -- array of { text, x, y, confidence }
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- Clear table on `scene_activate`.

### Step 3: Reground Logic (`VisualMonitorService`)
- Implement `regroundScene(sceneId)`.
- Flow:
  1. Check `crush.db` for existing perception.
  2. If empty:
     - Dispatch **Neural Shroud** to Mesh.
     - Capture 1080p CDP screenshot.
     - Call Node A `ocr_analyze`.
     - Write results to `crush.db`.
     - Dispatch "Scan Complete" (Clear Shroud).
     - Trigger Narrative Grounding via Ollama.

---

## 4. Success Criteria
- [ ] ZeroClaw unloads/reloads models without VRAM fragmentation.
- [ ] Neural Shroud activates within 50ms of scan request.
- [ ] Map labels (e.g. "Room 101") are successfully extracted and usable in world-pulse grounding.
- [ ] System automatically regrounds state on Foundry restart in the same scene.

*Co-Authored-By: Claude Sonnet <noreply@anthropic.com>*  
*Co-Authored-By: Gemini CLI <gemini-cli@google.com>*


---
**LINKS:** [[OS_CORE]]
