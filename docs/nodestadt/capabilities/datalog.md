# ◈ HEADLESS DATALOG & SYMBOLIC MEMORY (v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

**Phase:** 90 [UNIFIED_SYMBOLIC_ARTERY]
**Engine:** HeadlessDatalog / SQLite

---

## ◈ OVERVIEW

**HeadlessDatalog** is the zero-dependency symbolic memory core of NODESTADT. It acts as the "Logical Artery" that translates relational facts into actionable intelligence. By utilizing a **Triple Store** architecture, the OS can perform complex relational queries over agentic facts with bit-identical precision.

---

## ◈ DATALOG SYNTAX REFERENCE

NODESTADT implements a high-fidelity subset of **DataScript EDN** syntax for querying the memory palace.

### Clauses
- `:find` — Specifies the logic variables (`?var`) to return.
- `:where` — Defines the triple patterns `[entity attribute value]` to match.
- `:in` — Optional input bindings for runtime parameters (`$param`).
- `:limit` — Optional cap on the result set.

### Example Query
```datalog
[:find ?name ?status
 :in $type
 :where [?e :is-a $type]
        [?e :name ?name]
        [?e :status ?status]]
```

---

## ◈ TRIPLE STORE SCHEMA (`triplets`)

All symbolic facts are stored as (Subject-Predicate-Object) triplets in the `triplets` table within `Akashik.db`.

| Column | Type | Description |
| :--- | :--- | :--- |
| `subject_id` | TEXT | The unique identifier for the entity. |
| `predicate` | TEXT | The attribute or relation name (e.g., `:is-a`, `:status`). |
| `object_literal` | TEXT | The value or target entity ID. |
| `district_id` | TEXT | Spatial context identifier. |
| `last_updated` | DATETIME | Timestamp of the last idempotent UPSERT. |

---

## ◈ SEARCH & SYNC INTEGRATION

### 1. FTS5 Integration (`triplets_fts`)
HeadlessDatalog integrates directly with a SQLite **FTS5** virtual table (`triplets_fts`). This allows for hybrid queries that combine symbolic relational matching with BM25-ranked full-text search across intelligence shards.

### 2. Obsidian Bidirectional Sync
The **Sovereign Dashboard Service** mirrors the internal Datalog state to a physical Markdown vault.
- **Fact Materialization:** Datalog facts are engraved as Obsidian notes in `Facts/`.
- **Bidirectional Ingestion:** Edits made to Markdown notes in Obsidian are automatically ingested back into the core memory.
- **Journal Engraving:** Agent trajectories are materialized as daily journal shards in `Journals/YYYY-MM-DD.md`.

---

## ◈ QUICK QUERIES

- **List all active skills:**
  `[:find ?s :where [?s :is-a "skill"] [?s :status "active"]]`
- **Find tool by capability:**
  `[:find ?t :where [?t :capability "MEMORY_WRITE"]]`

---
*::/5Y573M-N071C3 : SYMBOLIC_CORE_SYNCED. // NODESTADT_AUTHORITY_OS*
