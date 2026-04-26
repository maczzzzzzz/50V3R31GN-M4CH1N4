# Phase 4 (MVP Assembly) Design Specification

**Date:** March 29, 2026
**Target Platform:** Foundry VTT v12, Node.js (Node B Orchestrator)
**Context:** Based on `docs/research/2026-03-29_Phase-4-Exhaustive-Blueprint.md`

## 1. System Overview
Phase 4 wires the hardened Split-Node architecture into a playable, continuous solo loop for Cyberpunk RED within Foundry VTT v12. It establishes three core systems on Node B:
1. **The Story Engine:** A deterministic state machine.
2. **The Night Market:** An interactive UI mapping Eurobucks to "Eagles".
3. **The GM Approval Queue:** A human-in-the-loop interceptor for state changes.

## 2. Core Components

### 2.1 The Story Engine (`src/core/story-engine.ts`)
The `StoryEngine` is a deterministic state machine responsible for preventing narrative drift. It models the `kingbootoshi/story-engine` pattern.

- **Data Structure (`src/shared/schemas/story.schema.ts`):**
  - **Arc:** Macro-level phase (e.g., "TttA Part 3").
  - **Beat:** Meso-level segment (e.g., "Beat 1: Dustwalker").
  - **Event:** Micro-level atomic interactions.
  - **State:** Includes an `eagleBalance` (number) and a `worldState` record.
- **Persistence:** Bound to the Crush CLI SQLite session memory.
- **Workflow & Wiring:** 
  1. Ingest event from Foundry Mesh.
  2. Validate Math via `nitro-logic` (Node A).
  3. `HybridRoutingController` pushes the result to `StoryEngine.evaluateEvent()`.
  4. StoryEngine evaluates "Transition Guards" to determine if the Beat should advance.
  5. Generate prose via Ollama (Node B).
  6. Advance Beat and push prose to Foundry.

### 2.2 The Afterlife Night Market UI (`foundry-module/foundry-api-bridge.js`)
A Foundry-native HTML Dialog extending the `cpr-night-market.js` macro to support TTTA's "Eagle" economy.

- **Data Source:** Vendor inventory (`marketItems`) is populated dynamically by querying Node A (`nitro-db`) for the TTTA items within the `campaign_ttta` namespace.
- **UI Rendering:** A CSS Grid layout categorizing vendors (Mr. Connors, Miss Piercing, Madame Garcia).
- **Dual Pricing Logic:**
  - `≤ 100eb` = 0.5 Eagles (2-for-1).
  - `≤ 500eb` = 2-4 Eagles.
  - `≤ 1000eb` = 6-9 Eagles.
- **Event Dispatch:** A UI `buy` button emits a `buy_item` WebSocket event upstream.

### 2.3 The Mesh Protocol Extension (`src/shared/schemas/foundry-bridge.schema.ts`)
The Zod contract representing Node B to Foundry communication is extended.
- **Event:** `BuyItemEventSchema` containing `itemId`, `costEb`, `costEagles`, and `vendor`.
- **Event:** `ApprovalResponseEventSchema` containing `proposalId`, `status`, and `editedData`.
- **Command:** `update_actor` Node B -> Foundry command to mutate Actor records (e.g., deducting `system.wealth.eb`, modifying items).
- **Command:** `queue_approval` Node B -> Foundry command to trigger a human-in-the-loop dialog for sensitive changes.
- **Hybrid Routing (`src/core/hybrid-routing-controller.ts`):** Intercepts `buy_item`. Queries Node A to validate actor funds. Sends `update_actor` command upon successful transaction and generates narrative prose.

### 2.4 The GM Approval Queue (`src/core/gm-approval-queue.ts`)
A queueing system ensuring AI does not unilaterally mutate the Foundry database for critical changes.
- **Queue Intercept:** Major state changes (Arc transitions, cyberware additions) are queued rather than executed immediately.
- **Status Enum:** `pending`, `approved`, `denied`, `edited`.
- **UI Integration:** Node B pushes a `queue_approval` command to Foundry. A custom Foundry UI dialog presents the payload to the GM. 
- **Response Flow:** The GM's selection fires an `approval_response` WebSocket event back to Node B. The `GmApprovalQueue` then resolves the internal promise, allowing the `HybridRoutingController` to proceed with the `update_actor` command or narrative branch.

## 3. Strict Boundary Constraints (No Creep)
- Do not implement Phase 5 features (Red Trade, Braindance therapy).
- Do not implement Simulacrum cross-session NPC deep memory.
- Depend strictly on `simple-phone v3.8.7`, `Ticket-To-The-Afterlife v3.8.7`, and `night-city-gang-and-corp-mook-pack v2.8` on Foundry v12.


---
**LINKS:** [[OS_CORE]]
