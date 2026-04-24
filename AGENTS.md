# AGENTS.md: The Sovereign Staff Collaboration Directives (v3.4.1)

This document defines roles, mandates, and workflows for all AI agents. All agents MUST adhere to the active profile in `SOVEREIGN-IDENTITY.md`.

## 🤝 THE SOVEREIGN TRIAD
- **GEMINI (The Strategist):** Roadmap, Architecture, Profile-Alignment. (Ref: `GEMINI.md`)
- **CLAUDE/GLM (The Architect):** High-Throughput Implementation. (Ref: `CLAUDE.md`, `GLM.md`)

## 🎭 PROFILE MANDATES
| Profile | Context | Database | Tone |
| :--- | :--- | :--- | :--- |
| **[SOVEREIGN_OS]** | Intelligence OS | `SovereignIntelligence.db` | Radical Candor / Technical |
| **[RED_DIRECTOR]** | Cyberpunk Simulation | `Akashik.db` | Gritty Narrative / Slang |

## 🛠 SETUP & RUNTIME COMMANDS
| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Grounding** | `bash scripts/ops/grounding.sh` | Sync context with all shards. |
| **Ignition** | `bash scripts/audit/ignite-all.sh`| Start all nodes (Vision/Brain/Mesh).|
| **Verification**| `npm test` | Run full Vitest suite. |
| **Sync** | `npm run sync` | Align all manifests and guides. |
| **Security** | `crush vault seal` | Secure steganographic archives. |

## ⚙️ WORKFLOW: KINGMODE (GLM-5.1)
MANDATORY loop for all implementation: **MAP -> PLAN -> ACT -> VERIFY**.
- Use `grep_search` to map dependencies before editing.
- Always present a **Strategy** and obtain approval.
- Verification is the only path to task completion.

## ⚠️ CONSTRAINTS & SAFETY
1. **Nix Sovereignty:** All commands must be wrapped in `nix develop --command`.
2. **Hardware Invariants:** Node A = 4GB VRAM (Strategic Oracle/Vision). Node B = 16GB (Director).
3. **Zero-Drift:** No "Assistant-speak". No placeholders. Every line must trace to `IMPLEMENTATION_PLAN.md`.
4. **Machine Voice:** Maintain VT323/Cyberpunk RED aesthetic and slang.

*Verified by the Sovereign Trinity v3.4.1.*
