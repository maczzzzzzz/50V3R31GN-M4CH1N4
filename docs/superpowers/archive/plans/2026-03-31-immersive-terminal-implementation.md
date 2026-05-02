# Immersive Terminal Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Phase 5.2 (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS), including the Discord Chronicler and the Playwright Optical Mesh.

**Architecture:** Discord posts are handled via an MCP tool dispatcher. Visual spatial awareness uses the Playwright MCP server to capture the Foundry canvas and pipes it to Node B's local Llava model for analysis.

**Tech Stack:** TypeScript, MCP SDK, Playwright, Discord Webhooks, Ollama (Llava 7B).

---

### Task 1: The Chronicler (Discord Integration)

**Files:**
- Create: `src/mcp/discord-chronicler/index.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Implement Discord Webhook Tool**
- Scaffold simple MCP server with `screamsheet_post` tool.
- Support `ENV: DISCORD_SCREAMSHEET_WEBHOOK`.

**Step 2: Wire into State Mutation events**
- Update HRC to call `screamsheet_post` after successful `UnifiedStrategic Oracle` updates.

**Step 3: Commit**

---

### Task 2: The Optical Mesh (Browser Vision)

**Files:**
- Create: `src/core/spatial-vision-service.ts`
- Create: `tests/core/spatial-vision-service.test.ts`

**Step 1: Scaffold Playwright capture logic**
- Use `playwright-core` to connect to existing Chrome instance.
- Capture `#canvas` and save to local temp buffer.

**Step 2: Implement Llava tactical analysis**
- Pass buffer to `SovereignCognitionClient`.
- Parse resulting JSON into `VisualTacticalContext`.

**Step 3: Commit**

---

### Task 3: Multimodal HRC Integration

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`
- Modify: `src/core/story-engine.ts`

**Step 1: Implement '/scan' command dispatcher**
- Orchestrate Playwright -> Llava -> RKG Grounding -> Chat Output.

**Step 2: Full E2E Verification**
- Trigger a faction rep change; verify Discord post.
- Trigger a `/scan`; verify AI describes the map tokens correctly.

**Step 3: Commit**


---
**LINKS:** [[OS_CORE]]
