# Design: Phase 21 — Total Autonomy & Agentic Loops
**Date:** 2026-04-03
**Version:** 3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Target:** The Autonomous NPC

## 1. Overview
Phase 21 finalizes the Neural Hive by implementing the **AutoStoryGen** agentic loop for self-directed NPC agents. NPCs transition from reactive puppets to autonomous actors with daily routines, tactical reasoning, and life-paths.

## 2. Architecture & Components

### 2.1 The Autonomous Turn Daemon (Node B)
A multi-step state machine that drives NPC decisions:
1. **Brainstorm (Reasoning):** NPC analyzes its `SensoryFilter` (what it sees) and `Latent Seeds` (how it feels).
2. **Outline (Intent):** NPC generates a high-level goal (e.g., "Secure the perimeter").
3. **Draft (Action):** NPC generates a strict JSON command for the Mesh (e.g., `move`, `attack`, `interact`).
4. **Refine (Validation):** Node B validates the action against the `Rules Vault` (Node A) before execution.

### 2.2 Tactical Swarm Simulation (Node A)
- **Concurrent Resolution:** Node A resolves combat math for the entire "Swarm" in a single batch, preventing narrative drift.
- **Deterministic State:** Ensures that 50 concurrent NPCs don't overload the RKG by using atomic `IMMEDIATE` transactions in `Akashik.db`.

### 2.3 Life-Path Generator (Persistence)
- **Pattern:** Adaptation of the AutoStoryGen loop to generate long-form "History" for NPCs.
- **Persistence:** NPC "Daily Logs" are stored in `Akashik.db`, allowing agents to remember their past actions and player interactions over weeks of real-time operation.

## 3. Data Flow
1. **Loop Initiation:** `Foundry (Turn Start)` -> `Node B (Turn Daemon)`.
2. **Decisioning:** `Node B` <-> `Node A (Rules + Seeds)` <-> `LLM (Mistral-Nemo)`.
3. **Execution:** `Node B` -> `Foundry (Mesh)`.

## 4. Success Criteria
- [ ] NPCs execute tactical turns in <5 seconds.
- [ ] NPCs demonstrate behavioral consistency over multiple sessions (Life-Paths).
- [ ] The "Swarm" can resolve 10+ concurrent combat actions without desync.


---
**LINKS:** [[OS_CORE]]
