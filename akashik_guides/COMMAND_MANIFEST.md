# ５０Ｖ３Ｒ３１ＧＮ－Ｍ４ＣＨ１Ｎ４: Exhaustive Command Manifest (v3.2.17)
**Protocol:** Binary UDP/TCP over VSB Sovereign Highway

This document is the definitive library of EVERY command available to the USER. Commands are categorized by the environment in which they are executed.

---

## ◈ 0. THE NUCLEUS (Primary Interface)
The WebGL Command Deck is the primary surface for all session operations.

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run crush nucleus` | Ignite Artery | Starts the Go-based Protobuf bridge and Web Deck server at `:3030`. |
| `[FULL_ENGAGE]` | UI Ignition | (In-Deck) Executes the complete multi-tier system boot sequence. |
| `[GHOST_BOOT]` | UI Ignition | (In-Deck) Executes a headless background ignition for audits. |
| `[UNSEAL V4UL7]` | UI Security | (In-Deck) Restores steganographic docs to cleartext for the session. |

---

## ❄️ 1. NIX & SYSTEM SHELL (Entry Point)
Executed from the base terminal (Linux/WSL). These commands initialize the hardware environments.

| Command | Node | Purpose |
| :--- | :--- | :--- |
| `nix develop` | Node B | **Primary Shell**: Activates Node B (AMD/Vulkan) environment. |
| `nix develop .#cuda` | Node A | **Kernel Shell**: Activates Node A (NVIDIA/CUDA) environment. |
| `export NIXPKGS_ALLOW_UNFREE=1` | Both | Mandatory for using proprietary drivers (CUDA/RADV). |

---

## 📦 2. NPM SCRIPTS (Management)
Executed from within a `nix develop` shell in the project root.

### 🚀 Boot & Runtime
| Command | Action |
| :--- | :--- |
| `bash scripts/audit/ignite-all.sh` | **FSSA Ignition**: Surgically boots all nodes for system audit. |
| `npm run crush nucleus` | Launches the **Nucleus Artery** (Primary UI server). |
| `npm run boot` | Debug Mode: Launches the **Deck Igniter** TUI (Deprecated for session start). |
| `npm start` | Launches the Node B Orchestrator (Orchestrates all state). |
| `npm run hub:headless` | Launches the **Cyberdeck HUD** in daemon mode. |
| `npm run atlas:headless` | Launches the **Atlas Radar** in daemon mode. |
| `npm run terminal` | Launches the **Interactive TUI Terminal** (Direct Director link). |

### 🛠️ Development & Build
| Command | Action |
| :--- | :--- |
| `npm run build` | Compiles TypeScript source code. |
| `npm run typecheck` | Validates type safety across the TS codebase. |
| `npm test` | Runs the full Vitest suite within Nix. |
| `npm run build:sidecars` | Compiles all Rust sidecars (Atlas, Cyberdeck, Netrunning). |
| `npm run mcp:start` | Manual launch of the **Sovereign Triad MCP Bridge**. |
| `npm run sync` | Automates the cascading alignment of version headers and guides. |

### 🔍 Audit & Harmonize
| Command | Action |
| :--- | :--- |
| `npm run audit:vitals` | Executes a 3-quadrant hardware/software health audit. |
| `npm run audit:dry-fire` | Executes a full system interaction audit. |
| `npm run audit:theme` | Scans and verifies visual consistency across modules. |
| `npm run harmonize` | Synchronizes the Obsidian RKG with the SQLite Oracle. |
| `npm run gauntlet` | Executes the **Sovereign Gauntlet** validation shards. |

### 🔨 Forge (Asset Generation)
| Command | Action |
| :--- | :--- |
| `npm run forge:master` | The complete automated ingestion and build pipeline. |
| `npm run forge:skills` | Generates new agentic capability shards. |
| `npm run forge:tokens` | Generates NPC/Player tokens for Foundry VTT. |
| `npm run forge:ingest` | Imports raw local assets into the Sovereign pipeline. |

---

## 💥 3. CRUSH CLI (Sovereign Control)
The primary administrative interface. Use `./crush-cli <command>`.

### 🔒 Vault & Security
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `vault seal` | `<dir>` | Steganographically encrypts cleartext into PNG shards. |
| `vault open` | `<dir>` | Restores cleartext from PNG shards using `SOVEREIGN_KEY`. |
| `sovereign-mode` | `[on\|off]` | **God Mode**: Bypasses all rules-oracle checks. |

### 🌌 World State Authority (WSA)
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `wsa unlock` | None | Overwrites Foundry permission hooks via CDP. |
| `wsa dim-lights` | `<float>` | Real-time lighting manipulation (0.0 to 1.0). |
| `wsa shut-down` | None | Emergency kill-switch for all Node B processes. |

### 🛠️ Environment Dominance (DevDom)
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `devdom corrupt-ui` | `[int] [type]` | Injects leet-speak/glitch effects into the Web UI. |
| `devdom ghost-play` | `<file.ghost>` | Replays recorded input sequences (Click/Drag/Key). |
| `chaos network` | `--latency <ms>` | Simulates high-latency network conditions. |

### 🦾 Forge & Perception
| Command | Arguments | Description |
| :--- | :--- | :--- |
| `forge run` | `[--ingestion-dir]` | Starts the standalone Go-based asset forge. |
| `st3gg decode` | `<path>` | Decodes LSB pixel secrets from a PNG. |
| `scan` | `[intent]` | Direct audit query to Node A Reasoner. |
| `crop-scan` | `x y size` | Captures and analyzes a specific coordinate on the map. |

---

## 🎨 4. WEB UI & DASHBOARD (Narrative)
Commands entered directly into the Foundry VTT chat or Interactive Terminal.

| Command | Role | Description |
| :--- | :--- | :--- |
| `/onboard <name> <role>` | User/GM | Initiates the conversational character creation interview. |
| `/buy <item_id>` | Player | Purchases an item from the current Night Market. |
| `/scan` | Player | Triggers visual perception scan of the active scene. |
| `/hack <action> <target>` | Player | Performs a technical intrusion (e.g., `/hack unlock door_01`). |
| `/thought-stream` | User | Displays the Director's real-time <think> blocks. |

---

## 🖥️ 5. POWERSHELL & WINDOWS (Interop)
Executed from the Windows terminal to bridge into the Nix environment.

| Command | Description |
| :--- | :--- |
| `wsl -e nix develop` | Boots the Node B environment from Windows. |
| `.\crush-cli.exe` | Windows-native build of the control plane (if compiled). |
| `npm run test:live` | Bridges Linux logs to Windows-native test runners. |

---
**::/5Y573M-N071C3 : TRU7H UN1F13D. C0MM4ND5 V3R1F13D. // 50V3R31GN-M4CH1N4**
