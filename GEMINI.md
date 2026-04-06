# PROJECT_DNA: 50V3R31GN-M4CH1N4
Mirroring directives from CLAUDE.md and KNOWLEDGE_BASE.md.

## 🏗️ HARDWARE MAP (v1.9.0)
- **Node A (192.168.0.50)**: The Kernel (GTX 1050 Ti 4GB). Resident **1.5B Reasoner** + **Falcon**. [Nix Native]
- **Node B (192.168.0.51)**: The Director (5950X / WSL NixOS). Resident **12B Brain**. [Nix Native]
- **Bus:** Virtual System Bus (VSB) via **Binary UDP** (Cross-Machine) + **Mmap** (Local).

## ⚡ AGENTIC RULES
- **Vault Security (ABSOLUTE):** ALWAYS check if the Obsidian Vault is open before any `git push`. You MUST run `crush vault seal` on all documentation directories before pushing to the remote. After the push, you MUST ask the user for permission before re-opening the vault.
- **Sovereignty**: VSB Binary UDP is the primary "Sovereign Highway" for rules validation.
- **Integrity**: 1.5B Reasoner on Node A is the final authority to prevent context drift.
- **Nix-Native**: Both Node A and Node B MUST execute within Nix development shells.
- **TDD**: Every execution must satisfy 'docs/plans/2026-04-04-phase-25-native-inference-engine.md'.
