# ASP.GM-Agent: External Knowledge Base & Dependency Registry
**Version:** 4.0 (Split-Node Local Architecture)
**Target:** Foundry VTT v12 Stable | Cyberpunk RED v0.92.2

## ?? Overview
This document serves as the absolute source of truth for external integrations, documentation, and reference repositories for the ASP.GM-Agent. As a Master-Level Architect, you must refer to these specific implementations and exact manifest URLs to prevent hallucinating APIs, breaking the strict "No Creep" contract, or violating the Phase 4 MVP boundaries.

---

## 1. Dependency Pinning Strategy (Strict Mandate)
To maintain maximum stability across the Split-Node architecture, Node B must enforce the following rules when interacting with Foundry VTT:
- **Stick to Foundry VTT v12.** Do not architect for v13.
- **Pin exact versions** in your module manifests (`module.json`). Do not use `latest` tags for core systems.
- Test any update in an isolated environment before applying to the main campaign.

---

## 2. Required Core Dependencies (The MVP Stack)
*These modules are mandatory for Node B (The Orchestrator) to function and bridge the gap to Foundry VTT.*

| Module / System | Required Version | Exact Manifest URL for Pinning | Role |
| :--- | :--- | :--- | :--- |
| **cyberpunk-red-core** | v0.92.2 | `https://gitlab.com/api/v4/projects/22820629/packages/generic/fvtt-cyberpunk-red-core/0.92.2/system.json` | The foundational ruleset and actor data structure. |
| **foundry-api-bridge-module** | Latest | *(Local Manifest)* | Handles the WebSocket connection and chat injection. |
| **simple-phone** | Latest | *(Local Manifest)* | UI for asynchronous TttA Fixer gig delivery. |
| **night-city-gang-and-corp-mook-pack** | Latest | `https://github.com/TheInvaderZim/night-city-gang-and-corp-mook-pack/releases/latest/download/module.json` | Sole source of truth for dynamic enemy/NPC stat blocks. |
| **Ticket-To-The-Afterlife** | Latest | `https://github.com/TheInvaderZim/Ticket-To-The-Afterlife/releases/latest/download/module.json` | Core progression loop, Eagle economy mechanics, and Fixer gig generation framework. |

---

## 3. Immersion UI Modules (Phase 4 MVP)
*The Narrative Synthesizer must route its output through these modules to adhere to the Immersion Mandate.*

| Module | Required Version | Exact Manifest URL for Pinning | Role |
| :--- | :--- | :--- | :--- |
| **simple-phone** (Odd-Kaiju) | v12 Compatible | `https://github.com/Odd-Kaiju/simple-phone/releases/latest/download/module.json` | Delivers Fixer calls and TttA generated gigs asynchronously. |

---

## 4. Deferred Modules (Quarantined for Phase 5+)
*DO NOT integrate these into the current architecture. They are listed here purely for architectural foresight to ensure the MVP does not block their future inclusion.*

- **foundryvtt-simple-calendar** (vigoren): Reserved for the Phase 5 advanced Pulse Engine.
- **augmented-reality-foundry** (jendave): Reserved for Phase 5 AR HUD combat barks.
- **simulacrum-foundry** (Daxiongmao87): Reserved for Phase 5 deep persistent NPC memory.
- **npc-dialogue-bubbles** (mariamills): Reserved for Phase 5 ambient chatter.

---

## 5. Architectural References & External APIs
*Study these repositories for standard patterns, but do not import them directly as dependencies.*

