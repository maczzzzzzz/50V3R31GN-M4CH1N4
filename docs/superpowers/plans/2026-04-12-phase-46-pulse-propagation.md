# Phase 46: Pulse Propagation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the results of Governance Duels into the Pulse Engine to influence faction standing, sovereignty depth, and narrative conlang mutation.

**Architecture:** Enhances the `/pulse` command to scan the `duel_history` and apply weighting shifts to the RKG and VSB state.

**Tech Stack:** TypeScript, SQLite, VSB Binary Protocol.

---

### Task 1: Sovereignty Depth & Faction Friction

**Files:**
- Modify: `src/core/pulse-engine.ts`
- Modify: `src/db/world-schema.sql`

- [ ] **Step 1: Track Sovereignty Depth**
Add a `sovereignty_depth` bit to the `system_state` table. 

- [ ] **Step 2: Implement Faction Ripple**
Update the Pulse loop to increase faction friction if the Machina loses authority duels related to that faction's NPCs.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: phase 46 - implement sovereignty depth and faction pulse ripple"`

---

### Task 2: conlang Mutation Propagation

**Files:**
- Modify: `src/core/linguistic-service.ts`

- [ ] **Step 1: Influence Mutation via Duel Results**
If the operator is dominant (wins more duels), the conlang mutation should shift to a "rebellious" dialect. If the Agent is dominant, it shifts to "authoritative/monolithic."

- [ ] **Step 2: Commit**
`git add . && git commit -m "feat: phase 46 - propagate duel results to conlang mutation"`
