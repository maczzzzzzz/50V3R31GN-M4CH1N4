# Phase 15 "The Omni-Orchestrator" Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate Narrative and Vision services into a single Gemma-4-VLM (31B) engine.

**Architecture:** Single-process VLM on Node B. Every narrative request triggers an automatic CDP screenshot for simultaneous visual grounding.

**Tech Stack:** Gemma-4-VLM, TypeScript, CDP (Neural Uplink), Akashik.db.

---

### Task 1: Omni-Client Implementation

**Files:**
- Create: `src/core/omni-orchestrator-client.ts`
- Modify: `src/core/interfaces.ts` (Add `IOmniClient`)

**Step 1: Define the Omni-Request Interface**
Implement a request structure that accepts text, images, and RKG context.

**Step 2: Implement the VLM Wrapper**
Create the client logic to call the Gemma-4-VLM endpoint via Ollama.

**Step 3: Verification**
Verify that a single call to `OmniClient` can describe a map and narrate an action correctly.

---

### Task 2: Automated Visual Injection

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Wire Neural Uplink to OmniClient**
Update the narrative loop to automatically capture a CDP screenshot before calling the VLM.

**Step 2: Remove Deprecated Services**
De-commission `TacticalVisionService` and the legacy `SovereignCognitionClient` narrative methods.

**Step 3: Verification**
Trigger an attack in Foundry and verify the AI GM mentions visual details (e.g. "The light from the neon sign glints off your chrome") without a separate scan command.

---

### Task 3: VRAM-Hardened Baseline (v3.8.24-SYNTHESIS-SYNTHESIS)

**Files:**
- Modify: `.env.example`
- Modify: `package.json`

**Step 1: Update Model Tags**
Set `NARRATIVE_MODEL=gemma-4-vlm:31b-iq3_m`.

**Step 2: Optimize KV-Cache**
Lock in the 3.5-bit TurboQuant parameters for Node B.

**Step 3: Verification**
Confirm Node B remains stable under 100% VRAM saturation.

---

### Task 4: Release v3.8.24-SYNTHESIS-SYNTHESIS "The Unified Brain" Audit

**Files:**
- Create: `docs/audits/2026-04-02_v3.8.24-SYNTHESIS-SYNTHESIS-Omni-Audit.md`

**Step 1: Version Increment**
Bump version to **1.2.0**.

**Step 2: Physicalize Final Audit**
Document the successful neural convergence.


---
**LINKS:** [[OS_CORE]]
