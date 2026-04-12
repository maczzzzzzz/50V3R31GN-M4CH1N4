# 50V3R31GN-M4CH1N4: External Knowledge Base & Dependency Registry
**Version:** 3.2.0 (The Sovereign Gauntlet Milestone)
**Target:** v3.1.0+ The Sovereign Gauntlet Milestone

## 🧠 Architectural Patterns (Phase 43+)
These patterns define the "Procedural OS" — the synchronization of hardware perception and agentic logic.

| Pattern | Implementation | Source | Role |
| :--- | :--- | :--- | :--- |
| **Virtual System Bus** | Mmap + UDP | Internal | Lock-free, dual-bus binary state synchronization. |
| **Sovereign Triad Bridge**| MCP + Socket | Internal | Shared "Codebase Brain" for Strategist (Gemini) and Architect (Droid). |
| **Interactive Terminal**| REPL (Go) | Internal | Direct two-way narrative bridge to the 12B Brain. |
| **Semantic Palace** | TS + Shell | Internal | Automated organization of RKG data into structured Obsidian folders. |
| **Native Mirror** | Node.js | Internal | Bidirectional Windows-WSL sync bypassing network share limitations. |
| **Ghost Boot** | Go + CDP | Internal | Non-interactive system ignition for automated live-fire audits. |
| **Sovereign Proxy** | Go Sidecar | Internal | Resilient TCP/SSH bridge maintaining ClawLink persistence. |
| **Mini-Vault Judge** | Llama-1.5B (Node A) | Internal | Resident, deterministic rules authority; zero-latency via llama-server. |
| **Tactical-MMU** | Rust (Node A) | Internal | Hardware-accelerated spatial heat-maps (O(1) tactics). |
| **L1-Registry** | Rust (Node B) | Internal | Memory-mapped SQLite mirror for zero-latency NPC data. |
| **Flush Gate** | Bubbletea | Internal | Atomic world-state writes with high-fidelity operator ACK. |

## 📂 Internal Repository Registry
The Sovereign architecture is distributed across specialized sub-repositories within the monorepo.

| Repository | Language | Role |
| :--- | :--- | :--- |
| **zeroclaw** | Rust | High-performance Node A kernel; handles VSB UDP and inference judge. |
| **crush** | Go | Control plane; manages process registry, sidecars, and vault security. |
| **50v3r31gn-bridge** | JS/TS | Foundry VTT v12 module; provides the WebGL Shroud and Motor Cortex. |
| **sidecar-atlas** | Rust | Tactical Radar sidecar; manages spatial heat-maps and egui visualization. |
| **sidecar-cyberdeck**| Rust | Netrunning HUD; handles immersive glitch effects and ST3GG decoding. |
| **sidecar-netrunning**| Rust | Simulation logic for deep-net intrusions and intrusion state sync. |
| **sovereign-sdk** | Rust/C | Unified protocol SDK; provides C-FFI exports for Mmap/VSB structures. |
| **deck-igniter** | Go | System ignition and lifecycle management; supervises all Node B processes. |
| **dashboard** | Next.js | Real-time telemetry dashboard; provides visual dual-node observability. |

## 📂 External Source Registry
Absolute list of external repositories and technical inspirations.

### Active Sources
- **Droid CLI**: [Factory AI](https://docs.factory.ai/cli/getting-started/quickstart): Local agentic engineering CLI.
    - **Synergy:** Shared MCP Bridge allows Gemini (Strategist) and Droid (Architect) to share a unified codebase map.
- **Elder Plinius Ecosystem**:
    - [OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS): Absolute Data Sanitization & Memory Purge.
    - [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE): Procedural Xenolinguistics & Linguistic Steganography.
    - [AutoStoryGen](https://github.com/elder-plinius/AutoStoryGen): Autonomous Agentic Story Generation Loops.
- **charmbracelet**:
    - [Bubble Tea](https://github.com/charmbracelet/bubbletea): The Elm Architecture for Go.
    - [Lip Gloss](https://github.com/charmbracelet/lipgloss): Terminal UI Layout Engine.

## 📦 Dependency Registry (Pinned v3.0.0)

### UI & Layout
- **Pretext**: Pure JS text layout engine (Reflow elimination).
- **Lipgloss**: Terminal UI layout engine (Crush CLI).
- **Bubble Tea**: The Elm Architecture for Go (Crush Auth Pane / Igniter).

### Deep Reasoning (Tier 3 Consultant)
- **llama.cpp / llama-server**: Native C++ inference engine.
- **Pixtral-12B**: Native Vision Language Model (VLM) for Node B map understanding.
- **Factory AI**: Integrated cloud-agent development CLI.

### Interop & Performance
- **NAPI-RS**: Rust native addons for Node.js.
- **steam-run**: FHS-environment wrapper for generic Linux binaries on NixOS.
- **nix-ld**: Dynamic linker for unpatched binaries.

### Core Rules System (Foundry VTT)
- **Cyberpunk RED Core**: `v0.92.3` (**PINNED** for CSS Layer and Foundry v12 support)

### Node B (TypeScript Orchestrator)
- `@modelcontextprotocol/sdk`: `1.28.0`
- `@modelcontextprotocol/server-filesystem`: `1.0.0`
- `@modelcontextprotocol/server-git`: `1.0.0`
- `better-sqlite3`: `12.8.0` (Unified RKG / Lore Engine)
- `chokidar`: `^3.6.0` (Asset & Obsidian Watcher)

## 📁 Source of Truth: Data Plane
- **RKG (Relational Knowledge Graph):** `Akashik.db` (Unified World State).
- **Session Memory:** `.crush/crush.db` (Historical Lore).
- **Offline Palace:** `D:\Obsidian_RKG` (Human-readable RKG mirror).

---
*Verified by Gemini CLI v3.2.0.*
