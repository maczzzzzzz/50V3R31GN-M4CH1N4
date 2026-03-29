# ASP.GM-Agent: Master Implementation Execution Plan
**Version:** 4.0 (Split-Node Local Architecture)
**Target:** Phase 4 MVP (Strict "No Creep" Boundaries)
**Architecture:** 100% Local Split-Node (Node A: Rules Authority | Node B: Local Orchestrator)
**Hardware:** Node A (Nitro 5 | Llama-3.2-3B) | Node B (Main Rig | Mistral-Nemo 12B)
**Platform:** Foundry VTT v12 | Cyberpunk RED v0.92.2

## Executive Briefing for AI Agent (Claude Code)
You are tasked with implementing the Node B Orchestrator for the ASP.GM-Agent. You have ingested `CLAUDE.md` (System Directives), `KNOWLEDGE_BASE.md` (Dependency Registry), and the System Architecture Spec. 

Your objective is to build a modular, decoupled TypeScript backend that routes narrative tasks to the local Mistral-Nemo 12B model, and delegates all mechanical TRPG math/rule lookups to the headless Node A server.

**The Golden Rule:** You will not advance to the next phase until the current phase has 100% test coverage and has been explicitly approved by the Lead Architect (the User).

---

## 🗂️ PRE-FLIGHT: Mandatory Research & Context Bridging
Before writing a single line of code, you MUST use your agentic tools to perform the following reconnaissance:
1. **MCP Protocol Specs:** Use the `mcp-builder` skill or search the official Anthropic documentation to review the exact TypeScript schemas for building an MCP Server.
2. **Foundry API Bridge:** Research the `foundry-api-bridge-module` payload structures. You must understand how to push a chat message from a Node.js backend into an active Foundry VTT v12 session via WebSockets.
3. **Cyberpunk RED Schema:** Query `docs/raw_data/system-schema.json` to memorize the exact nested paths for the Cyberpunk RED actor state.

---

## 🚀 PHASE 0: Local Foundation
**Goal:** Establish the strict TypeScript environment for local-to-local orchestration.
1. **ESM Scaffolding:** Initialize `package.json` with `"type": "module"` and ES2022 standards.
2. **Schema Definition:** Define Zod models in `src/shared/` for `RulesRequest`, `RulesResponse`, and `NarrativePayload`.
3. **DI Container:** Setup dependency injection to manage local model endpoints.

---

## 🧠 PHASE 1: Data & RAG (`nitro-db`)
**Goal:** Connect to Node A's vector store for Cyberpunk RED lore and TttA content.
1. **Local DB Client:** Scaffold the database client targeting `http://192.168.0.50:5432`.
2. **Vector Service:** Build the tool allowing the local Orchestrator to query lore chunks from Node A via vector similarity search.
3. **Namespace Isolation:** Ensure RAG queries distinguish between `core_rules` and `campaign_lore`.

---

## 🧮 PHASE 2: Rules Authority Bridge (`nitro-logic`)
**Goal:** Force all mechanical resolution to the Nitro 5.
1. **Llama-Server Client:** Build a resilient HTTP client for `http://192.168.0.50:8080/v1`.
2. **Chain of Thought (CoT):** Inject mandatory math suffixes to all Node A prompts to ensure deterministic rule resolution.
3. **Logic Validation:** Use Zod to strip narrative "fluff" from Node A, returning only raw integers/booleans.

---

## 🎭 PHASE 3: Foundry Bridge & Immersion UI
**Goal:** Connect the Node B backend to the Foundry VTT frontend, enforce the Immersion Mandate via local WebSocket integration, and establish the backend endpoints for the Crush CLI testing harness.

**Execution Steps:**
1. **FoundryAdapter Class:** Build the REST/WebSocket singleton in `src/api/` that talks to the `foundry-api-bridge-module`.
2. **Chat Injection:** Create the specific methods required to format the generated prose and push it directly into the Foundry in-game chat log.
3. **Fixer Call Integration:** Implement the payload structure required to trigger the `simple-phone` module for asynchronous TttA gig delivery.
4. **Hybrid Routing Controller:** Build the core logic loop: 
   * *Step A:** Receive game state/chat input from Foundry.
   * *Step B:** Query `nitro-logic` (Node A) for mechanics and DVs.
   * *Step C:** Mistral-Nemo 12B (Node B) generates prose based on Node A's mechanical result.
   * *Step D:** Push prose and dice roll commands to FoundryAdapter.
5. **Agent Harness (Crush CLI Integration):** DO NOT build a custom CLI or terminal interface (e.g., `src/cli/gm-console.ts`). The project strictly utilizes **Crush CLI (`charmbracelet/crush`)** as the testing harness and Game Master terminal client. Your only task here is ensuring the `nitro-db` and `nitro-logic` MCP servers are correctly formatted as standard `stdio` servers so Crush can seamlessly attach to them.
6. **Phase Gate:** Trigger a test Fixer phone call, push a basic narrative string to the Foundry chat, and successfully verify the `stdio` MCP server connection is ready for Crush CLI. Ensure absolutely no meta-text or UI wrappers are visible in-game. Wait for User approval.

---

## 🌃 PHASE 4: MVP Assembly (Night Market & Story Engine)
**Goal:** Wire the completed infrastructure into a playable solo loop.

**Execution Steps:**
1. **Story Engine Core:** Implement the basic Arc → Beat → Event tracking in `src/core/`.
2. **Afterlife Night Market:** Build the basic Eagle economy transaction loop (`execute_ttta_trade`). Ensure purchases decrement the player's Foundry inventory/eb and correctly calculate Eagle conversion rates via `nitro-logic`.
3. **GM Approval Queue:** Scaffold the endpoint allowing the Phils AI Assistant sidebar to intercept and approve major state changes before they are committed to Foundry.
4. **Phase Gate:** Run a full end-to-end simulated cycle: Generate Gig -> Roll Oracle -> Buy Item -> Update Beat. 
5. **FINAL SIGN OFF:** The MVP is complete.

---

## 🛑 THE QUARANTINE ZONE (Scope Creep Enforcement)
Under no circumstances are you to architect, scaffold, or write code for the following systems during this implementation run. If the user requests these, gently remind them of the "No Creep" contract.
* **Red Trade (Phase 5):** Contraband, heat tracking, jail mechanics, braindance therapy.
* **Living City (Phase 6):** Advanced Pulse engine, faction reputation tracking, dynamic turf wars.
* **AR HUD Overlays:** Floating combat barks or augmented reality visual effects.
* **Simulacrum Deep Memory:** Persistent cross-session NPC memory banks.
* **Headquarters:** Base upgrades and Morale Boost logic.