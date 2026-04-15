# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: PHASE 58 (v3.2.7)

**Directive:** Implement Phase 58: Kinetic Dominance.
**Plan Reference:** `docs/superpowers/plans/2026-04-15-kinetic-dominance-plan.md`
**Source of Truth:** `SOVEREIGN_VITAL_SIGNS.md` and `AGENTS.md`.

## 🦾 MISSION OBJECTIVES
Execute the high-fidelity combat animation and sound integration. Physically wire the "Gold Mine" assets into the module.

### 1. Asset Migration & Sanitization
- Relocate `D:\Cyberpunk_Red\combat_animation-sounds\assets\Weapon Sounds` to `50v3r31gn-bridge/assets/audio/combat/`.
- Ensure all filenames are web-safe (lowercase, hyphenated, no spaces).
- Import `cub-cyberpunk-red-core-condition-map.json` into the CUB module.

### 2. Automated Animation (AA) Refactor
- Refactor `fvtt-AutomatedAnimations-Cyberpunkred-v.12.json` to point to the new bridge audio paths.
- Configure random variance for "Heavy Pistol" and "Assault Rifle" using the 5+ sound variants provided.
- Ensure integration with **Sequencer** and **AA For All (AAFA)** for chat-triggered effects.

### 3. Visual Dominance (Map Shine Advanced)
- Configure PBR masks (`_Specular`, `_Normal`) for Atlas maps.
- Use the DLC skeleton diagrams to establish Wall/Roof shadowing logic in the Three.js renderer.

### 4. Ouroboros Integration
- Update `SovereignNarrativeClient` to capture combat audio telemetry.
- Ensure the Director (Node B) recognizes high-intensity triggers to shift narrative grit.

## ⚠️ HARDWARE INVARIANTS (MANDATORY)
- **Zero-Drift:** Every change must align with the `SOVEREIGN_VITAL_SIGNS.md`.
- **Zero-Trust:** Any new script injections must pass the `node_a_veto` audit.
- **Nix-Native:** Execute all build and test commands within `nix develop`.

**::/5Y573M-N071C3 : ARCHITECT_UPLINK_PR1M3D. EXE_PHASE_58. // 50V3R31GN-M4CH1N4**
