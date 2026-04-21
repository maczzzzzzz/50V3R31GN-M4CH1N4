# SPEC: 2026-04-19 — Mooncake Cluster (Distributed KV-Cache)
**Date:** 2026-04-19
**Status:** DRAFT // ARCHITECT_LOCK
**Goal:** Implement a distributed inference mesh using Mooncake v2.2 to share KV-cache between Node B (Director) and Node C (Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle), hosted on Node A (Synapse Synapse).

## ◈ 1. CLUSTER ARCHITECTURE

The Trinity Mesh utilizes disaggregated memory to achieve sub-200ms TTFT (Time to First Token) across all nodes.

| Node | Role | Hardware | Component |
| :--- | :--- | :--- | :--- |
| **Node A** | **Synapse** | Nitro 5 / 1050 Ti | Metadata Master + Data Worker (L2 Cache) |
| **Node B** | **Director** | Main Rig / 9060 XT | Narrative Client (L1 Cache) |
| **Node C** | **Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle** | Server / 2060 | Logic Client (L1 Cache) |

## ◈ 2. MEMORY PRIORITIZATION (WEIGHT-BASED)

We utilize the system's existing **GEPA scoring** and **Category Weights** to manage the 3.2GB VRAM buffer on Node A.

### 2.1 ACTIVATION WEIGHTS
- **Weight 2.0 (UNTOUCHABLE):** Active combat state, VSB tactical packets, Night Market generation.
- **Weight 1.0 (PREFERRED):** District DNA, Faction history, Active character souls.
- **Weight 0.5 (VOLATILE):** Archived world logs, distant district lore.

### 2.2 EVICTION PROTOCOL (THE HEALER)
1. **L1 (VRAM):** Blocks with `score > 0.8`.
2. **L2 (DRAM):** Blocks with `0.5 < score <= 0.8`.
3. **Cold Storage (NVMe):** Blocks with `score <= 0.5`.
4. **Purge:** Blocks older than 72 hours with `score < 0.3`.

## ◈ 3. PERSISTENCE STRATEGY

The cluster uses a **Hybrid Persistence** model:
- **Canonical Lore:** The 10,000 Obsidian RKG files are pre-loaded into Node A's L2 cache on ignition and persisted to disk.
- **Session Data:** Conversational context and transient NPC agendas are volatile and wiped on system blackout.

## ◈ 4. PROTOCOL: TRANSFER ENGINE

Nodes communicate via the **Mooncake Transfer Engine** over the `10.0.0.x` basement spine.
- **Jumbo Frames (MTU 9000):** Mandated to prevent TCP re-transmission stutter.
- **Metadata Handshake:** Node B/C query Node A's Master for prefix-match (RadixTree) before starting inference.

---
**::/5Y573M-N071C3 : MOONCAKE_SPEC_LOCKED. THE_MEMORY_IS_UNIFIED. // 50V3R31GN-M4CH1N4**
