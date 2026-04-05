# ASP.GM-Agent: Command & Bridge Manifest (v1.9.0)
**Protocol:** Binary RPC over ClawLink + VSB Sovereign Highway

This document provides an exhaustive list of all control plane commands, startup scripts, developer tools, and API events available across the **Sovereign Highway** architecture.

---

## Master Ignition & Orchestration
These commands are used to launch, build, and maintain the ASP.GM-Agent ecosystem using the Nix-native workflow.

### Nix Environment Commands
| Command | Node | Description |
| :--- | :--- | :--- |
| `nix develop` | Node B | **Primary Shell**: Activates the Vulkan-optimized environment for the Orchestrator. |
| `nix develop .#cuda` | Node A | **Kernel Shell**: Activates the CUDA-optimized environment for the Rules Vault. |

### NPM Scripts (Node B Orchestrator)
| Command | Description |
| :--- | :--- |
| `npm start` | Launches the Node.js Orchestrator (Mistral-Nemo 12B Director). |
| `npm run build` | Compiles the TypeScript source code into the `dist/` directory. |
| `npm run test` | Executes the full Vitest suite (Standard and Integration). |
| `npm run crush` | Launches the Crush CLI control plane. |

---

## Crush CLI: System Control
The Crush CLI is the primary human-in-the-loop management interface for the AI GM.

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/scan` | None | Triggers resident Falcon (Node A) for raw pixel tactical analysis. |
| `/onboard` | `<PlayerName> <Role>` | Initiates the Fixer Interview and character materialization. |
| `/audit` | None | High-signal health check of VSB Bus, Node A/B sync, and hardware. |
| `/flush` | None | Manual trigger for the Akashik Flush Gate (SQLite Commit). |
| `/mission` | `<district>` | Generates a high-fidelity mission blueprint via Mission Swarm. |

---

## Neural Hive Commands (NPC Autonomy)
Commands utilized by the **Turn Daemon** during agentic loops.

| Command | Logic | Authority |
| :--- | :--- | :--- |
| `npc_turn` | Reason -> Intent -> Action | Node B (12B Brain) |
| `validate_npc_action` | VSB Rules Check | Node A (Open-Reasoner-Zero-1.5B) |
| `mutate_skillstone` | Linguistic Mutation | Node B (Mistral-Nemo) |
| `embed_mutation` | P4RS3LT0NGV3 Encode | Node B (Parseltongue) |

---

## Layout & Atmosphere (Bridge)
Commands targeting the **Pretext** engine and Foundry VTT.

| Command | Effect | Engine |
| :--- | :--- | :--- |
| `trigger_pretext` | Zero-reflow UI overlay | Pretext (Canvas) |
| `apply_glitch` | Neural screen artifacting | FXMaster (GPU) |
| `spawn_sequence` | Atomic visual effect | Sequencer (Socket) |
| `matrix_ticker` | Scrolling news/net feed | Pretext (Isometric) |

---

## Perception (Sovereign Sensor)
Commands for physical world grounding.

| Command | Effect | Authority |
| :--- | :--- | :--- |
| `capture_gpu` | Raw screenshot via CDP | Neural Uplink (Node B) |
| `reground_scene` | Full Falcon semantic scan | Node A (Falcon 0.3B) |
| `decrypt_st3gg` | LSB pixel secret decoding | Node A (Rust ST3GG) |

---

## Specialized Sidecars (v1.9.0 Drivers)
OS-level services for the Sovereign Highway.

| Sidecar | Role | Node |
| :--- | :--- | :--- |
| `TACTICAL-MMU` | Hardware-accelerated spatial heat-maps | Node A (Rust) |
| `NEURAL-COMPOSITOR` | 16-core aesthetic latency-masking | Node B (Rust) |
| `L1-REGISTRY` | Memory-mapped SQLite mirror | Node B (Rust) |

---
*Verified by Gemini CLI v1.9.0 Strategist.*