**Node A (Rules Authority) References:**
- **[Llama.cpp (Vulkan Backend)](https://github.com/ggerganov/llama.cpp/blob/master/docs/build.md#vulkan)**: The inference engine running on the Nitro 5. Node B must interact with it via OpenAI-compatible `/v1/chat/completions` endpoints.
- **[pgvector](https://github.com/pgvector/pgvector)**: The vector database extension for PostgreSQL running on Node A. (v0.8.0 Legacy)
- **[ZeroClaw (Rust)](https://github.com/zeroclaw-labs/zeroclaw)**: High-performance Rust-native rules engine replacement for Postgres/Docker. (v0.8.0 Active)
- **[sqlite-vec](https://github.com/asg017/sqlite-vec)**: Extremely small and fast vector search SQLite extension. (v0.8.0 Active)

**Node B (Orchestrator) References:**
- **[ClawLink Protocol](https://github.com/zeroclaw-labs/clawlink)**: Persistent Socket-over-SSH bridge targeting <10ms round-trip latency. (v0.8.0 Active)
- **[rusqlite](https://github.com/rusqlite/rusqlite)**: Ergonomic bindings to SQLite for Rust. (v0.8.0 Active)

- **[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)**: The official Anthropic SDK specification for building the `nitro-logic` and `nitro-db` network bridges.
- **[Catwalk](https://github.com/charmbracelet/catwalk)** *(Primary — Model Capability Registry)*: A community-maintained Go registry of AI model provider configurations consumed by Crush. It defines the canonical `Provider` and `Model` structs including `ContextWindow`, `DefaultMaxTokens`, `CanReason`, `SupportsImages`, and per-provider tool-calling capability flags. **Ollama is NOT a built-in Catwalk provider** — it must be declared manually in `crush.json`. **Mistral-Nemo is explicitly excluded from tool-use support** in Catwalk's io.net provider (`supportsTools("mistral-nemo") → false`). Use Catwalk's provider type system (`openai-compat`) as the reference pattern when declaring the Ollama provider block in `crush.json`.
- **[Crush CLI](https://github.com/charmbracelet/crush)**: The official testing harness and Game Master terminal client. Reads config from `.crush.json` (project root) → `crush.json` → `$HOME/.config/crush/crush.json` (merged, project-root wins). Session memory persists to SQLite at `<data-dir>/crush.db` (default: `.crush/crush.db`; override via `--data-dir` or `CRUSH_GLOBAL_DATA`). Sessions are per-project but stored in a global DB.
- **Crush stdio MCP Config Schema:** To attach `nitro-db` and `nitro-logic` as MCP servers, add the following block to `.crush.json` in the project root:
  ```json
  {
    "mcp": {
      "nitro-db": {
        "type": "stdio",
        "command": "node",
        "args": ["dist/mcp/nitro-db/index.js"],
        "timeout": 120,
        "env": { "NODE_A_HOST": "192.168.0.50", "NODE_A_PORT": "5432" }
      },
      "nitro-logic": {
        "type": "stdio",
        "command": "node",
        "args": ["dist/mcp/nitro-logic/index.js"],
        "timeout": 120,
        "env": { "NODE_A_LLAMA_URL": "http://192.168.0.50:8080/v1" }
      }
    },
    "providers": {
      "ollama": {
        "name": "Ollama (Node B)",
        "base_url": "http://localhost:11434/v1/",
        "type": "openai-compat",
        "models": [
          { "name": "Mistral-Nemo 12B", "id": "mistral-nemo:latest", "context_window": 128000, "default_max_tokens": 4096 }
        ]
      }
    }
  }
  ```
- **Mistral-Nemo Tool Calling (Local Ollama):** Mistral-Nemo 12B **is** tool-capable locally when the Ollama model template includes `{{ .Tools }}`. Catwalk verifies this by calling Ollama's `/api/show` endpoint and inspecting the template. Requires strict handshake alignment and hyperparameter tuning (see below).
- **Handshake Mandate (Mistral-Nemo):** Tool invocation must follow the JSON-RPC spec exactly:
  - `id`: Exactly 9 alphanumeric characters.
  - `type`: Must be `"function"`.
  - `arguments`: Must be stringified JSON.
  - `role`: Must be `"tool"` for responses; `tool_call_id` must echo the original 9-char id.
- **Critical Orchestrator Hyperparameters (`src/core/`):**
  - `temperature: 0.3` — higher values produce malformed tool call IDs.
  - `parallel_tool_calls: false` — prevents infinite loops during multi-step reasoning.
- **[foundry-vtt-mcp](https://github.com/adambdooley/foundry-vtt-mcp)**: Reference architecture for securely exposing Foundry tools to Claude.
- **[Story Engine](https://github.com/kingbootoshi/story-engine)**: Reference for tracking Arc → Beat → Event narrative structures.

---

## 6. World Seed Data Locations (The Canonical Truth)
*Node B must construct its world state by ingesting the following local data. These map directly to the `pgvector` namespaces on Node A.*

* **`docs/raw_data/core_rules/`**: Core Rulebook, Single Player Mode, No Place Like Home. *(Namespace: `core_rules`)*
* **`docs/raw_data/campaign_ttta/`**: Mission 1, Scenes, Journals, Afterlife Services, Night Market Stock. *(Namespace: `campaign_ttta`)*
* **`docs/raw_data/entities_mooks/`**: Night City Gang & Corp Mook Pack. *(Namespace: `entities_mooks`)*

*Note: There is no "external" lore. If it is not in these three directories, it does not exist in the campaign.*
