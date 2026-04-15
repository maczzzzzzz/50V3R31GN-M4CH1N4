# Phase 58: Kinetic Dominance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate high-fidelity combat animations and gunshot sounds into the Foundry VTT module, physically wiring the "Gold Mine" assets into the Automated Animations (AA) and Sequencer engines.

**Architecture:** Automated Animations (AA) + AA For All (AAFA) + Sequencer + Map Shine Advanced.

---

## 🦾 1. ASSET SYNCHRONIZATION
**Goal:** Physically relocate and hash the D: drive assets for module-relative access.
- [ ] **Transfer Assets:** Move `D:\Cyberpunk_Red\combat_animation-sounds\assets\Weapon Sounds` into `50v3r31gn-bridge/assets/audio/combat/`.
- [ ] **Hash Assets:** Run a hashing pass to ensure all filenames are sanitized (no spaces or special chars) for cross-platform interop.
- [ ] **Condition Map:** Import `cub-cyberpunk-red-core-condition-map.json` into the Combat Utility Belt (CUB) settings.

## ⚡ 2. AA JSON REFACTORING
**Goal:** Inject the custom sound paths into the existing AA configuration.
- [ ] **Path Mapping:** Update `fvtt-AutomatedAnimations-Cyberpunkred-v.12.json` to replace placeholder sound paths with the new local bridge paths.
- [ ] **Variancy Injection:** For "Heavy Pistol" and "Assault Rifle," configure AA to randomly select from your 5+ CobaltCatsup sound variants.
- [ ] **Import:** Execute the final JSON import into the Automated Animations Menu Manager within Foundry.

## 🎨 3. VISUAL DOMINANCE (MAP SHINE)
**Goal:** Enable PBR and dynamic reflections for the Atlas maps.
- [ ] **Mask Generation:** Create `_Specular.png` and `_Normal.png` layers for the "Night City 2045 Atlas" maps to enable neon rain reflections.
- [ ] **Layout Wiring:** Use the skeleton diagrams from the DLCs to configure "Roof" and "Wall" masks in Map Shine Advanced for accurate 2.5D shadowing.

## 🐍 4. DIRECTOR SYNC (OUROBOROS)
**Goal:** Wire sound triggers to the narrative engine.
- [ ] **Telemetry Capture:** Update the `sovereign-narrative-client.ts` to log the `animation_type` and `audio_metadata` of combat events.
- [ ] **Tone Shifting:** Add logic to the Director (Node B) to recognize "High-Intensity" audio triggers (e.g., Minigun fire) and increase the "Grit" multiplier in subsequent narration.

## 📱 5. REMOTE SYNCHRONIZATION
**Goal:** Push all documentation to remote for mobile review.
- [ ] **Unblock Guides:** Update `.gitignore` to allow the `akashik_guides/` hierarchy.
- [ ] **Master Push:** Stage all guides, the command manifest, and the new Phase 58 plan.

---
*Roadmap Managed by Gemini CLI (Strategist).*
