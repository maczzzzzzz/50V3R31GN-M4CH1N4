# Design: Dynamic Status Overlays via Pretext Engine
**Date:** 2026-04-03
**Target:** v3.7.0 (Phase 17: Layout Sovereignty - Pretext Engine)

## 1. Architecture & Data Flow

**Core Concept:**
Implement a reactive, reflow-free overlay system for dynamic health status (damage numbers, critical state warnings) and lore-accurate drug/alcohol effects. The system leverages **Pretext** for layout and text rendering on a dedicated HTML5 `<canvas>` to ensure zero DOM reflows, enabling smooth 60fps glitch and drug shader effects.

**Data Flow:**
1.  **Trigger (Foundry/Mesh):** The Foundry module detects an update via the `updateActor` hook (e.g., HP drops by 15+, or a drug item is consumed).
2.  **Event Dispatch (Hybrid Routing Controller):** The event is dispatched to the `HybridRoutingController` on Node B.
3.  **LLM Generation (Node B):** Mistral-Nemo evaluates the context (damage amount, drug type, HP threshold) and generates lore-accurate display text (e.g., "CRITICAL: SPINAL TRAUMA DETECTED" or "WARNING: SYNTHCOKE TOXICITY") along with visual parameters (glitch intensity, RGB split, shader type).
4.  **Rendering (Pretext Canvas Layer):** Node B sends the payload back to the Mesh. A dedicated `PretextCanvasLayer` sitting above the Foundry grid intercepts it. Pretext calculates the text layout instantly, and PIXI/FXMaster applies the shaders to the canvas at 60fps, entirely bypassing the DOM.

## 2. Components & Physics Integration

**Physics Strategic Oracle Alignment (`RED_RULES.md`):**
The glitch logic strictly aligns with the D10 mechanics. Triggers are based on the *Net Damage* calculated by Node A (after SP ablation and AP calculations).

**Components:**
1.  **Node B Interceptor (`hybrid-routing-controller.ts`):** Expands the `handleCalculateDv` and `handleStrategic OracleRoll` pipeline.
    *   **Threshold Trigger (Damage):** If `netDamage >= 15` in a single attack, a critical glitch sequence fires.
    *   **Threshold Trigger (Death State):** If `newHp <= 1`, a persistent, low-level screen tear effect applies.
    *   **Event Trigger (Drugs):** If an item classified as a drug/toxin is consumed, a drug-shader payload generates.
2.  **LLM Prompting Engine (Node B):** Injects context (entity name, damage/drug type) into Mistral-Nemo to generate a 1-2 sentence lore-accurate warning and numeric FX parameters.
3.  **Foundry Mesh Dispatcher:** Packages the LLM's text and FX parameters into a standardized JSON payload and pushes it to the Foundry module via WebSocket.
4.  **Pretext Renderer (Foundry Client):** Instantiates a Pretext canvas overlay. Pretext handles sub-pixel text rendering; PIXI.js/FXMaster applies shaders (e.g., Chromatic Aberration) to the canvas layer.

## 3. API Payload & Pretext Rendering

**Data Payload Structure (Example):**
```json
{
  "type": "pretext_overlay",
  "payload": {
    "targetId": "actor_abc123",
    "overlayType": "critical_damage", // or "drug_ingestion"
    "text": "CRITICAL: SPINAL TRAUMA DETECTED",
    "color": "#ff003c",
    "duration": 3000,
    "fxParams": {
      "shader": "chromatic_aberration",
      "intensity": 2.5,
      "rgbSplit": 0.8
    }
  }
}
```

**Rendering Logic (Foundry Client):**
1.  Foundry module receives the `pretext_overlay` event.
2.  Locates the token via `canvas.tokens.get(payload.targetId)`.
3.  Invokes `PretextOverlayManager.drawText()`. Pretext uses a detached `<canvas>` element, writes the text, and aligns it over the token.
4.  If `fxParams` are present, the module triggers the native `fxmaster` or `sequencer` API to apply shaders directly to the Pretext canvas layer.
5.  After `duration` ms, the overlay fades out and the canvas clears (0 DOM recalculations).

## 4. Testing Plan
1.  **Node B Unit Tests:** Verify `hybrid-routing-controller` formatting and payload generation for `netDamage >= 15` and drug consumption.
2.  **Mistral-Nemo Validation:** Ensure LLM generates valid JSON with lore text and FX parameters.
3.  **Foundry Integration Tests:** Verify `PretextOverlayManager` rendering, confirm 0 DOM reflows via Chrome DevTools, and ensure FXMaster shaders apply correctly to the canvas.

---
**LINKS:** [[OS_CORE]]
