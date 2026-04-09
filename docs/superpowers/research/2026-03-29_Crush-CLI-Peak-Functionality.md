# Deep Research Analysis: Crush CLI Peak Functionality
**Date:** Sunday, March 29, 2026
**Subject:** Optimizing ASP.GM-Agent for the Charmbracelet Ecosystem

## 1. Executive Summary
This research defines the "Peak Functionality" requirements for the ASP.GM-Agent within the **Crush CLI** (Charmbracelet) environment. It identifies the intersection of **Model Context Protocol (MCP)**, **TUI aesthetics (Lip Gloss/Glamour)**, and **Foundry VTT v12 WebSocket integration**.

## 2. Crush CLI as an MCP Host
Crush acts as the primary orchestrator for our `nitro-db` and `nitro-logic` servers. To achieve peak functionality, our MCP implementation must leverage Crush's native rendering capabilities.

### 2.1 Aesthetic Output (Lip Gloss Synergy)
Crush uses **Glamour** to render Markdown and supports ANSI-styled text via **Lip Gloss**.
- **Requirement:** Our MCP tools must return Markdown-formatted content. 
- **Peak Detail:** Roll results from `nitro-logic` should be returned as Markdown tables with color-coded "Success" (Green) or "Critical Failure" (Red) labels using ANSI escape codes.

### 2.2 Transport Protocol (stdio)
While Crush supports SSE and HTTP, the **`stdio` transport** is the gold standard for our local-only mandate.
- **Optimization:** Implement the `nitro-logic` server in Go or Node.js using the official MCP SDK to ensure robust process management within the Crush lifecycle.

---

## 3. Session & Memory Management
Crush maintains persistent SQLite sessions. To achieve peak multi-agent context, we must map our TRPG state into the Crush session metadata.

### 3.1 Session Persistence
- **Implementation:** The `StoryStateSchema` (researched in the Story Engine analysis) should be mirrored into the Crush session via the `session_metadata` or by providing it as an MCP **Resource**.
- **Multi-Agent Flow:** When switching between agents (e.g., from "Fixer" to "Combat Director"), Crush will maintain the current "Beat" and "Heat" level from the persistent SQLite store.

---

## 4. Foundry VTT v12 Bridge (The "Reverse Proxy" Pattern)
Research into the Foundry v12 API confirms that direct terminal-to-VTT WebSocket connection is fragile due to session cookie requirements and private API changes.

### 4.1 The Palantiri Proxy
To achieve "Bulletproof" connectivity, we will adopt the **JSON-RPC Reverse Proxy** pattern (inspired by the Palantiri module).
- **The Pattern:** A small Foundry module connects *outbound* to a local port managed by our Node B Orchestrator.
- **Crush Interaction:** When Node B receives a "Wall Detection" or "Roll Resolution" tool call from Crush, it pushes the command through the proxy to Foundry.

---

## 5. Peak Functionality Checklist for Phase 2 & 3
- [ ] **Rich Tool Results:** MCP tools must return `TextContent` containing Markdown and ANSI styles for high-fidelity rendering in Crush.
- [ ] **Resource Templates:** Use MCP Resources to provide the LLM with "Rules Cheat Sheets" (e.g., `mcp://core_rules/combat_dv_table`).
- [ ] **YOLO Mode Readiness:** Ensure all MCP tools are compatible with the `--yolo` flag for seamless automated execution during complex tactical scenes.
- [ ] **WebSocket Handshake:** Implement the Palantiri-style outbound socket connection in the `FoundryAdapter`.

## 6. Conclusion
Peak functionality in Crush CLI is achieved by treating the terminal not just as a text logger, but as a **High-Fidelity Dashboard**. By returning styled Markdown and leveraging the persistent session SQLite, we fulfill the **Immersion Mandate** for the GM while maintaining the **100% Local** and **Split-Node** requirements.

**Actionable:** Update the `nitro-db` and `nitro-logic` implementation specs to prioritize **Markdown-wrapped results**.
