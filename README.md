# ASP.GM-Agent: The Cyberpunk RED Local AI Orchestrator
**Version:** 0.3.0 (Split-Node Local Architecture)
**Target:** Foundry VTT v12 | Cyberpunk RED v0.92.2+

> "Build with Cloud, Play Local." 

ASP.GM-Agent is a next-generation, 100% local TRPG automation engine designed to act as a seamless, immersive AI Co-Game Master for Cyberpunk RED. It eliminates the "external chatbot" window, routing all AI intelligence directly into the Foundry VTT UI via simulated Fixer calls, AR HUD bubbles, and encrypted chat logs.

## 🏗️ The Split-Node Architecture
To maintain high-performance inference on consumer hardware, the system is physically decoupled into two specialized nodes:

### **Node A: The Rules Authority (Stateless Calculator)**
*   **Hardware:** Remote Server (Acer Nitro 5 | NVIDIA GTX 1050 Ti 4GB).
*   **Engine:** `Llama-3.2-3B-Instruct` (via `llama.cpp` Vulkan backend).
*   **Role:** Handles strict TRPG math, DV resolution, and vector similarity search (`pgvector`).
*   **Philosophy:** Deterministic rule processing. Node A is unaware of narrative state.

### **Node B: The Orchestrator (Narrative Synthesizer)**
*   **Hardware:** Local Main Workstation (16GB+ VRAM).
*   **Engine:** `Mistral-Nemo 12B` (via Ollama).
*   **Role:** Holds world state, orchestrates MCP network calls to Node A, and generates narrative prose.
*   **Philosophy:** Immersion and state management. Node B translates raw math into story.

## ⚡ Key Features
- **The Immersion Mandate:** Zero meta-text. AI output is delivered via the `simple-phone` module or in-game chat.
- **Model Context Protocol (MCP):** Utilizes custom `nitro-db` and `nitro-logic` network bridges to connect the Split-Node stack.
- **Zero-Trust AI Bridging:** All data crossing the node boundary is strictly validated via Zod schemas to ensure mathematical integrity.
- **Crush CLI Integration:** Utilizes `charmbracelet/crush` as the official interactive Game Master terminal and testing harness.

## 📂 Project Documentation
The project follows a strict "Documentation as DNA" philosophy. Refer to these files for deep architectural context:

*   **[CLAUDE.md](CLAUDE.md)**: The Master Directives and Architectural DNA.
*   **[KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md)**: Dependency registry, API specs, and model capability mappings.
*   **[GEMINI.md](GEMINI.md)**: Master directives and hardware mapping for Gemini-based workflows.
*   **[.gemini/](.gemini/)**: Project-specific Gemini CLI configuration and custom command registry.
*   **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)**: The phased roadmap for the Phase 4 MVP.
*   **[LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**: Configuration guide for Node B (Main Rig).
*   **[SERVER_SETUP.md](docs/SERVER_SETUP.md)**: Hardening and service guide for Node A (Nitro 5).

## 🛠️ Tech Stack & Ecosystem
- **Core Engine:** Node.js (TypeScript), ESM, Express/Fastify.
- **Rules Authority (Node A):** [llama.cpp](https://github.com/ggerganov/llama.cpp) (Vulkan) + PostgreSQL/`pgvector`.
- **Narrative Orchestrator (Node B):** [Ollama](https://ollama.com/) (Mistral-Nemo).
- **Agent Harness:** [Crush CLI](https://github.com/charmbracelet/crush) (Official GM Terminal).
- **Capability Mapping:** [Catwalk](https://github.com/charmbracelet/catwalk) (Tool-use integration).
- **Narrative Logic:** [Story Engine](https://github.com/kingbootoshi/story-engine) (State Machine).
- **Validation:** Zod (Zero-Trust Data Integrity).
- **Testing:** Vitest (100% TDD Mandate).

## 🤝 Collaborative Authorship
This project is built through a high-signal partnership between a human lead architect and agentic AI co-authors.

- **Lead Architect:** maczzzzzzz (Human)
- **Co-Author (Architecture & Execution):** [Claude Sonnet 3.5](https://anthropic.com) (Agent)
- **Co-Author (Research & Strategy):** [Gemini CLI](https://github.com/google-gemini/gemini-cli) (Agent)

---
*This is a 100% Local Runtime. Token usage during gameplay is strictly forbidden.*
