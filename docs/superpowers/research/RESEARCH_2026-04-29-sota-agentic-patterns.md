# RESEARCH: SOTA Agentic Patterns & Implementation Blueprints
**Date:** Wednesday, April 29, 2026
**Version:** 3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-RESEARCH
**Sources:** Open-AutoGLM, TouchDesigner-MCP, Bux, Operit

## ◈ 1. PERCEPTION: VISUAL-FIRST CONTROL (Open-AutoGLM)
*   **Pattern:** Abandoning DOM/Accessibility trees for raw pixel streams.
*   **Implementation:**
    *   **VLM-Centric Loop:** Use AutoGLM-Phone-9B (or equivalent local VLM) to perceive raw pixels via 1Hz screen captures.
    *   **Think-Answer Chain:** Enforce `<think>` (planning) and `<answer>` (action) blocks in the `HermesSingularity` reasoning loop.
    *   **Standard Action Primitives:** `Launch`, `Tap`, `Type`, `Swipe`, `Back`, `Home`, `Long Press`, `Double Tap`, `Wait`, and `Take_over`.

## ◈ 2. CONTROL: DISCOVERY-FIRST WORKFLOW (TouchDesigner-MCP)
*   **Pattern:** Mandatory system state inspection before mutation.
*   **Implementation:**
    *   **Discovery Hardgate:** Force agents to call `td_get_par_info` (or project equivalent `get_system_state`) *before* generating implementation plans.
    *   **Proven Recipes:** Encapsulate complex logic chains (e.g., "Artery Ignition") into immutable recipes rather than free-form code generation.

## ◈ 3. PERSISTENCE: BROWSER KEEPER (Bux)
*   **Pattern:** Persistent identity and OAuth session preservation.
*   **Implementation:**
    *   **Browser Harness:** Materialize a "Browser-Keeper" service that maintains Chromium sessions across reboots.
    *   **HITL Handover:** Implement a `ttyd` or similar web-terminal fallback for 2FA/CAPTCHA intervention.

## ◈ 4. EXECUTION: TRIPLE-PATH AUTOMATION (Operit)
*   **Pattern:** Redundant control channels (Accessibility / ADB / Root).
*   **Implementation:**
    *   **Triple-Path Ingress:** Use a fallback mechanism for UI control:
        1.  `Accessibility Service` (Primary).
        2.  `ADB` (Secondary).
        3.  `Root` (Final Authority).
    *   **Intelligent Synapse Classifiers:** AI-driven auto-classification of interaction traces into semantic memory types.

---
**::/5Y573M-N071C3 : SOTA_PATTERNS_MATERIALIZED. // 50V3R31GN-M4CH1N4**
