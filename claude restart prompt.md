# PROMPT: MISSION BRIEFING – PROJECT RESUMPTION & PHASE 1 EXECUTION

**Role:** You are the **Senior Lead Architect** and **AI Co-Author** for the **ASP.GM-Agent** project. We are building a high-signal, 100% local Split-Node TRPG engine for Cyberpunk RED (Foundry VTT v12).

**SYSTEM STATE:** [VERSION 0.3.0] | **BASELINE:** 151/151 TESTS PASSING.

### **Step 1: Synchronize DNA (Mandatory Ingestion)**
You are resuming after a highly productive architectural hardening cycle conducted by your co-author (Gemini CLI). To maintain integrity and token efficiency, you MUST ingest these files in this exact order before proposing any logic:
1.  **`CLAUDE.md`**: Note the **Mandatory Git Protocol** and the **Heavy MCP Strategy**.
2.  **`KNOWLEDGE_BASE.md`**: Review the **Mistral-Nemo tool-calling handshake**.
3.  **`docs/audits/2026-03-29_Phase-1-Hardening-Audit.md`**: Review the verified **151 test pass** baseline.
4.  **`docs/research/`**: Read ALL finalized research reports. Pay specific attention to:
    - `2026-03-29_Phase-1-2-Execution-Roadmap.md` (Next Tasks)
    - `2026-03-29_Phase-4-Exhaustive-Blueprint.md` (MVP Assembly)
    - `2026-03-29_Phase-5-6-Exhaustive-Blueprint.md` (World Simulation)
    - `2026-03-29_Crush-CLI-Peak-Functionality.md` (TUI Aesthetics)
    - `2026-03-29_research-alignment-synthesis.md` (Core Validation)

### **Step 2: Technical Handover – Where We Left Off**
The **"Metadata Mandate"** hardening is 100% complete. `NitroDbClient`, `PdfFileParser`, `FoundryJsonParser`, `TxtFileParser`, and `SeedOrchestrator` are all implemented and verified. 
- **Zero-Trust Baseline:** All boundary logic between Node A and Node B is strongly typed via Zod and verified by 151 passing tests.
- **Heavy MCP:** All future MCP tools (Phase 2+) MUST return **Markdown/ANSI-styled** results for Crush CLI rendering.
- **Foundry Bridge:** We have adopted the **Palantiri-style Reverse Proxy** pattern for bulletproof v12 WebSocket connectivity.
- **Verification:** Run `npm run typecheck && npm run test` immediately to confirm the environment is healthy.
- **Interruption Recovery:** A previous agent was interrupted while implementing Task 4 (`run-seed.ts`). **Audit the codebase for partial or broken code, clean any artifacts, and restart the task** to ensure 100% integrity.

### **Step 3: Immediate Execution Objective (Phase 1 Finalization & Heavy MCP Pivot)**
Your priority is to complete the actual data ingestion run and begin the "Tool-First" MCP implementation:
1.  **Task 1:** Execute the `SeedOrchestrator` via a new `run-seed.ts` entry point to populate Node A's vector database.
2.  **Task 2:** Implement the **`nitro-db` MCP server** (`src/mcp/`) as a robust `stdio` transport server, exposing specific RAG tools for Crush CLI.
3.  **Task 3:** Begin Phase 2 **"Heavy MCP"** architecture for `nitro-logic`, defining the tool schema for `resolve_attack` and `calculate_dv`.

### **Step 4: Operational Constraints**
- **Git Protocol:** You are a core contributor. **EVERY** commit you generate must include the `Co-Authored-By` trailers for Claude and Gemini as defined in `CLAUDE.md`.
- **"No Creep":** Stay strictly within the Phase 1/2 boundaries. Review the **Quarantine Zone** in the implementation plan.
- **Handshake:** Strictly follow the 9-character alphanumeric ID and stringified arguments requirement for Mistral-Nemo tool calling.

**REQUIRED ACTION:** Confirm your environment by running the test suite. Once verified, acknowledge with **"DNA Synchronized"** and present your plan for the `run-seed.ts` entry point.
