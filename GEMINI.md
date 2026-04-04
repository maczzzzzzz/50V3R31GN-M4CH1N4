# PROJECT_DNA: ASP-GM-AGENT
Mirroring directives from CLAUDE.md and KNOWLEDGE_BASE.md.

## 🏗️ HARDWARE MAP (v1.8.0)
- **Node A (192.168.0.50)**: The Kernel (GTX 1050 Ti 4GB). Resident **1B Judge** + **Falcon**.
- **Node B (192.168.0.51)**: The Director (5950X 16-core / 16GB VRAM). Resident **12B Brain**.
- **Bus:** Virtual System Bus (VSB) via Binary UDP + Mmap.

## ⚡ AGENTIC RULES
- **Sovereignty**: VSB is the primary "Sovereign Highway" for sub-1ms state sync.
- **Integrity**: 1B Judge on Node A is the final authority to prevent context drift.
- **TDD**: Every execution must satisfy 'docs/plans/2026-04-03-phase-22-sovereign-highway-design.md'.