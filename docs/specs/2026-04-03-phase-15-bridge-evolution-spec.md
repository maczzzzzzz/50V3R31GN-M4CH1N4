# Design Spec: Phase 15 — The Bridge Evolution (v1.5.0)

**Status:** ✅ FINALIZED  
**Architecture:** Native Module Hijacking + Resilient Fallbacks  
**Focus:** Offloading Visual/Physical Heavy-Lifting to Foundry Native Shaders

---

## 1. Overview
The **Bridge Evolution** transforms the `asp-gm-bridge` from a simple WebSocket forwarder into a high-performance orchestration layer. It leverages 8 pre-installed Foundry modules to execute complex visual and physical world-shifts with GPU-accelerated performance, bypassing the overhead of raw CDP/DOM manipulation.

## 2. Core Components

### 2.1 Administrative Sovereignty (Socketlib)
- **Goal:** Allow the AI agent (Node B) to execute GM-level JS functions from a non-GM browser session.
- **Physicalization:** Register `socketlib.registerModule("asp-gm-bridge")`.
- **Primary Function:** `executeRawJs(code)` - allows atomic execution of complex macro chains.

### 2.2 Visual Synergy (FXMaster + Active Lights)
- **Goal:** Replace manual CSS glitches with GPU-based screen filters and mathematical light patterns.
- **Physicalization:** `FXMASTER.filters.addFilter()` for aberration/bloom and `df-active-lights` for flickering/pulses.
- **Benefit:** 100% VRAM efficient; no new geometry or transparent DOM layers.

### 2.3 Physical Synergy (Sequencer + Splatter)
- **Goal:** Sequence token materialization with animations, sounds, and persistent blood/damage decals.
- **Physicalization:** `new Sequence().effect().play()` and `Splatter.api.splat()`.
- **Benefit:** High-fidelity "Action Feedback" that persists in the scene.

## 3. Resiliency Tier
The bridge MUST implementation a **Feature Detection** heartbeat:
1. **Tier 1 (Elite):** All modules active → Full Sequencer/FXMaster orchestration.
2. **Tier 2 (Baseline):** Modules missing → Fallback to raw `VisualMonitorService` (CDP/CSS).
3. **Tier 3 (Degraded):** WebSocket fail → Fallback to Strategic Atlas (Shared Memory) only.

---
*The Bridge Evolution: Physical Hands Hardened.*
