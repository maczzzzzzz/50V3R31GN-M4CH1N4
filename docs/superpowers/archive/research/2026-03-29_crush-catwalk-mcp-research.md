# Research Report: Crush, Catwalk, and Mistral-Nemo MCP Integration
**Date:** Sunday, March 29, 2026
**Subject:** 100% Local Tool-Calling Handshake and Agentic Capabilities

## 1. Charmbracelet Crush (Testing Harness & GM Console)
### 1.1 Transport Protocol
Crush is designed with a native **Model Context Protocol (MCP)** implementation that supports three primary transport types:
- **`stdio`**: Command-line based servers (best for local Node.js binaries).
- **`http`**: Remote endpoints using standard HTTP.
- **`sse`**: Server-Sent Events for real-time tool status updates.

### 1.2 Configuration (crush.json)
Crush searches for configuration in `~/.config/crush/crush.json` or a local `.crush.json` in the project root. MCP servers are defined in a top-level `mcp` object.

### 1.3 Session & Synapse Management
- **Persistent Sessions:** Sessions are stored in a local SQLite database, allowing the GM console to maintain context across restarts.
- **Project-Specific Context:** Crush automatically ingest `CLAUDE.md`, `GEMINI.md`, or `CRUSH.md` to establish project-level constraints and roles.

---

## 2. Charmbracelet Catwalk (Model Capability Mapping)
### 2.1 Tool-Use Mapping
Catwalk is the engine that determines if a model is "agentic" (capable of using tools). It performs several checks:
1.  **Ollama API Query:** It calls the `/api/show` endpoint to inspect the `modelfile`.
2.  **Template Verification:** It specifically looks for a `TEMPLATE` that contains the `{{ .Tools }}` logic.
3.  **Automatic Filtering:** Recent versions of Crush (using Catwalk) will filter available models to show only those officially flagged as tool-capable by the provider.

### 2.2 Recommended Local Models
- **Qwen 2.5 Coder (7B/32B)**: Currently the benchmark for local tool usage.
- **Mistral-Nemo 12B**: Strong performance, but requires specific handshake alignment.
- **Llama 3.1/3.2**: Solid reliability for structured JSON output.

---

## 3. Mistral-Nemo Tool-Calling Handshake (JSON-RPC)
To prevent "Console Crushing" or hallucinated tool IDs in the Crush console, the following handshake requirements are **mandatory** for Mistral-Nemo 12B:

### 3.1 Tool Call Structure (Model Output)
When Mistral-Nemo invokes a tool, the payload MUST contain:
- **`id`**: A string exactly **9 alphanumeric characters** long.
- **`type`**: Must be literally `"function"`.
- **`function.name`**: The exact tool name.
- **`function.arguments`**: A **stringified** JSON object. 

### 3.2 Tool Response Structure (Agent Input)
When returning the result of a tool to the model:
- **`role`**: Must be `"tool"`.
- **`name`**: The name of the tool called.
- **`tool_call_id`**: The exact 9-character ID from the original call.
- **`content`**: The stringified result.

### 3.3 Critical Hyperparameters
For reliable tool invocation, the following parameters must be set in the orchestrator (`src/core/`):
- **Temperature:** **0.3** (Higher values cause malformed IDs).
- **Parallel Tool Calls:** Set to `false` if the console exhibits infinite loops during multi-step reasoning.

---

## 4. Conclusion & Actionable Items
The **`nitro-db`** and **`nitro-logic`** MCP servers must be built as `stdio` transport servers to be compatible with Crush. The orchestrator must enforce the Mistral-Nemo handshake logic to ensure the "No Creep" contract is maintained across the split-node architecture.


---
**LINKS:** [[OS_CORE]]
