# ASP.GM-Agent: External Knowledge Base & Dependency Registry
**Version:** 6.0 (Omni-Orchestrator Hardened)
**Target:** v1.6.0 Neural Hive Baseline

## 🧠 Architectural Patterns (Phase 18+)
These patterns define the "Central Nervous System" of the ASP-GM-Agent.

| Pattern | Implementation | Role |
| :--- | :--- | :--- |
| **TaskRouterProxy** | Rust/Node Swarm | Hardware-aware task queuing; manages VRAM swapping on Node A. |
| **SensoryFilter** | Foundry LOS Engine | Filters world-state data based on token LOS to prevent AI hallucination. |
| **Intent Swarm** | TS + Promise.all | Concurrent classification via Node A (Intensity) and Node B (Tone). |
| **Layout Sovereignty**| TS + Pretext | Side-stepping DOM reflows for 60fps flowing narrative overlays. |
| **Sequential Grounding**| Model Swap Protocol | Unloading Llama to run Vision/VLM Perception Sidecars on 4GB VRAM. |
| **Resilient Bridge** | Module Detection | Feature-aware dispatching with native CDP/CSS fallbacks. |
| **Swarm Oracle** | Rust + Tokio Spawn | Concurrent, isolated rules reasoning per faction. |
| **Flush Gate** | SQLite + IMMEDIATE Tx | Atomic world-state writes with 2nd-signature ACK. |
| **Search-Extract** | TS + Streaming Grep | Precision rulebook grounding (replaces broad RAG). |
| **The Rules Vault** | Nix + Bubblewrap | Immutable, air-gapped hardware sandbox for Node A. |
| **Strategic Atlas** | Rust + egui + ShMem | Zero-latency Sidecar radar window. |

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
