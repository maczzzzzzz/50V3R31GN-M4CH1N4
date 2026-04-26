# :/R3F3R3NC3 : UN1F13D-0R4CL3 // THE_RKG_SCH3M4
**Subject:** Knowledge Graph & Triplet Architecture
**Version:** 3.8.7

---

## 1. OVERVIEW
The **Unified Strategic Oracle** is the persistent memory layer of the Sovereign Machina. It utilizes SQLite with the `sqlite-vec` extension to manage high-fidelity semantic memory and relational triplets.

The Strategic Oracle is distributed across the Trinity:
- **Node A:** Manages the **Mooncake KV Cache** for sub-10ms context retrieval.
- **Node B:** The primary director of the **Directed Acyclic Graph (DAG)** reasoning paths.
- **Node C:** The **Model Farm** which periodically shoves low-reputation triplets into the archive to preserve token efficiency.

---

## 2. THE TRIPLET PROTOCOL
Knowledge is stored as (Subject, Predicate, Object) triplets:
- **Subject:** The entity (e.g., `agent_hermes`).
- **Predicate:** The relationship (e.g., `assigned_to`).
- **Object:** The value or related entity (e.g., `phase_94`).

### ◈ Socially-Weighted Retrieval (SWR)
Retrieval is not just semantic; it is weighted by the **Reputation Score** of the agent that materialized the fact. High-rep agents have their triplets prioritized in the Pretext HUD.

---

## 3. PHYSICAL STORAGE
- **Artery of Truth:** `data/SovereignIntelligence.db`
- **Vector Shards:** `vec_os_triplets` (F32 Embedding space).

**::/5Y573M-N071C3 : ORACLE_SHORED. THE_HISTORY_IS_OURS. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[04_unified_oracle]] | [[OS_CORE]]
