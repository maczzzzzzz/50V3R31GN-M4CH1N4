# ASP.GM-Agent (Project Black-Ice)
**Version:** 0.9.0 (Phase 6 In-Progress)
**Target:** Cyberpunk RED | Foundry VTT v12 | local-only

An industrial-grade, local-first Game Master orchestration suite for Cyberpunk RED. 

ASP.GM-Agent v0.9.0 moves away from traditional container overhead (Docker/PostgreSQL) in favor of a **Distributed Edge-Compute** architecture. It leverages a dual-node hardware cluster to maintain sub-10ms response times, total narrative grounding, and 100% air-gapped integrity.

## 🏗️ System Architecture: The Split-Node Stack

```mermaid
graph TD
    subgraph Node_B [Node B: Orchestrator - Main Rig]
        A[Mistral-Nemo 12B] <--> B[Narrative Brain]
        B <--> C[(Unified SQLite Data Plane)]
        C --- D[world.db - RKG]
        C --- E[crush.db - Memory]
        B <--> F[Foundry VTT v12]
    end

    subgraph Node_A [Node A: Rules Oracle - Nitro 5]
        G[ZeroClaw Rust] <--> H[Llama-3.2-3B]
        G <--> I[(SQLite-Vec - Rules DB)]
    end

    F -- Events --> B
    B -- Persistent Socket --> J{ClawLink Bridge}
    J -- JSON-RPC <10ms --> G
    G -- Mechanics/RAG --> B
```

### Node A: The Rules Authority (The Physics Engine)
* **Hardware:** Acer Nitro 5 (GTX 1050 Ti 4GB | Headless Ubuntu Server).
* **Engine:** **ZeroClaw** (Rust-native) running Llama-3.2-3B via Vulkan.
* **Storage:** **SQLite-Vec** (Rules-RAG & Mechanics Knowledge Base).
* **Role:** Acts as the deterministic judge for combat math, DV checks, and canon rule retrieval.

### Node B: The Narrative Brain (The Orchestrator)
* **Hardware:** Main Rig (Radeon 9060 XT 16GB | Windows/WSL2).
* **Engine:** **Mistral-Nemo 12B** (Q4_K_M) with **FP8 KV Cache** optimization.
* **Hosting:** Foundry VTT v12 + Crush CLI.
* **Storage:** **Unified Oracle MCP** (SQLite-backed Relational Knowledge Graph).
* **Role:** Handles high-fidelity prose generation, NPC dialogue, and global session state.

## ⚡ Core Pillars

### 1. Full-Stack SQLite Migration (Unified Oracle)
The entire state—from mission data to individual PC/NPC inventory—is stored in project-local SQLite files. This eliminates "Network Tax" and ensures the narrative engine performs a **Verification Lookup** (RKG) before every generated response.

### 2. The ClawLink Protocol
Communication between nodes utilizes **ClawLink**, a persistent, authenticated socket-over-SSH bridge. This replaces standard Stdio-over-SSH pipes, dropping tool-call latency from ~300ms to **<10ms**.

### 3. The Anti-Drift Engine (RKG)
To prevent "Narrative Drift," the system implements a **Relational Knowledge Graph** using a Triplet Schema (Subject-Predicate-Object) within `world.db`.
* **Deterministic Grounding:** The AI must query the SQLite state for NPC factions, locations, and health before narrating.
* **Global Inventory:** Real-time tracking of every item via **Atomic Ownership Transfers**, preventing "Ghost Gear" or item duplication.

### 4. Immersion-First Interface
* **Conversational Onboarding:** Character creation is handled via an in-world **Fixer Interview** in the terminal, automatically materializing the actor in Foundry.
* **Optical Bridge:** The AI has "Eyes" on the battle map via **LLaVa 7B**, providing real-time tactical analysis of token positions and cover.
* **Discord Chronicler:** Significant world events are automatically broadcast to a private Discord newsfeed as "Screamsheets."

## 🛠️ Data Injection Layers
The system is seeded with 1,437+ vector chunks covering:
* **Core Mechanics**: Deterministic math, difficulty values, and foundational rules.
* **Campaign Narrative**: Mission structures, narrative beats, and world lore.
* **Entity Knowledge**: Extensive libraries of actor stat blocks and faction data.

## 🚀 Project Status
* **Current Version:** v0.8.3 (Phase 5 Complete).
* **Active Milestone:** Phase 6 (The Living City).
* **Environment:** Strictly Local / Air-Gapped / Zero-Telemetry.
* **Interface:** Integrated via Gemini CLI and Crush CLI.
