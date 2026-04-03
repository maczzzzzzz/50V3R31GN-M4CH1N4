# ASP.GM-Agent: External Knowledge Base & Dependency Registry
**Version:** 5.1 (Omni-Orchestration Hardened)
**Target:** v1.4.0 Phase 15 Baseline

## 🧠 Architectural Patterns (Phase 15+)
These patterns define the "Central Nervous System" of the ASP-GM-Agent.

| Pattern | Implementation | Role |
| :--- | :--- | :--- |
| **Intent Swarm** | TS + Promise.all | Concurrent classification via Node A (Intensity) and Node B (Tone). |
| **Sequential Grounding**| Model Swap Protocol | Unloading Llama to run Falcon Perception Sidecar on 4GB VRAM. |
| **Resilient Bridge** | Module Detection | Feature-aware dispatching with native CDP/CSS fallbacks. |
| **Swarm Oracle** | Rust + Tokio Spawn | Concurrent, isolated rules reasoning per faction. |
| **Flush Gate** | SQLite + IMMEDIATE Tx | Atomic world-state writes with 2nd-signature ACK. |
| **Search-Extract** | TS + Streaming Grep | Precision rulebook grounding (replaces broad RAG). |
| **The Rules Vault** | Nix + Bubblewrap | Immutable, air-gapped hardware sandbox for Node A. |
| **Strategic Atlas** | Rust + egui + ShMem | Zero-latency Sidecar radar window. |

## 📦 Dependency Registry (Pinned v1.4.0)

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
- **Falcon Perception**: 0.3B Multimodal Transformer (OCR, Identity).
  - **Memory:** Sequential VRAM swap on Node A required.
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
*Verified by Gemini CLI v1.4.0.*
