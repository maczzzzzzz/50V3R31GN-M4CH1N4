# Phase 8.1: Tactical Hardening Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish the "Black-Ice" visual identity in Foundry v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS and implement the Human-in-the-Loop authorization barrier for world-state writes.

**Architecture:** Use CSS @layers for non-destructive theme overrides in Foundry. Implement an asynchronous `AuthorizationGate` in the Node B Orchestrator that pauses the Flush Gate until a physical `ACK` is received via the Crush CLI.

**Tech Stack:** CSS Layers (@layer), TypeScript (readline/promises), Foundry VTT v12 / CPR 0.9.3.

---

### Task 1: The Black-Ice CSS Layer (Foundry)

**Files:**
- Create: `foundry-module/styles/black-ice-theme.css`
- Modify: `foundry-module/module.json`

**Step 1: Create the Layer Override**
Implement the Cyan/Magenta palette inversion using the `@layer` system to target CPR 0.9.3 variables.

**Step 2: Register in Module**
Include the new stylesheet in the module manifest.

**Step 3: Verification**
Reload Foundry and verify the "Red" branding is replaced by "Black-Ice Cyan" globally.

---

### Task 2: The 2nd Signature (Human-in-the-Loop)

**Files:**
- Modify: `src/db/unified-oracle-client.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Authorization Gate**
Update `executeTransaction` to emit an `AUTHORIZATION_REQUIRED` event before committing.

**Step 2: Implement CLI ACK Loop**
Update the main loop to pause and wait for a `STDIN` input ("ACK" or "ENTER") when a world-state write is proposed.

**Step 3: Verification**
Trigger an attack that would kill an NPC and verify that the database update only occurs *after* you physically confirm in the terminal.

---

### Task 3: High-Fidelity Audit physicalization

**Files:**
- Create: `docs/audits/2026-04-02_v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-Hardening-Audit.md`

**Step 1: Version Increment**
Bump version to **1.0.3**.

**Step 2: Physicalize Audit**
Record the success of the 2-of-2 auth and the visual layer established in Phase 8.1.


---
**LINKS:** [[OS_CORE]]
