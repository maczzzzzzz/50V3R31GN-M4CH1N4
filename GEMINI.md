# PROJECT_DNA: ASP-GM-AGENT
Mirroring directives from CLAUDE.md and KNOWLEDGE_BASE.md.

## 🏗️ HARDWARE MAP (v1.8.0)
- **Node A (192.168.0.50)**: The Kernel (GTX 1050 Ti 4GB). Resident **1B Judge** + **Falcon**.
- **Node B (192.168.0.51)**: The Director (5950X / WSL NixOS). Resident **12B Brain**.
- **Bus:** Virtual System Bus (VSB) via **Binary UDP** (Cross-Machine) + **Mmap** (Local).

## ⚡ AGENTIC RULES
- **Sovereignty**: VSB Binary UDP is the primary "Sovereign Highway" for rules validation.
- **Integrity**: 1B Judge on Node A is the final authority to prevent context drift.
- **Nix-Native**: All execution MUST happen within the `/home/nixos/asp-gm-agent` internal filesystem.
- **TDD**: Every execution must satisfy 'docs/plans/2026-04-04-phase-22-5-cross-node-stabilization.md'.
