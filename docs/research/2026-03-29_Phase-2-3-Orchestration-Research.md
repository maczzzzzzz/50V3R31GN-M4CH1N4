# Research Report: Phase 2 (nitro-logic) & Phase 3 (Foundry Bridge)
**Date:** Sunday, March 29, 2026
**Subject:** Deterministic Rule Resolution and Foundry VTT v12 WebSocket Handshake

## 1. Phase 2: Rules Authority Bridge (nitro-logic)
### 1.1 Llama.cpp OpenAI-Compatible API (v1)
Node A (Nitro 5) runs `llama-server` exposing a standard `/v1/chat/completions` endpoint.
- **Base URL:** `http://192.168.0.50:8080/v1`
- **Key Parameters for Determinism:**
  - `temperature`: `0.0` (Mandatory for TRPG math).
  - `top_p`: `1.0` (Disabled).
  - `top_k`: `1` (Force greedy sampling).
  - `seed`: Fixed integer (e.g., `42`) for reproducible results.
  - `response_format`: `{"type": "json_object"}` (Ensures Zod validation success).

### 1.2 Llama-3.2-3B Math Strategies
Small models (3B) require explicit guidance to prevent arithmetic hallucination:
- **Chain of Thought (CoT):** Every prompt MUST include a suffix like: *"Think step-by-step. List all variables (Stats, Skills, DVs) first, then calculate the total."*
- **The "Scratchpad" Pattern:** Force the model to output a `<thought>` block before the final JSON result.
- **Few-Shot Exemplars:** Provide at least 2 examples of successful Cyberpunk RED roll resolutions (e.g., a Ranged Attack vs. DV 13) in the system prompt.

---

## 2. Phase 3: Foundry Bridge & Immersion UI
### 2.1 Foundry VTT v12 Chat Injection
Foundry v12 utilizes a standard socket-based document creation system. 
- **Endpoint:** `ChatMessage.create()` (via `game.socket` or the `foundry-api-bridge-module`).
- **Payload Structure:**
  ```json
  {
    "content": "Narrative prose from Mistral-Nemo",
    "type": 1, // OOC or IC depending on context
    "speaker": { "alias": "GM Assistant" },
    "flags": { "foundry-api-bridge": { "source": "node-b-orchestrator" } }
  }
  ```

### 2.2 simple-phone (Smartphone Widget) Integration
To trigger the TttA Fixer calls asynchronously:
- **Flag Key:** `smartphone-widget` (or `simple-phone` depending on the exact build).
- **Mandatory Flag:** `isPhoneMessage: true`.
- **Payload Requirements:**
  - `senderNumber`: Canonical phone number for the Fixer.
  - `type`: `"text"` or `"system"`.
  - `app`: `"messages"`.
- **UI Trigger:** When this flag is detected, Foundry overrides the standard chat CSS with a "phone bubble" UI.

---

## 3. Mandatory Handshake Alignment
All responses from **Node A (nitro-logic)** must be validated via Zod on **Node B** to ensure raw integers are passed to the Narrative Synthesizer.
- **Zod Schema:** Must enforce `{ total: number, success: boolean, reasoning: string }`.
- **Node B Role:** Mistral-Nemo 12B takes the validated JSON from Node A and converts it into the "Fixer phone call" or "HUD bubble" prose.

---

## 4. Actionable Implementation Items
- [ ] Scaffold `src/core/rules-engine.ts` to handle the Llama.cpp CoT prompt generation.
- [ ] Implement `src/api/foundry-adapter.ts` for WebSocket communication.
- [ ] Ensure all Node A prompts are injected with `temperature: 0.0`.
