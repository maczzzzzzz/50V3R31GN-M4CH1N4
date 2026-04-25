# Conversational Onboarding Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Phase 5.3 (v3.4.2) Conversational Onboarding wizard in Crush CLI.

**Architecture:** Use an stateful interview controller on Node B that dispatches rolls to Node A and finalizes the build via the Foundry WebSocket bridge.

**Tech Stack:** TypeScript, Zod, Vitest, ClawLink (Node A Mesh).

---

### Task 1: The Interview Controller

**Files:**
- Create: `src/core/onboarding-controller.ts`
- Create: `tests/core/onboarding-controller.test.ts`

**Step 1: Define Interview State Machine**
- States: `INITIAL`, `VIBE_CHECK`, `LIFEPATH`, `STATS`, `REVIEW`, `FINALIZED`.

**Step 2: Implement Lifepath mapping**
- Call `nitro-logic` for Table rolls.
- Pass result to Mistral-Nemo for dialogue generation.

**Step 3: Commit**

---

### Task 2: Foundry Actor Materialization Tool

**Files:**
- Modify: `src/api/foundry-adapter.ts`
- Modify: `foundry-module/foundry-api-bridge.js`

**Step 1: Implement create_actor command**
- Define `CreateActorPayload` in bridge schema.
- Implement `Actor.create` logic in the Foundry module.

**Step 2: Implement item seeding**
- Logic to attach standard gear items from the `entities_mooks` data to the new Actor.

**Step 3: Commit**

---

### Task 3: Crush CLI Integration

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement '/onboard' command dispatcher**
- Route terminal input to the `OnboardingController`.

**Step 2: Full E2E Verification**
- Run a 5-minute interview in Crush.
- Verify that a new Actor appears in the Foundry sidebar with correct stats and gear.

**Step 3: Commit**


---
**LINKS:** [[OS_CORE]]
