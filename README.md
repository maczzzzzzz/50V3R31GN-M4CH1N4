# ASP.GM-Agent (v1.0.3)
### The High-Fidelity Split-Node World Engine


ASP.GM-Agent is a production-grade, air-gapped platform designed for the deterministic orchestration of living tabletop environments. Utilizing a dual-node hardware stack and a task-isolated Rules Oracle, it provides sub-500ms narrative synthesis grounded in hard-coded physics and real-time map topology.

```mermaid
graph TD
    subgraph "Node B: Narrative Orchestrator (Windows/AMD RDNA 4)"
        A[Mistral-Nemo 12B] -->|Narrative| B[Foundry VTT Bridge]
        C[LLava 1.6] -->|Tactical Vision| D[Spatial Fusion Engine]
        E[Crush CLI] -->|Control Plane| A
        J[RulesGrepService] -->|Precision Grounding| A
    end

    subgraph "Node A: Rules Authority (Ubuntu/NVIDIA 1050 Ti)"
        F[ZeroClaw Rust] -->|Swarm RPC| G[Llama 3.2 3B]
        F -->|Geometric Pass| H[Geometric Wall Engine]
        F -->|Constitution| K[RED_RULES.md]
    end

    B <|--| ClawLink Binary Socket + Throttling Queue |--> F
    D <-->|Atomic Flush| I[(SQLite WAL)]
    J -->|Context Extract| L[Markdown Rulebooks]
```

## 🧠 v1.0.2: Production Hardened Baseline

### 1. Hardware-Optimized Dual-Path
The system utilizes native hardware languages to maximize performance across tiered nodes:
- **Node A (CUDA):** NVIDIA-native path for the Rules Authority, ensuring zero-lag mathematical grounding on 4GB hardware.
- **Node B (Vulkan):** Forced Vulkan path for AMD RDNA 4 (RX 9060 XT) to bypass ROCm discovery hangs and provide rock-solid narrative stability.

### 2. The Swarm Oracle (Task-Isolated Reasoning)
Refactoring the Rules Oracle into a **Swarm Architecture**. Node A utilizes `tokio::spawn` to spin up ephemeral "Faction Threads" for concurrent math resolution.
- **Throttling Queue:** Node B serializes requests to Node A to prevent VRAM bandwidth exhaustion, ensuring 100% reliability on consumer hardware.
- **Hard Grounding:** Every thread is anchored by the `RED_RULES.md` Physics Constitution.

### 3. Context Compaction (Search-and-Extract)
Replaces broad, expensive vector RAG with precision **Streaming Extraction**.
- **RulesGrepService:** The `crush` CLI performs a high-speed grep over local Markdown files to pull exact table rows (e.g., "Autofire DV Chart").
- **Zero-Bloat Prompts:** Only the necessary rule snippets are piped into the context, maintaining a pristine 32k context window.

### 4. The Flush Gate (Atomic Persistence)
Implements a transactional barrier in the **Unified Oracle** to ensure world-state integrity.
- **IMMEDIATE Transactions:** Faction shifts and NPC updates are executed as atomic units, preventing data drift.
- **Coupling Rules:** Enforces Cyberpunk RED invariants (e.g., Empathy floors and humanity-derived stat recalculation).

## 🏗️ Technical Architecture
- **ClawLink:** Persistent TCP binary sockets with <10ms latency.
- **Rules Engine:** Rust-native ZeroClaw grounding rules in 100% mathematical truth.
- **Narrative Brain:** Mistral-Nemo 12B optimized with 4-bit KV caching for long-term campaign consistency.

## ⚡ The Crush CLI
The **Crush CLI** is the primary control plane:
- **`/scan`**: Initialize the dual-pass vision pipeline.
- **`/pulse`**: Advance the deterministic world state.
- **`/onboard`**: Orchestrate characterized actor materialization.

---
*Cyberpunk RED is a trademark of R. Talsorian Games. This project is an independent architectural toolset.*
