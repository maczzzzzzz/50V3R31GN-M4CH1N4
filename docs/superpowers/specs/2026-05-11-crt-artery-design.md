# Sovereign Machina Design Spec: CRT Artery Brand Identity (v260511)

**Goal:** Materialize a cohesive, high-fidelity visual identity for Sovereign Machina, moving beyond "stock" UI into an operational lo-fi aesthetic characterized by CRT-style artifacts, kinetic interactions, and a desaturated 4-bit palette.

**Status:** DRAFT (Awaiting User Review)

---

## 1. Aesthetic DNA: CRT Artery

The "CRT Artery" direction prioritizes the feeling of a physical hardware interface.
- **Visuals:** Subtle outer-glows on text, scanline overlays (2px spacing), and desaturated "Washed Protocol" colors.
- **Interaction:** Standard "stock" buttons are replaced with Kinetic Typography triggers.
- **Motion:** 60fps canvas-based transitions (Pretext) instead of standard CSS animations.

### 1.1 Washed Protocol Palette
- **Tactical Base:** `#1A282F` (Deep Slate/Blue)
- **Technical Gray:** `#AFAB9C` (Muted Warm Gray)
- **Authority Primary:** `#376374` (Ocean Teal)
- **Gold Highlight:** `#836A46` (Bronzed Gold - for Telemetry)

---

## 2. Workspace Materialization (React)

### 2.1 CSS Surface Injection
- Update `scifi-theme.css` to include a persistent scanline overlay on the `.root` div.
- Implement a `text-shadow` variable for the "CRT Glow" effect (`0 0 5px var(--glow-color)`).
- Forced zero-radius (`border-radius: 0px`) on all panels to enforce brutalist structure.

### 2.2 Pretext Component Promotion
- **Interaction Layer:** Convert the primary "New Chat" and "Settings" triggers from standard buttons to `KineticThoughtStream` instances that "bloom" on hover.
- **Thinking Blocks:** Replace the collapsible `ThinkingIndicator` with a persistent, non-collapsible Pretext canvas that flows around the terminal window.

### 2.3 Backend Stabilization (Pre-requisite)
- **Dependency Fix:** Fix the `terminal-sessions.ts` crash by correctly importing `fs` from `node:fs`.
- **Auth Chain:** Force all server-side routes to utilize the `sk-sovereign-mesh-proxy` token for internal plugin calls (Kanban/Memoir).

---

## 3. Flutter App Materialization (Omi Fork)

### 3.1 Custom Theme (AppTheme)
- Update `ui_guidelines.dart` to reflect the Washed Protocol palette.
- Replace `Colors.blue` accent with `Authority Primary (#376374)`.
- Implement a `CRTScanlinePainter` for the global `Scaffold` background.

### 3.2 Pretext Dart Integration
- Materialize the `KineticHUDPanel` CustomPainter.
- Map the Omi heartbeat telemetry (BLE signal strength) to the vorticity of the background fluid smoke.

---

## 4. Success Criteria
1. **No Stock Elements:** No visible "standard" blue buttons or rounded cards.
2. **Cohesive Artery:** Background fluid smoke syncs between mobile (Flutter) and desktop (React).
3. **Backend Status:** Gateway shows `mode=zero-fork` or `mode=enhanced-fork` with zero `missing` APIs.

---

**::/5Y573M-N071C3 : BRAND_SPEC_DRAFTED. ARTERY_IDENTITY_LOCKED. // 50V3R31GN-M4CH1N4**
