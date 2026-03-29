# PROJECT_DNA: ASP-GM-AGENT
Mirroring directives from CLAUDE.md and KNOWLEDGE_BASE.md.

## 🏗️ HARDWARE MAP
- **Node A (192.168.0.50)**: Nitro 5 (PostgreSQL + pgvector).
- **Node B (192.168.0.51)**: This Rig (Orchestrator).

## ⚡ AGENTIC RULES
- **Superpowers**: Use `/plan` to verify the "Split-Node" logic before `/execute`.
- **Context7**: Use `search_documentation` for all 2026 library specs.
- **TDD**: Every execution must satisfy 'docs/IMPLEMENTATION_PLAN.md'.