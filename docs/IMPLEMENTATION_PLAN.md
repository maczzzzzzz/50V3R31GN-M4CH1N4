# ASP.GM-Agent: Master Implementation Execution Plan
**Target:** Phase 4 MVP (Strict "No Creep" Boundaries)
**Architecture:** Split-Node (Node A: Rules Authority | Node B: Orchestrator)
**Platform:** Foundry VTT v12 | Cyberpunk RED v0.92.2

## Executive Briefing for AI Agent (Claude)
You are tasked with implementing the Node B Orchestrator for the ASP.GM-Agent. You have ingested `CLAUDE.md` (System Directives), `KNOWLEDGE_BASE.md` (Dependency Registry), and the System Architecture Spec. 

Your objective is to build a modular, decoupled TypeScript backend that routes narrative tasks to yourself, and delegates all mechanical TRPG math/rule lookups to the headless Node A server via the Model Context Protocol (MCP).

**The Golden Rule:** You will not advance to the next phase until the current phase has 100% test coverage and has been explicitly approved by the Lead Architect (the User).

---

## 🗂️ PRE-FLIGHT: Mandatory Research & Context Bridging
Before writing a single line of code, you MUST use your agentic tools to perform the following reconnaissance:
1. **MCP Protocol Specs:** Use the `mcp-builder` skill or search the official Anthropic documentation to review the exact TypeScript schemas for building an MCP Server.
2. **Foundry API Bridge:** Research the `foundry-api-bridge-module` payload structures. You must understand how to push a chat message from a Node.js backend into an active Foundry VTT v12 session.
3. **Cyberpunk RED Schema:** Query `docs/KNOWLEDGE_BASE.md` to review the expected data structures for the `cyberpunk-red-core` v0.92.2 system.

---

## 🚀 PHASE 0: Foundation & Core Scaffolding
**Goal:** Establish the strict OOP TypeScript environment and build the foundational module architecture.

**Execution Steps:**
1. **Initialize Environment:** Configure `package.json` for strictly typed ES2022 ESM (`"type": "module"`).
2. **Strict Configurations:** Generate a draconian `tsconfig.json` and `.eslintrc.json`. No implicit `any`.
3. **Dependency Injection:** Implement a DI container (e.g., TSyringe or InversifyJS) in `src/core/` to handle class instantiation.
4. **Zod Schemas:** Define the base Zod schemas in `src/shared/` for expected Foundry VTT actor states and roll results.
5. **Phase Gate:** Write Vitest unit tests verifying the DI container resolves dependencies correctly. Wait for User approval.

---

## 🧠 PHASE 1: The RAG & Data Layer (`nitro-db`)
**Goal:** Build the ingestion pipeline and the MCP bridge to Node A's `pgvector` database.

**Execution Steps:**
1. **Database Client:** Scaffold the Prisma or `pg` client in `src/db/` configured to connect to `http://[NODE_A_IP]:5432`.
2. **Schema Definition:** Create the SQL migrations for `rulebook_chunks`, `ttta_journals`, and `entities_mooks`. Ensure every table has a vector column and a `namespace` string column.
3. **Ingestion Script (`seed-world.ts`):** Write the pipeline that reads the local JSONs in `docs/raw_data/`, chunks them, vectorizes them (using Node A's embedding endpoint), and stores them with strict namespace tags.
4. **`nitro-db` MCP Server:** Build the MCP tool that allows you (Claude) to query these vectors by namespace. 
5. **Phase Gate:** Execute `seed-world.ts`. Ensure the database populates. Write tests querying each namespace independently. Wait for User approval.

---

## 🧮 PHASE 2: The Logic Engine Bridge (`nitro-logic`)
**Goal:** Establish the strict math/rules execution pathway to the Llama-3.2-3B model on Node A.

**Execution Steps:**
1. **HTTP Client:** Build a resilient HTTP client in `src/core/` that targets `http://[NODE_A_IP]:8080/v1/chat/completions`. Include timeout and retry logic.
2. **Prompt Injection Middleware:** Create a middleware class that intercepts all payloads bound for Node A and injects the mandatory Chain of Thought prompt (*"Write out the exact equation step-by-step, then provide the final total."*).
3. **`nitro-logic` MCP Server:** Expose tools to yourself such as `calculate_combat_dv`, `roll_oracle`, and `validate_eagle_economy`. 
4. **Data Validation:** Ensure all JSON returning from Node A is validated through Zod before passing into the Node B application state.
5. **Phase Gate:** Send a complex combat math equation through `nitro-logic`. Verify the Zod parser correctly extracts the final integer from the CoT output. Wait for User approval.

---

## 🎭 PHASE 3: Foundry Bridge & Immersion UI
**Goal:** Connect the Node B backend to the Foundry VTT frontend, enforcing the Immersion Mandate.

**Execution Steps:**
1. **FoundryAdapter Class:** Build the REST/WebSocket singleton in `src/api/` that talks to the `foundry-api-bridge-module`.
2. **Chat Injection:** Create the specific methods required to format your generated prose and push it directly into the Foundry in-game chat log.
3. **Fixer Call Integration:** Implement the payload structure required to trigger the `simple-phone` module for asynchronous TttA gig delivery.
4. **Hybrid Routing Controller:** Build the core logic loop: 
   * *Step A:* Receive game state from Foundry.
   * *Step B:* Query `nitro-logic` for mechanics.
   * *Step C:* Claude generates prose based on mechanics.
   * *Step D:* Push prose to FoundryAdapter.
5. **Phase Gate:** Trigger a test Fixer phone call and push a basic narrative string to the Foundry chat. Ensure absolutely no meta-text or UI wrappers are visible. Wait for User approval.

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