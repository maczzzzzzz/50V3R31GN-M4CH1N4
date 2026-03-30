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
- **Workflow:** 
  1. Ingest event from Foundry Bridge.
  2. Map Event to Beat Transition Guard.
  3. Validate Math via `nitro-logic` (Node A).
  4. Generate prose via Ollama (Node B).
  5. Advance Beat and push prose to Foundry.

### 2.2 The Afterlife Night Market UI (`foundry-module/foundry-api-bridge.js`)
A Foundry-native HTML Dialog extending the `cpr-night-market.js` macro to support TTTA's "Eagle" economy.

- **UI Rendering:** A CSS Grid layout categorizing vendors (Mr. Connors, Miss Piercing, Madame Garcia).
- **Dual Pricing Logic:**
  - `≤ 100eb` = 0.5 Eagles (2-for-1).
  - `≤ 500eb` = 2-4 Eagles.
  - `≤ 1000eb` = 6-9 Eagles.
- **Event Dispatch:** A UI `buy` button emits a `buy_item` WebSocket event upstream.

### 2.3 The Bridge Protocol Extension (`src/shared/schemas/foundry-bridge.schema.ts`)
The Zod contract representing Node B to Foundry communication is extended.
- **Event:** `BuyItemEventSchema` containing `itemId`, `costEb`, `costEagles`, and `vendor`.
- **Hybrid Routing (`src/core/hybrid-routing-controller.ts`):** Intercepts `buy_item`. Queries Node A to validate actor funds. Generates narrative prose upon successful transaction.

### 2.4 The GM Approval Queue (`src/core/gm-approval-queue.ts`)
A queueing system ensuring AI does not unilaterally mutate the Foundry database for critical changes.
- **Queue Intercept:** Major state changes (Arc transitions, cyberware additions) are queued rather than executed immediately.
- **Status Enum:** `pending`, `approved`, `denied`, `edited`.
- **UI Integration:** The Foundry client polls or is pushed these pending events, allowing the GM (human) to click "Approve" before Node B commits the state change.

## 3. Strict Boundary Constraints (No Creep)
- Do not implement Phase 5 features (Red Trade, Braindance therapy).
- Do not implement Simulacrum cross-session NPC deep memory.
- Depend strictly on `simple-phone v2.2.0`, `Ticket-To-The-Afterlife v2.2.0`, and `night-city-gang-and-corp-mook-pack v2.8` on Foundry v12.