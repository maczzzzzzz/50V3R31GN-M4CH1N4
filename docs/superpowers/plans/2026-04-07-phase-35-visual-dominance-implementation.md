# Phase 35: V15U4L-D0M1N4NC3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish total visual authority of the 48L173R473D M1ND by implementing a systematic "Total Red" theme, high-intensity boot glitch sequence, and real-time 1337-5P34K UI corruption.

**Architecture:** We will evolve the existing `theme-sync.ts` into a Theme State Machine that injects CSS/JS payloads via the CDP bridge. This includes a MutationObserver-based text corruption engine and custom CRT-style font injection.

**Tech Stack:** TypeScript, CSS (Animations/Filters), JavaScript (DOM MutationObserver), CDP (Chrome DevTools Protocol).

---

### Task 1: Theme State Machine Evolution (`theme-sync.ts`)

**Files:**
- Modify: `scripts/theme-sync.ts`
- Modify: `src/main.ts` (to trigger the sync)

- [ ] **Step 1: Expand Theme Payloads**

Ensure `scripts/theme-sync.ts` contains the latest `SOVEREIGN_THEME_CSS` and `SOVEREIGN_HIJACK_JS` payloads as defined in the spec.

- [ ] **Step 2: Implement Payload Injection Hook**

In `src/main.ts`, ensure that upon successful CDP connection, the orchestrator executes the `SOVEREIGN_HIJACK_JS` payload in the Foundry context.

- [ ] **Step 3: Commit**

### Task 2: Sovereign Hijack (Boot Glitch Sequence)

**Files:**
- Modify: `scripts/theme-sync.ts`

- [ ] **Step 1: Implement Glitch Stages**

Refine the `triggerGlitch` function in the JS payload to handle the 3-stage transition:
1.  **Corruption:** `filter: hue-rotate(25deg) contrast(2.1)` (0-200ms).
2.  **Tearing:** `clip-path: inset(50% 0 0 0)` with rapid random shifts (200-400ms).
3.  **Stabilization:** Final CSS injection and scanline overlay (400-600ms).

- [ ] **Step 2: Test Injection in Headless Mode**

Run a mock injection and verify the CSS rules are applied to the DOM without errors.

- [ ] **Step 3: Commit**

### Task 3: 1337-5P34K Mutation Engine

**Files:**
- Modify: `scripts/theme-sync.ts` (JS Payload)

- [ ] **Step 1: Implement MutationObserver**

Implement the `MutationObserver` logic within the JS payload to crawl `Text` nodes.

- [ ] **Step 2: Define Rules & Exclusion Zones**

Ensure the `toLeet` function maps `A,E,I,O,S,T` and that the engine ignores `input`, `textarea`, and specific classes like `.hp-value` or `.sp-value`.

- [ ] **Step 3: Commit**

### Task 4: Total Red Migration & Font Injection

**Files:**
- Modify: `foundry-module/styles/black-ice-theme.css`
- Modify: `scripts/theme-sync.ts`

- [ ] **Step 1: Purge Cyan Remnants**

Audit and replace any remaining `#00f3ff` or `--cpr-cyan` variables with `#ff003c` and `--cpr-red`.

- [ ] **Step 2: Wire VT323 Font**

Ensure the `@import` for Google Fonts VT323 is present in the CSS payload and applied to all `body.vtt` and `.window-app` elements.

- [ ] **Step 3: Final Verification**

Launch the orchestrator and verify the "Hard Overwrite" glitch correctly triggers on the Foundry login screen.

- [ ] **Step 4: Commit**

---
