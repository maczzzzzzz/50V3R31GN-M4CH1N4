# 50V3R31GN-M4CH1N4: External Knowledge Base & Dependency Registry
**Version:** 3.2.6 (The Surgical Audit Milestone)
**Target:** v3.2.0+ The Sovereign Handover Milestone

## 🧠 Architectural Patterns (Phase 56+)
These patterns define the "Procedural OS" — the synchronization of hardware perception and agentic logic.

| Pattern | Implementation | Source | Role |
| :--- | :--- | :--- | :--- |
| **Virtual System Bus** | Mmap + UDP | Internal | Lock-free, dual-bus binary state synchronization (FNV-1a). |
| **Nucleus Command Deck**| Next.js + PIXI | Internal | Monolithic high-fidelity command center (CL4W). |
| **Sovereign Triad Bridge**| MCP + Socket | Internal | Shared "Codebase Brain" for Strategist (Gemini) and Architect (Droid). |
| **Interactive Terminal**| REPL (Go) | Internal | Direct two-way narrative bridge to the 12B Brain. |
| **Semantic Palace** | TS + Shell | Internal | Automated organization of RKG data into structured Obsidian folders. |
| **Native Mirror** | Node.js | Internal | Bidirectional Windows-WSL sync bypassing network share limitations. |
| **Ghost Boot** | Go + CDP | Internal | Non-interactive system ignition for automated live-fire audits. |
| **Sovereign Proxy** | Go Sidecar | Internal | Resilient TCP/SSH bridge maintaining ClawLink persistence. |
| **Mini-Vault Judge** | Llama-1.5B (Node A) | Internal | Resident, deterministic rules authority (Open-Reasoner-1.5B). |
| **Tactical-MMU** | Rust (Node A) | Internal | Hardware-accelerated spatial heat-maps (O(1) tactics). |
| **L1-Registry** | Rust (Node B) | Internal | Memory-mapped SQLite mirror for zero-latency NPC data. |
| **Flush Gate** | Bubbletea | Internal | Atomic world-state writes with high-fidelity operator ACK. |
| **Declarative Soul** | Nix | Internal | Nix-managed immutable agentic identity strings (Zero-Drift). |
| **Soul Logger** | TS | Internal | Trajectory capture with semantic `training_value` tagging. |
| **Skill Factory** | TS | Internal | Autonomous shard distillation and skill-stone generation from logs. |
| **FlowState Intuition**| Mmap | Internal | Anticipatory memory caching for zero-latency district RKG retrieval. |
| **Ouroboros Logic** | TS | Internal | Recursive trajectory audit and genetic prompt evolution. |
| **Acceleration (0xSero)**| Nix + Vulkan | Internal | RADV_PERFTEST=sam and GTT resize for 29% faster decode. |

## 📂 Internal Repository Registry
The Sovereign architecture is distributed across specialized sub-repositories within the monorepo.

| Repository | Language | Role |
| :--- | :--- | :--- |
| **zeroclaw** | Rust | **Node A Kernel:** High-performance rules authority; handles VSB UDP and inference judging. |
| **crush** | Go | **The Artery & Control Plane:** Manages process registry, vault security, and the `crush nucleus` bridge. |
| **dashboard** | Next.js 15 | **Nucleus Command Deck (CL4W):** The singular holographic control surface; Next.js 15 + React 19. |
| **50v3r31gn-bridge** | JS/TS | **Motor Cortex:** Foundry VTT module for direct environmental infiltration and WebGL Shroud. |
| **sidecar-atlas** | Rust | **Headless Spatial Engine:** Computes tactical heat-maps and LOS; feeds the `SENSORY` quadrant. |
| **sidecar-cyberdeck**| Rust | **Headless Intrusion Engine:** Manages `ST3GG` decoding and netrun state; feeds the `INTRUSION` quadrant. |
| **sidecar-netrunning**| Rust | **Netrun Simulation:** Logic for deep-net intrusions and tactical intrusion state sync. |
| **sovereign-sdk** | Rust/C | **Protocol SDK:** Unified C-FFI exports for Mmap/VSB structures to eliminate logic drift. |
| **deck-igniter** | Go | **Ignition Supervisor:** TUI-based lifecycle management for all distributed system processes. |


## 📂 External Source Registry
Absolute list of external repositories and technical anchors.

### 📜 Official 2026 Technical Anchors
- **GLM-5.1 (Z.ai)**: [Official Technical Spec](https://z.ai/glm-5-1-docs) — High-endurance autonomous reasoning (8-hour horizons).
- **Foundry VTT v12**: [Developer API Reference](https://foundryvtt.com/api/v12/) — Mandatory for `ApplicationV2` and `DataModel` compliance.
- **Chrome DevTools Protocol**: [CDP API Spec](https://chromedevtools.github.io/devtools-protocol/) — Core bridge for the Neural Uplink.
- **NixOS Ecosystem**: [Flakes & Distributed Build Guide](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake.html).

### 🛠️ Agentic Sources
- **Droid CLI**: [Factory AI](https://docs.factory.ai/cli/getting-started/quickstart): Local agentic engineering CLI.
- **NousResearch Ecosystem**: Context pruning and trajectory logging (Icarus/Hermes).
- **Elder Plinius Ecosystem**: [OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS) and [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE).

## 📦 Dependency Registry (Pinned v3.2.6)

### Deep Reasoning
- **llama.cpp / llama-server**: Native C++ inference engine.
- **GLM-5.1**: Main "Lead Architect" model. Supports interleaved thinking and staircase optimization.
- **Mistral-Nemo-12B (BP-Abliterated)**: Resident Director model. Managed via `DIRECTOR_SOUL.md`.
- **Open-Reasoner-1.5B**: Resident Kernel model. Zero-latency rules enforcement on Node A.

### Interop & Performance
- **NAPI-RS**: Rust native addons for Node.js.
- **steam-run**: FHS-environment wrapper for generic Linux binaries on NixOS.

## 📁 Source of Truth: Data Plane
- **RKG (Relational Knowledge Graph):** `Akashik.db` (Unified World State).
- **Session Memory:** `.crush/crush.db` (Historical Lore).
- **Offline Palace:** `data/vault/RKG` (District-based hierarchical RKG mirror).

---
*Verified by Gemini CLI v3.2.6.*
