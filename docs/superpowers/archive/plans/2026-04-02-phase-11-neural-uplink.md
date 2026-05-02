# Phase 11: Neural Uplink Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish hardware-level perception and UI control of the Foundry VTT Electron app via Chrome DevTools Protocol (CDP).

**Architecture:** Node B Orchestrator connects to the Foundry Electron process over Port 9222. The `VisualMonitorService` captures raw GPU buffers for grounding and injects real-time CSS/JS for immersion.

**Tech Stack:** Chrome DevTools Protocol (CDP), TypeScript, chrome-devtools-mcp, Electron.

---

### Task 1: The CDP Handshake

**Files:**
- Create: `src/core/visual-monitor-service.ts`
- Modify: `src/main.ts` (Initialize service)

**Step 1: Implement Discovery Logic**
Fetch `http://localhost:9222/json` to identify the primary Foundry VTT renderer target.

**Step 2: Connect to WebSocket**
Establish the CDP WebSocket connection and enable the `Page`, `Runtime`, and `CSS` domains.

**Step 3: Verification**
Log `✅ Neural Uplink: Connected to Foundry Electron (Target: [title])` on startup.

---

### Task 2: GPU-Level Perception (SIMA Pattern)

**Files:**
- Modify: `src/core/visual-monitor-service.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Page.captureScreenshot**
Create a method that pulls the raw PNG buffer from the renderer at the hardware level.

**Step 2: Wire to Project Eyes-On**
Update the `/scan` command to use the CDP buffer instead of Playwright, ensuring 1:1 gm-eye parity.

**Step 3: Verification**
Trigger `/scan` and verify the AI GM correctly describes the current screen state.

---

### Task 3: The Inversion Engine (Real-Time CSS)

**Files:**
- Modify: `src/core/visual-monitor-service.ts`

**Step 1: Implement CSS Injection**
Use `CSS.addRule` to inject the Black-Ice Cyan palette into the live renderer without a page reload.

**Step 2: Implement Narrative Glitch FX**
Create a method `triggerNeuralFeedback()` that uses `CSS.setStyleText` to temporarily shake or blur the UI during high-heat events.

**Step 3: Verification**
Trigger a "God Mode" mutation and verify the Foundry UI physically reacts in real-time.

---

### Task 4: Final v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Sovereignty Audit

**Files:**
- Modify: `docs/IMPLEMENTATION_PLAN.md`
- Create: `docs/audits/2026-04-02_v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-Neural-Uplink-Audit.md`

**Step 1: Version Increment**
Bump version to **1.1.0** (Synthetic Sovereignty + Neural Uplink).

**Step 2: Physicalize Final Audit**
Document the successful bypass of the API sandbox.


---
**LINKS:** [[OS_CORE]]
