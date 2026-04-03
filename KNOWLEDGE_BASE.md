# ASP.GM-Agent: External Knowledge Base & Dependency Registry
**Version:** 5.0 (Infrastructure Sovereignty)
**Target:** v1.0.4 Baseline Hardened

## 🧠 Architectural Patterns (Phase 7 & 8)
These patterns are the "Bleeding Edge" standards for v1.0.0+.

| Pattern | Implementation | Role |
| :--- | :--- | :--- |
| **Swarm Oracle** | Rust + Tokio Spawn | Concurrent, isolated rules reasoning per faction. |
| **Flush Gate** | SQLite + IMMEDIATE Tx | Atomic world-state writes with 2nd-signature ACK. |
| **Search-Extract** | TS + Streaming Grep | Precision rulebook grounding (replaces broad RAG). |
| **The Rules Vault** | Nix + Bubblewrap | Immutable, air-gapped hardware sandbox for Node A. |
| **Strategic Atlas** | Rust + egui + ShMem | Zero-latency Sidecar radar window. |

## 📦 Dependency Registry (Pinned v1.3.3)

### Core Rules System (Foundry VTT)
- **Cyberpunk RED Core**: `v0.92.2+` (**PINNED** for CSS Layer support)

### Node B (TypeScript Orchestrator)
- `@modelcontextprotocol/sdk`: `1.28.0`
- `better-sqlite3`: `12.8.0`
- `zod`: `3.25.76`
- `node-shared-mem`: `^1.0.0` (Shared Memory Bridge)

### Node A (Rust Rules Engine)
- `tokio`: `1.36` (full features)
- `axum`: `0.7`
- `reqwest`: `0.13.2` (internal Ollama bridge)
- `imageproc`: `0.26` (Geometric Wall Engine)
- `shared_memory`: `^1.0.0` (Binary Radar Data)

## 📁 Source of Truth: Data Plane
- **RKG (Relational Knowledge Graph):** `world.db` (SQLite WAL).
- **Session Memory:** `.crush/crush.db` (Attached to Oracle).
- **Physical Rules:** `RED_RULES.md` (Grounding Anchor).
- **Precision Data:** `docs/raw_data/core_rules/` (Markdown Rulebooks).

---
*Verified by Gemini CLI v1.0.4.*
