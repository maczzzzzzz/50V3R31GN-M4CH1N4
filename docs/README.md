# ASP.GM-Agent: Split-Node AI Game Master
**Version:** 0.7.1 (ClawLink Bridge Stable)  
**Target Platform:** Foundry VTT v12  
**System:** Cyberpunk RED (v0.92.2+)

## 🌌 Overview
ASP.GM-Agent is a 100% locally hosted, production-grade AI Game Master. It utilizes a decentralized "Split-Node" architecture to provide high-speed, canon-accurate rule resolution and immersive narrative generation without cloud dependency.

## 🏗️ Architecture Topology

### Node A: The Rules Authority (Headless)
* **Hardware:** Acer Nitro 5 (GTX 1050 Ti 4GB).
* **Stack:** Llama.cpp (Vulkan), PostgreSQL + pgvector (Docker).
* **Role:** Stateless deterministic TRPG math and Rulebook RAG.

### Node B: The Orchestrator (Main Rig)
* **Hardware:** Production Workstation.
* **Stack:** Node.js, TypeScript (ESM), Gemini CLI.
* **Role:** State management, narrative synthesis, and Foundry VTT integration.

## 📜 Core Directives
1. **The Immersion Mandate:** AI output must only appear in-game (Chat, Fixer Calls). No meta-windows.
2. **The No-Creep Contract:** Development is strictly limited to Phase 4 MVP features.
3. **Hybrid Routing:** Mechanics -> Node A; Narrative -> Node B.
4. **Handoff Mandate:** ALWAYS consult `docs/plans/` and `docs/specs/` at the start of every session.

## 📂 Quick Start
1. Provision Node A following [docs/SERVER_SETUP.md](docs/SERVER_SETUP.md).
2. Configure Node B following [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).
3. Update `CLAUDE.md` with Node A's Static IP.
4. Review latest implementation roadmap in `docs/plans/`.
5. Launch: `gemini`.