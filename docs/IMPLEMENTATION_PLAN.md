# ASP.GM-Agent: Master Implementation Execution Plan
**Version:** 0.5.0 (Infrastructure Stable)
**Target:** v0.6.0 (Phase 4 MVP Completion)
**Architecture:** 100% Local Split-Node (Node A: Rules Authority | Node B: Local Orchestrator)
**Hardware:** Node A (Nitro 5 | Llama-3.2-3B) | Node B (Main Rig | Mistral-Nemo 12B)
**Platform:** Foundry VTT v12 | Cyberpunk RED v0.92.2

## Executive Briefing for AI Agent (Claude Code)
You are tasked with implementing the Node B Orchestrator for the ASP.GM-Agent. You have ingested `CLAUDE.md` (System Directives), `KNOWLEDGE_BASE.md` (Dependency Registry), and the System Architecture Spec. 

Your objective is to build a modular, decoupled TypeScript backend that routes narrative tasks to the local Mistral-Nemo 12B model, and delegates all mechanical TRPG math/rule lookups to the headless Node A server.

**The Golden Rule:** You will not advance to the next phase until the current phase has 100% test coverage and has been explicitly approved by the Lead Architect (the User).

---

## 🗂️ PRE-FLIGHT: Mandatory Research & Context Bridging
**Status:** COMPLETE ✅ (Finalized in v0.4.0)

---

## 🚀 PHASE 0: Local Foundation
**Status:** COMPLETE ✅ (Finalized in v0.4.0)

---

## 🧠 PHASE 1: Data & RAG (`nitro-db`)
**Status:** COMPLETE ✅ (Finalized in v0.4.0)

---

## 🧮 PHASE 2: Rules Authority MCP Bridge (`nitro-logic`)
**Status:** COMPLETE ✅ (Finalized in v0.4.0)

---

## 🎭 PHASE 3: Foundry Bridge & Immersion UI
**Status:** COMPLETE ✅ (Finalized in v0.4.0)

---

## 🌃 PHASE 4: MVP Assembly (Night Market & Story Engine)
**Goal:** Wire the infrastructure into a playable solo loop.
**Version:** v0.6.0
**Status:** IN PROGRESS (ACTIVE)

**Execution Steps:**
1. **Story Engine Core:** Implement the basic Arc → Beat → Event tracking in `src/core/`.
2. **Afterlife Night Market:** Build the basic Eagle economy transaction loop (`execute_ttta_trade`). Ensure purchases decrement the player's Foundry inventory/eb and correctly calculate Eagle conversion rates via `nitro-logic`.
3. **GM Approval Queue:** Scaffold the endpoint allowing the Phils AI Assistant sidebar to intercept and approve major state changes before they are committed to Foundry.
4. **Phase Gate:** Run a full end-to-end simulated cycle: Generate Gig -> Roll Oracle -> Buy Item -> Update Beat. 
5. **FINAL SIGN OFF:** v0.6.0 MVP Complete.

---

## ❄️ PHASE 4.5: The v0.7.0 "Edge-Compute" Migration (Project Black-Ice)
**Goal:** Optimize the infrastructure for high-performance open-world simulation.
**Status:** SLATED (Post-v0.6.0 completion)

**Objectives:**
- **ZeroClaw Deployment:** Decommission Postgres/Docker on Node A; deploy Rust-native ZeroClaw.
- **SQLite Consolidation:** Implement a "Triple-SQLite" stack (Rules, World, Crush).
- **ClawLink Protocol:** Sub-10ms persistent transport over SSH.
- **Unified Oracle:** Knowledge Graph (RKG) on Node B to eliminate narrative drift.

---

## 🚀 PHASE 5: Advanced Mechanics (Red Trade & Braindance)
**Goal:** Expand the world with illegal trade, heat tracking, and therapy.
**Version:** v0.8.0
*(NEXT TARGET)*

---

## 🛑 THE QUARANTINE ZONE (Scope Creep Enforcement)
Under no circumstances are you to architect, scaffold, or write code for the following systems during this implementation run. If the user requests these, gently remind them of the "No Creep" contract.
* **Red Trade (Phase 5):** Contraband, heat tracking, jail mechanics, braindance therapy.
* **Character Creation (Phase 5):** Conversational "Fixer Interview" wizard, automated template mapping, and faction-voiced Lifepath generation.
* **Living City (Phase 6):** Advanced Pulse engine, faction reputation tracking, dynamic turf wars, and Computer Vision map/wall generation.
* **AR HUD Overlays:** Floating combat barks or augmented reality visual effects.
* **Simulacrum Deep Memory:** Persistent cross-session NPC memory banks.
* **Headquarters:** Base upgrades and Morale Boost logic.
