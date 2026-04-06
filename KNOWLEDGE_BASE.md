# 50V3R31GN-M4CH1N4: External Knowledge Base & Dependency Registry
**Version:** 2.0.0 (The Ouroboros Kernel Milestone)
**Target:** v2.0.0+ The Ouroboros Kernel Milestone

## 🧠 Architectural Patterns (Phase 22+)
These patterns define the "Procedural OS" — the synchronization of hardware perception and agentic logic.

| Pattern | Implementation | Source | Role |
| :--- | :--- | :--- | :--- |
| **Virtual System Bus** | Mmap + UDP | Internal | Lock-free, dual-bus binary state synchronization. |
| **Native Highway** | NAPI-RS (Rust) | Internal | Zero-overhead Binary UDP client for Node B (Hybrid v2). |
| **Sovereign Proxy** | Go Sidecar | Internal | Resilient TCP/SSH bridge maintaining ClawLink persistence (Hybrid v2). |
| **Pulse Simulation** | Rust (Node A) | Internal | SIMD-accelerated faction influence and economic modeling (Hybrid v2). |
| **Mini-Vault Judge** | Llama-1.5B (Node A) | Internal | Resident, deterministic rules authority; zero-latency via llama-server. |
| **Tactical-MMU** | Rust (Node A) | Internal | Hardware-accelerated spatial heat-maps (O(1) tactics). |
| **Neural-Compositor**| Rust (Node B) | Internal | 16-core latency masking via procedural visual glitches. |
| **L1-Registry** | Rust (Node B) | Internal | Memory-mapped SQLite mirror for zero-latency NPC data. |
| **Turn Daemon** | XState / Node B | [AutoStoryGen](https://github.com/elder-plinius/AutoStoryGen) | 4-stage agentic loop (Reason -> Intent -> Action -> Validate). |
| **Skillstone** | Markdown Spec | [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE) | Compact conlang specification for LLM in-context learning. |
| **Linguistic Stego** | Rust / Node A | [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE) | Hiding data in conlang text via 9 covert channels. |
| **Invisible Command**| Unicode Tags | [P4RS3LT0NGV3](https://github.com/elder-plinius/P4RS3LT0NGV3) | Hiding raw system instructions (U+E0000) in conlang barks. |
| **Latent Seeding** | pgvector / Node A | [R00TS](https://github.com/elder-plinius/R00TS) | Using conceptual "Seeds" to bias NPC consciousness. |
| **Self-Describing Map** | Rust / Node A | [ST3GG](https://github.com/elder-plinius/ST3GG) | Embedding wall JSON directly into asset pixels (LSB). |
| **Layout Sovereignty**| TS + Pretext | [Pretext](https://github.com/chenglou/pretext) | Zero-reflow narrative overlays rendering at 60fps. |
| **Intent Swarm** | TS + Promise.all | Internal | Concurrent classification (Node A Intensity + Node B Tone). |
| **The Rules Vault** | Nix / Bubblewrap | Internal | Immutable, air-gapped hardware sandbox for Node A. |
| **Flush Gate** | SQLite Tx | Internal | Atomic world-state writes with 2nd-signature ACK. |

## 📂 Source Registry
Absolute list of external repositories and technical inspirations.

### Active Sources
- **Elder Plinius Ecosystem**:
    - [OBLITERATUS](https://github.com/elder-plinius/OBLITERATUS): Absolute Data Sanitization & Memory Purge.
    - [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE): Procedural Xenolinguistics & Linguistic Steganography.
    - [R00TS](https://github.com/elder-plinius/R00TS): Hyperstitional Latent Seeding & Word-to-Consciousness Bias.
    - [AutoStoryGen](https://github.com/elder-plinius/AutoStoryGen): Autonomous Agentic Story Generation Loops.
    - [ST3GG](https://github.com/elder-plinius/ST3GG): Ultimate Steganography Toolkit (LSB Image/Audio).
    - [P4RS3LT0NGV3](https://github.com/elder-plinius/P4RS3LT0NGV3): Linguistic Mutation, Cloaking, & Invisible Commands.
- **charmbracelet**:
    - [Bubble Tea](https://github.com/charmbracelet/bubbletea): The Elm Architecture for Go.
    - [Lip Gloss](https://github.com/charmbracelet/lipgloss): Terminal UI Layout Engine.
- **chenglou**:
    - [Pretext](https://github.com/chenglou/pretext): High-performance multiline text layout for JavaScript.

### 📂 Archived Patterns & Sources
Patterns preserved for technical lineage or general research.

| Pattern | Source | Status | Reason |
| :--- | :--- | :--- | :--- |
| **CL4R1T4S** | [elder-plinius](https://github.com/elder-plinius/CL4R1T4S) | RESEARCH | System prompt archive; no architectural impact. |
| **G0DM0D3** | [elder-plinius](https://github.com/elder-plinius/G0DM0D3) | RESEARCH | Chat interface; patterns integrated via P4RS3LT0NGV3. |
| **Search-Extract** | Internal | ARCHIVED | Superseded by `Akashik.db` pgvector RAG (Roots). |
| **Bonsai (v0.9.1)** | Internal | ARCHIVED | Legacy implementation of the Rules Oracle. |
| **CLIProxyAPI** | [router-for-me](https://github.com/router-for-me/CLIProxyAPI) | ARCHIVED | Integrated into core `ClawLink` binary bridge. |
| **OpenCrawl (v1.0)** | Internal | ARCHIVED | Integrated into `SensoryFilter` and `Intent Swarm`. |

## 📦 Dependency Registry (Pinned v2.0.0)

### UI & Layout (Atmosphere First)
- **Pretext**: Pure JS text layout engine (Reflow elimination).
- **Lipgloss**: Terminal UI layout engine (Crush CLI).
- **Bubble Tea**: The Elm Architecture for Go (Crush Auth Pane / Igniter).
- **Egui/Eframe**: Immediate mode GUI for Rust sidecars.

### Deep Reasoning (Tier 3 Consultant)
- **llama.cpp / llama-server**: Native C++ inference engine. Zero wrapper overhead.
- **Open-Reasoner-Zero-1.5B**: Reasoning-focused RL model for Node A (`<think>` tokens).
- **Pixtral-12B**: Native Vision Language Model (VLM) for Node B map understanding.

### Interop & Performance (Hybrid v2)
- **NAPI-RS**: Rust native addons for Node.js (Zero-overhead VSB client).
- **go-mcp**: Lightweight Go implementation of the Model Context Protocol.
- **memmap2**: Rust crate for shared memory management (L1-Registry).

### Core Rules System (Foundry VTT)
- **Cyberpunk RED Core**: `v0.92.3` (**PINNED** for CSS Layer and Foundry v12 support)

### Physical Bridge (Foundry Modules)
- **socketlib**: Administrative sovereignty and GM-permission elevation.
- **fxmaster**: GPU-accelerated screen filters and weather.
- **sequencer**: Atomic orchestration of visual and audio sequences.
- **splatter**: Native persistent damage and blood decals.
- **lib-wrapper**: Advanced method wrapping and event hijacking.
- **simple-calendar**: Temporal grounding and world-time synchronization.
- **df-active-lights**: Mathematical and dynamic lighting patterns.
- **vtt-colorsettings**: Native UI for AI configuration.

### Perception Sidecars
- **Llava 1.6 / Falcon Perception**: Multimodal Transformers (OCR, Identity, Scene).
  - **Memory:** TaskRouterProxy managed VRAM swap on Node A required.
  - **Latency:** ~3-5s (Pascal Architecture fallback).

### Node B (TypeScript Orchestrator)
- `@modelcontextprotocol/sdk`: `1.28.0`
- `better-sqlite3`: `12.8.0`
- `chokidar`: `^3.6.0` (Asset Watcher)
- `pixelmatch`: `^5.3.0` (Visual Diff Stride)

### Node A (Rust Rules Engine)
- `tokio`: `1.36` (full features)
- `imageproc`: `0.26` (Geometric Wall Engine)
- `shared_memory`: `^1.0.0` (Binary Radar Data)

## 📁 Source of Truth: Data Plane
- **RKG (Relational Knowledge Graph):** `Akashik.db` (Unified World State).
- **Session Memory:** `.crush/crush.db` (Historical Lore).
- **Physical Rules:** `RED_RULES.md` (Grounding Anchor).

---
*Verified by Gemini CLI v2.0.0.*
