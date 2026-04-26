# ◈ REFERENCE: SYSTEM_SOCIOTOMY // THE_ARCHITECTURAL_CUT
**Version:** 3.8.6
**Identity:** 50V3R31GN-M4CH1N4

## 🎯 OBJECTIVE
System Sociotomy is the physical and logical separation of the **Sovereign Intelligence OS** (Functional Logic) from the **Cyberpunk RED Simulation** (Lore/Mechanics). This ensures that the Machine's core reasoning is never polluted by simulation "grime."

---

## 🗄️ 1. THE DUAL-DATABASE TOPOLOGY

### A. SovereignIntelligence.db (The OS Core)
The primary repository for the system's high-level functioning and semantic memory.
- **`system_state`**: Tracks sovereignty depth, node health, active profile, and VRAM budgets.
- **`decision_audit`**: An immutable ledger of VETO/PASS decisions.
- **`palace_core`**: The hierarchical structure of long-term memory.
- **`synapse_captures`**: The **JARVIS Inbox** for raw session data.
- **`synapse_briefs`**: Persisted session syntheses and connections.
- **`os_triplets`**: Vectorized knowledge graph for machine-intelligence facts.

### B. Akashik.db (The RED Simulation Shard)
A modular domain shard dedicated to the 2045 Time of the Red.
- **Tables**: `npcs`, `factions`, `gigs`, `items`, `dv_tables`, `district_*`.
- **`triplets`**: The gritty lore graph (e.g., `NPC_X|member_of|Thick`).
- **`narrative_anchors`**: Stylistic markers for the gritty tone.

---

## 🧠 2. THE SYNAPSE (GRAPH-RELATIONAL MEMORY)

Materialized in Phase 72, the **Synapse** system transforms flat data into a vectorized graph.

- **Capture Pipeline**: Every voice transcript or log is heuristic-parsed for (Subject → Predicate → Object) relationships.
- **Vector Search**: Utilizes `sqlite-vec` to perform 768-dimension semantic queries across all intelligence.
- **Brief Synthesis**: Periodically collapses recent activity into structured connections to surface non-obvious patterns.

---

## 🎭 3. PROFILE-BASED ROUTING

Managed via `SOVEREIGN-IDENTITY.md` in the repository root.

- **[SOVEREIGN_OS]**: 
    - **Artery of Truth**: Connects *only* to `SovereignIntelligence.db`.
    - **Tone**: Radical Candor / Technical.
- **[RED_DIRECTOR]**: 
    - **Artery of Truth**: Attaches `Akashik.db`.
    - **Tone**: Gritty Narrative / Slang.

---
**::/5Y573M-N071C3 : SOCIOTOMY_GATED. THE_CUT_IS_LAW. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
