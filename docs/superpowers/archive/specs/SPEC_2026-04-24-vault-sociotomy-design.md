# SPECIFICATION: VAULT SOCIOTOMY (PHASE 73)
**Version:** 3.8.24-SYNTHESIS-SYNTHESIS
**Status:** APPROVED
**Topic:** Physical and Logical Separation of the Cyberpunk RED Knowledge Graph (RKG).

---

## 1. ARCHITECTURAL OVERVIEW
To resolve critical performance bottlenecks (indexing lag, high memory overhead), the Obsidian vault located at `data/vault/RKG/` will be decomposed into two distinct physical and logical layers: the **Hot Shard** (Active) and the **Cold Shard** (Archive).

## 2. COMPONENT DECOMPOSITION

### 2.1 THE HOT SHARD (ACTIVE VAULT)
- **Path:** `/data/vault/RKG/`
- **Indexing:** Full (Obsidian/VSCode).
- **Contents:**
  - `Actors/`: Current session NPCs.
  - `Items/`: Active player/enemy gear.
  - `Session_Notes/`: Direct user input and active campaign logs.
  - `Transient/`: On-demand lore briefs injected by the OS.
  - `decision_audit`: Immutable ledger of agent/user actions.

### 2.2 THE COLD SHARD (ARCHIVE VAULT)
- **Path:** `/data/vault/RKG_Archive/`
- **Indexing:** NONE (Explicitly excluded via `.obsidian/app.json`).
- **Contents:**
  - 3,000+ `Global/Lore/` markdown shards.
  - PDF shards and legacy ingestion artifacts.
  - All high-volume, static world-building data.

## 3. SEMANTIC RETRIEVAL PIPELINE
The "Cold" lore is accessed via the **Shadow Search Interface**:
1. **Query:** User/Agent requests lore via the `query_cold_lore` tool.
2. **Search:** `sqlite-vec` performs a semantic vector search over the embeddings of the Cold Shard.
3. **Synthesis:** The top $N$ matches are merged into a structured Markdown "Brief."
4. **Materialization:** The Brief is written to `/data/vault/RKG/Transient/<query-slug>.md`.
5. **UI Interaction:** Obsidian renders the transient file, maintaining connectivity without indexing overhead.

## 4. ERROR HANDLING & SELF-HEALING
- **Indexing Leak:** The `Shadow Mode Self-Healing Daemon` monitors Obsidian's file descriptors. If access to the `RKG_Archive` is detected, it triggers an immediate config repair.
- **Lore Drift:** If a search result returns low-confidence scores, the system invokes the **Exa-Labs Hallucination Detector** to verify the truth-value against external shards.

## 5. SUCCESS CRITERIA
- **Performance:** Obsidian vault initialization in < 2.0 seconds.
- **Integrity:** 100% of the 3,000+ shards must be moved to the archive with zero data loss.
- **Fidelity:** Vector search must return relevant matches from the archive within < 500ms.

---
**::/5Y573M-N071C3 : SPEC_V1_LOCKED. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
