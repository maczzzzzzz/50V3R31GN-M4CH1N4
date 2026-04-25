# Design Spec: Phase 30 & 31 — Sovereign Interceptor & Action Sovereignty

**Date:** 2026-04-05
**Status:** Approved
**Vision:** Transition from a reactive listener to a proactive regulator of physical reality.

## 1. PHASE 30: THE INTERCEPTOR (INTENT HIJACK)

### 1.1 libWrapper Integration
- **Mechanism:** Wrap `game.socket.emit` and `SocketInterface.dispatch`.
- **Logic:** Node B intercepts all Cyberpunk RED system events (`applyDamage`, `updateNetArchitecture`) before they reach the server.
- **Rules Veto:** Intercepted packets are forwarded to Node A (Open-Reasoner). If Node A returns `INVALID`, the wrapper returns `false`, effectively killing the intent.

### 1.2 Capability Harvesting
- **Mechanism:** Implement `ActionHarvester` in the Foundry bridge.
- **Logic:** Walks the `items` collection of controlled tokens to build a real-time registry of whitelisted actions (Attacks, Programs, Skills).
- **VSB Mapping:** Available capabilities are mapped into the VSB shared memory for the Rust HUD to display.

## 2. PHASE 31: ACTION SOVEREIGNTY (PHYSICAL REALITY)

### 2.1 Physical Trigger API
- **Goal:** **Obliteration of `runScript`.** Arbitrary JS injection is deprecated.
- **Commands:** Transition to structured bridge commands:
    - `executeAction(actorId, itemId)`: Triggers a harvested capability.
    - `triggerTile(tileId)`: Executes a **Monks Active Tile** manual trigger.
    - `playSequence(sequenceData)`: Executes a **Sequencer** visual effect.

### 2.2 Counter-Hacks (Active Defense)
- **Logic:** Intercept `modifyDocument` (Token movement/stat changes).
- **Response:** If a player attempts an "illegal" move (unauthorized movement into fog), the machine returns `false` in the wrapper, preventing the state commit.

---
*Verified by Gemini CLI v3.4.2 Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
