# ASP.GM-Agent: External Knowledge Base & Dependency Registry
**Version:** 10.0 (Neural Hive Sovereign)
**Target:** v1.7.0+ The Neural Hive Milestone

## 🧠 Architectural Patterns (Phase 19+)
These patterns define the "Neural Hive" — the next evolution of autonomous NPC intelligence.

| Pattern | Implementation | Source | Role |
| :--- | :--- | :--- | :--- |
| **Skillstone** | Markdown Spec | [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE) | Compact conlang specification for LLM in-context learning. |
| **Linguistic Stego** | Rust / Node A | [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE) | Hiding data in conlang text via 9 covert channels. |
| **Invisible Command**| Unicode Tags | [P4RS3LT0NGV3](https://github.com/elder-plinius/P4RS3LT0NGV3) | Hiding raw system instructions (U+E0000) in conlang barks. |
| **Latent Seeding** | pgvector / Node A | [R00TS](https://github.com/elder-plinius/R00TS) | Using conceptual "Seeds" to bias NPC consciousness. |
| **Turn Daemon** | XState / Node B | [AutoStoryGen](https://github.com/elder-plinius/AutoStoryGen) | 4-stage agentic loop (Reason -> Intent -> Action -> Validate). |
| **Self-Describing Map** | Rust / Node A | [ST3GG](https://github.com/elder-plinius/ST3GG) | Embedding wall JSON directly into asset pixels (LSB). |
| **Rules Sidechannel** | Rust / Node A | [ST3GG](https://github.com/elder-plinius/ST3GG) | Hiding mechanical secrets in perception debug image alpha. |
| **TaskRouterProxy** | Rust/Node Swarm | Internal (Plinian Inspired) | Hardware-aware task queuing; manages VRAM swapping. |
| **SensoryFilter** | LOS Engine | Internal (Plinian Inspired) | Filters world-state data via LOS to prevent hallucination. |
| **Layout Sovereignty**| TS + Pretext | [Pretext](https://github.com/chenglou/pretext) | Zero-reflow narrative overlays rendering at 60fps. |
| **Intent Swarm** | TS + Promise.all | Internal | Concurrent classification (Node A Intensity + Node B Tone). |
| **Sequential Grounding**| Model Swap | Internal | Unloading Llama to run Vision/VLM Perception on 4GB VRAM. |
| **Swarm Oracle** | Rust + Tokio | Internal | Concurrent, isolated rules reasoning per faction. |
| **Flush Gate** | SQLite Tx | Internal | Atomic world-state writes with 2nd-signature ACK. |
| **The Rules Vault** | Nix / Bubblewrap | Internal | Immutable, air-gapped hardware sandbox for Node A. |

## 📂 Source Registry
Absolute list of external repositories and technical inspirations.

### Active Sources
- **Elder Plinius Ecosystem**:
    - [GLOSSOPETRAE](https://github.com/elder-plinius/GLOSSOPETRAE): Procedural Xenolinguistics & Linguistic Steganography.
    - [R00TS](https://github.com/elder-plinius/R00TS): Hyperstitional Latent Seeding & Word-to-Consciousness Bias.
    - [AutoStoryGen](https://github.com/elder-plinius/AutoStoryGen): Autonomous Agentic Story Generation Loops.
    - [ST3GG](https://github.com/elder-plinius/ST3GG): Ultimate Steganography Toolkit (LSB Image/Audio).
    - [P4RS3LT0NGV3](https://github.com/elder-plinius/P4RS3LT0NGV3): Linguistic Mutation, Cloaking, & Invisible Commands.
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

## 📂 Repository Registry
The ASP-GM-Agent ecosystem is distributed across specialized repositories for hardware isolation:

- **asp-gm-agent**: The primary TypeScript orchestrator and vision pipeline (Node B).
- **zeroclaw**: The Rust-native rules engine and NVIDIA-bound authority (Node A).
- **foundry-module**: The native Foundry VTT integration layer (ClawLink Client).
- **sidecar-atlas**: The high-performance Egui/Rust radar window (Shared Memory).
- **crush**: The Lipgloss-powered CLI management interface.

## 📦 Dependency Registry (Pinned v1.6.0)

### UI & Layout (Atmosphere First)
- **Pretext**: Pure JS text layout engine (Reflow elimination).

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
- **Precision Data:** `docs/raw_data/core_rules/` (Markdown Rulebooks).

---
*Verified by Gemini CLI v1.6.0.*
