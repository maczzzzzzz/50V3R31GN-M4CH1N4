# Deep Research Analysis: Phase 4 (MVP Assembly) Exhaustive Blueprint
**Date:** Sunday, March 29, 2026
**Subject:** Tying the Split-Node Architecture into a Playable Loop (Story Engine, Night Market, and GM Approval)

## 1. Phase 4 Overview
Phase 4 represents the culmination of the "No Creep" contract. It wires the hardened Split-Node architecture (Node A for math/rules, Node B for narrative/state) into a continuous, playable solo loop for Cyberpunk RED within Foundry VTT v12. 

The three foundational pillars of this phase are:
1. **The Story Engine** (Tracking state via Arc → Beat → Event).
2. **The Night Market** (Interactive UI and Eagle Economy).
3. **The GM Approval Queue** (Human-in-the-loop state commitment).

---

## 2. Pillar 1: The Story Engine Core
Based on research into the `kingbootoshi/story-engine` pattern, we must implement a deterministic state machine on Node B (the Orchestrator) to track narrative progress.

### 2.1 State Hierarchy
*   **Arc (Macro):** The current campaign chapter (e.g., "TttA Part 3 - Back Alley Boogey").
*   **Beat (Meso):** The specific mission phase (e.g., "Beat 1: Dustwalker, Texas Ranger").
*   **Event (Micro):** Atomic interactions (e.g., an Athletics check, a dialogue choice, a Fixer call via `simple-phone`).

### 2.2 Execution Logic
- Node B maintains the `StoryState` (stored in SQLite via Crush session).
- When a user interacts in Foundry, a WebSocket event triggers Node B.
- Node B evaluates the interaction. If a rule resolution is needed, it calls `nitro-logic` (Node A).
- Node A returns a strict JSON math result.
- Node B's Story Engine checks if the result satisfies the "Transition Guard" for the current Beat.
- If satisfied, Node B generates the narrative outcome (via Mistral-Nemo) and advances the Beat, pushing the prose to the Foundry chat log.

---

## 3. Pillar 2: The Afterlife Night Market (Eagle Economy)
This pillar transitions the Night Market from a static table roll to a dynamic, in-engine storefront.

### 3.1 Interactive UI (Foundry Adapter)
We will leverage the customized `cpr-night-market.js` macro, utilizing the "Inventory Grid" HTML Dialog to present specific "Stalls" (Mr. Connors, Miss Piercing, Madame Garcia).
- The UI will display dual pricing: standard Eurobucks (eb) and Afterlife Eagles.

### 3.2 The Eagle Economy Translator
Node B must inject a conversion layer into the market macro based on TttA rules:
- **Low Tier (≤ 100eb):** 1 Eagle = 200eb credit.
- **Mid Tier (~500eb):** 2-4 Eagles.
- **High Tier (~1000eb):** 6-9 Eagles.

### 3.3 The Transaction Loop (`execute_ttta_trade`)
1. Player clicks "Purchase" in the Foundry UI.
2. The UI sends a payload to Node B via the `foundry-api-bridge-module`.
3. Node B queries Node A to validate the math (Does the Actor have sufficient Eagles/eb?).
4. If valid, Node B executes the state change in Foundry (deducts currency, adds item) and logs the transaction.

---

## 4. Pillar 3: The GM Approval Queue (Phils AI Assistant Integration)
To maintain game integrity and prevent AI hallucinations from corrupting the Foundry database, we must implement a "Human-in-the-loop" approval step for major state changes.

### 4.1 Integration Strategy
While fully automated "chatbots" exist, the mandate specifies the **Phils AI Assistant sidebar** pattern. This means the AI acts as a "Prompt Engineer" and state proposer, rather than a direct database mutator.
- **The Queue:** When Node B's Story Engine decides a major state change is required (e.g., granting a custom cyberware, altering an NPC's core stats, or advancing an Arc), it does *not* push the change directly.
- **The Intercept:** Instead, it queues the proposed JSON payload.
- **The Interface:** A custom Foundry UI tab (or integration with the existing Phils Assistant flow) displays the proposed change to the GM (the human).
- **The Approval:** The GM clicks "Approve," "Deny," or "Edit." Only upon approval does the `FoundryAdapter` execute the update.

---

## 5. Phase Gate: The E2E Simulated Cycle
To clear Phase 4 and declare the MVP complete, we must successfully run this exact sequence without errors or "meta-text" breaking the Immersion Mandate:

1.  **Generate Gig:** Node B synthesizes a Fixer text message (using TttA data) and pushes it to the player via the `simple-phone` module.
2.  **Roll Oracle / Math:** The player attempts a task. Node A (`nitro-logic`) resolves the DV and returns the JSON result.
3.  **Update Beat:** The Story Engine evaluates the success, advances the Beat, and outputs the narrative consequence to the Foundry chat.
4.  **Buy Item:** The player opens the Afterlife Night Market UI and purchases an item. Node B validates the Eagle cost and updates the character sheet.
5.  **GM Approval:** A major arc transition is proposed, intercepted by the Queue, and manually approved by the human GM.

## 6. Conclusion
Phase 4 is strictly an orchestration phase. It requires no new machine learning models or vector databases. The success of this phase relies entirely on the robustness of the TypeScript logic in `src/core/story-engine.ts`, `src/api/foundry-adapter.ts`, and the strict enforcement of Zod schemas crossing the Node A/B boundary.