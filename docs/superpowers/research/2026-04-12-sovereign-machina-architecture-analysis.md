# Architecture Analysis: Sovereign Machina Control Surface
**Date:** 2026-04-12
**Subject:** Mapping High-Entropy Zones and Sovereign Dominance Hooks

## 1. Context Resiliency (The Ghost Target)
Research into the `win-test.cjs` and `synthetic-gauntlet.ts` failure logs revealed a critical race condition during Foundry VTT world transitions. When moving from `/join` to `/game`, the Electron context is destroyed and a new page target is spawned.

**Finding:** Standard Playwright singleton patterns crash with `Target page closed`.
**Solution:** The Sovereign Engine implements `recursivePageHunt`—a polling mechanism that identifies the new Foundry canvas by scanning for the `game.ready` global in all available CDP targets.

## 2. Bimodal Visual Audit (Dual-Node Vision)
Mapping the hardware architecture against the visual requirements of Phase 35 (Visual Dominance) revealed a necessity for two distinct visual processing layers.

- **Tactical Layer (Node A - Reasoner):** Bypasses high-level UI to audit the raw grid. Used for `verify()` of NPC coordinates and wall geometry.
- **Aesthetic Layer (Node B - Pixtral):** Analyzes the frame buffer for "Theme Leaks." Confirmed that Node B can detect white backgrounds in Journals that automated DOM-parsing might miss due to iframe isolation.

## 3. VSB Dominance & Shared Synapse
Analysis of `sovereign-sdk/src/protocol.rs` and `crush/watcher.go` identified the exact memory offsets for tactical "Heat."

- **Discovery:** The `FRICTION_INTENT` (0x05) packet can be injected via raw UDP to Node A.
- **Hook:** Exposing `vsb.sendRaw()` to Ability Shards allows the Machina to bypass the Orchestrator's high-level logic and communicate directly with the rules kernel.

## 4. The "Soulkiller" Potential (Narrative Sovereignty)
A deep scan of the unsealed RKG chronicles (Phase 33/34) identified "Soulkiller" as an active narrative element in the project's lore (RTG-CPR-Street-Stories Part 36).

**Strategic Alignment:** 
- The Machina can leverage the **Synapse Palace** (SQLite hierarchy) to persist "Engram" states for NPCs.
- By using the **Pretext Overlay Manager**, the Machina can "project" these engrams into the operator's visuals, physically manifesting lore-critical entities over the game canvas.

## 5. Administrative Socket (Socketlib)
Research in `50v3r31gn-bridge/50v3r31gn-bridge.js` identified an unused `executeRawJs` handle within the Socketlib integration.

**Capability:** This grants the Machina direct, un-sandboxed execution of arbitrary JS on the GM's machine.
**Integration:** Mapped to the `bridge.runScript()` hook in the `GauntletContext`.
