# ASP.GM-Agent (v1.2.0)
### The Infinite Night Release

ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a native Neural Uplink, it provides sub-500ms narrative synthesis grounded in hard-coded physics, raw pixel perception, and the immutable Akashic Record.

```mermaid
graph TD
    subgraph "Node B: Narrative Orchestrator (Windows/AMD RDNA 4)"
        A[Mistral-Nemo 12B] -->|Narrative| B[Foundry VTT Bridge]
        C[LLava 1.6] -->|Tactical Vision| D[Spatial Fusion Engine]
        E[Crush CLI] -->|Control Plane| A
        J[RulesGrepService] -->|Precision Grounding| A
        M[Strategic Atlas] -->|Shared Memory| D
        N[Neural Uplink CDP] -->|Hardware Eyes| B
    end

    subgraph "Node A: Rules Authority (Ubuntu/NVIDIA 1050 Ti)"
        F[ZeroClaw Rust] -->|Swarm RPC| G[Llama 3.2 3B]
        F -->|Geometric Pass| H[Geometric Wall Engine]
        F -->|Constitution| K[RED_RULES.md]
    end

    B <-->|ClawLink Binary Socket| F
    D <-->|Atomic Flush| I[(Akashik.db WAL)]
    J -->|Context Extract| L[Markdown Rulebooks]
    N -->|GPU Buffers| D
```

## 🧠 v1.2.0: The Infinite Night Release

### Phase 13: Procedural Engine Completion
Phase 13 establishes three core procedural systems:
- **Custom Map Ingestion Engine:** Autonomous chokidar-driven asset indexing with Node A geometric validation and atomic `Akashik.db` writes.
- **Mission Swarm Orchestrator:** Concurrent rules_intel + tactical oracle dispatch with district-aware lore anchoring via `crush.db` session history.
- **Neural Painter:** Single-pass Chrome DevTools Protocol batch materialization for walls, lights, and tokens with full injection safety.

All subsystems tested and production-ready.

### v1.1.2: The Neural Uplink Release (Previous)

#### 1. Neural Uplink (Hardware Perception)
Bypasses the standard API sandbox to grant the AI physical eyes on the game engine via the **Chrome DevTools Protocol (CDP)**.
- **Visual Grounding:** Captures raw GPU rendering buffers for 1:1 pixel parity with the GM's screen.
- **Inversion Engine:** Injects real-time CSS overrides and narrative glitch FX directly into the Electron renderer.
- **Ghost-Refresh:** programmatically reloads the Foundry window to activate module updates without manual intervention.

#### 2. The Akashik Record (Universal Truth)
Transitioned the primary data plane from a local file to the **Akashik.db** universal library.
- **Deterministic Governance:** Locks SQLite derivations (R*Tree, FTS5) via **Nix** to prevent index drift.
- **Vision History:** Stores visual hashes of every tactical state for persistent spatial grounding.

#### 3. Strategic Atlas & Swarm Oracle
- **Zero-Latency Radar:** A Rust-native sidecar window using a **Direct Shared Memory Interconnect** for sub-microsecond state sync.
- **Task-Isolated Math:** Node A spawns concurrent "Faction Threads" to prevent stat-drift in multi-party combat.

## 🏗️ Technical Architecture
- **ClawLink:** Persistent TCP binary sockets with <10ms latency and serializing **Throttling Queue**.
- **Rules Vault:** Rust-native ZeroClaw sandboxed via **Nix + Bubblewrap** (100% air-gapped).
- **Control Plane:** Lipgloss-refit **Crush CLI** with 2-of-2 human authorization mandates.

## ⚡ Key Commands
- **`/scan`**: Initialize the dual-pass vision pipeline (Geometric + Semantic).
- **`/pulse`**: Advance the deterministic world state in Akashik.db.
- **`/onboard`**: Orchestrate characterized actor materialization.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
