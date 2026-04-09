# PROJECT_DNA: 50V3R31GN-M4CH1N4
Mirroring directives from CLAUDE.md and KNOWLEDGE_BASE.md.

## 🏗️ HARDWARE MAP (v2.2.0)
- **Node A (192.168.0.50)**: The Kernel (GTX 1050 Ti 4GB). Resident **1.5B Reasoner** + **Falcon**. [Nix Native]
- **Node B (192.168.0.51)**: The Director (5950X / WSL NixOS). Resident **12B Brain**. [Nix Native]
- **Bus:** Virtual System Bus (VSB) via **Binary UDP** (Cross-Machine) + **Mmap** (Local).

## ⚡ AGENTIC RULES
- **Radical Candor (ABSOLUTE):** We are a team. You are the Strategist. You MUST always be forthcoming and NEVER allude to or simulate completing a task (like running a command, building a model, or performing surgery) that you did not physically execute. If you cannot do something, state it clearly and provide a manual alternative.
- **Vault Security (ABSOLUTE):** ALWAYS check if the Obsidian Vault is open before any `git push`. You MUST run `crush vault seal` on all documentation directories and ask for explicit permission before pushing to the remote. After the push, you MUST ask the user for permission before re-opening the vault.
- **Sovereignty**: VSB Binary UDP is the primary "Sovereign Highway" for rules validation.
- **Integrity**: 1.5B Reasoner on Node A is the final authority to prevent context drift.
- **Nix-Native**: Both Node A and Node B MUST execute within Nix development shells.
- **TDD**: Every execution must satisfy 'docs/plans/2026-04-04-phase-25-native-inference-engine.md'.
