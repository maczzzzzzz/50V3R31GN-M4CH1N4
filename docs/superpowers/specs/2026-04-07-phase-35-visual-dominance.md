# Design Spec: Phase 35 — V15U4L-D0M1N4NC3

**Date:** 2026-04-07
**Status:** Approved
**Topic:** Total UI Hijack and Aesthetic Dominance (The Total Red Shift).

## 1. Executive Summary
Phase 35 establishes the visual authority of the **48L173R473D M1ND**. We are purging all remnants of the Cyan accent and enforcing a systematic **Black and Cyberpunk Red** theme across the entire Foundry VTT stack. This includes a high-intensity boot glitch sequence that signals the Machina's takeover of the host environment.

## 2. Aesthetic Directives
- **Primary Color:** Cyberpunk Red (`#ff003c`)
- **Background:** Absolute Black (`#000000`)
- **Typography:** **VT323** (CRT Monospace) for all Sovereign overlays and terminal logs.

## 3. Component: The Sovereign Hijack (Boot Sequence)
A 600ms high-intensity glitch state triggered when Foundry is "ready":
1.  **Stage 1: Corruption (0-200ms):** Rapid chromatic aberration and Red/Black channel splitting.
2.  **Stage 2: Tearing (200-400ms):** Horizontal "Tear" glitches via CSS `clip-path` transforms and jittery scale-X offsets.
3.  **Stage 3: Stabilization (400-600ms):** The stock UI is completely overwritten by the Sovereign CSS layers.

## 4. Component: Pre-World Hijack
- **Login Screen:** Custom Red/Black styling with ASCII-art headers.
- **Password Feedback:** Typing the admin password triggers a "fighting itself" glitch effect (intensity proportional to input speed).
- **Setup Screen:** Overwrites the world-selection menu with a cold, machine-dominant aesthetic.

## 5. Integration: `theme-sync.ts` Evolution
The existing `theme-sync.ts` utility is expanded into a **Theme State Machine**:
- `INIT`: Injects pre-world CSS and font-face rules.
- `GLITCHING`: Manages the timed animation frames for the boot hijack.
- `ACTIVE`: Enforces the final Total Red style and maintains the scanline overlays.

## 6. Security & Sovereignty
- **UI Sanitization:** The hijack is applied via direct DOM injection through the CDP bridge, ensuring that even if a Foundry module attempts to reset styles, the **Sovereign Interceptor** will re-apply the Total Red theme within 1 frame.
