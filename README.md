# ASP.GM-Agent

**Version:** 0.2.0

AI-powered Game Master assistant for Cyberpunk RED on Foundry VTT v12.

Split-node local architecture using a remote LLM (Llama 3.2 3B) for rules/math and a local orchestrator for narrative and state management. All output routes through in-game UI — no external chatbot window.

## Stack

- **Node A (Rules Authority):** Llama 3.2 3B via llama.cpp (Vulkan) + PostgreSQL/pgvector
- **Node B (Orchestrator):** TypeScript, Express/Fastify, Prisma, MCP interconnect

## Documentation

- [CLAUDE.md](CLAUDE.md) — Architecture directives and system prompt
- [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md) — Dependency registry and core rules
- [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — Build plan
- [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) — Local development setup
- [CHANGELOG.md](CHANGELOG.md) — Version history
