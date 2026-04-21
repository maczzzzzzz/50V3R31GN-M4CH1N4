# Design Specification: Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle & Hybrid RKG (v3.2.21)
**Date:** March 31, 2026
**Subject:** Narrative Grounding & World State Persistence
**Status:** FINALIZED

## 1. Executive Summary
The Unified Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle consolidates all mechanical and narrative truth onto Node B. By leveraging SQLite's `ATTACH DATABASE` capability, the system performs cross-database joins between the **Knowledge Graph (world.db)** and the **Session History (crush.db)**. This architecture eliminates "Narrative Drift" and fulfills the **100% Local Integrity** mandate.

## 2. Technical Architecture

### 2.1 The "Triple-SQLite" Data Plane
All data operations on Node B route through the `UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient`, which manages the following local files:
- **`world.db`**: Stores the Hybrid RKG (NPC stats + Triplet-based Lore).
- **`.crush/crush.db`**: Attached at runtime to provide historical context grounding.
- **`rules.db`**: (Read-Only Cache) Stores high-frequency items/gear fetched from Node A.

### 2.2 Hybrid RKG Schema
To balance mechanical performance with narrative flexibility, `world.db` utilizes a dual-layer schema:

#### **Structured Layer (High-Frequency Stats)**
```sql
CREATE TABLE npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 0,
    sp INTEGER DEFAULT 0,
    faction TEXT,
    disposition TEXT CHECK (disposition IN ('friendly', 'neutral', 'hostile')),
    is_alive BOOLEAN DEFAULT 1
);

CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_faction TEXT,
    is_secured BOOLEAN DEFAULT 0
);
```

#### **Dynamic Layer (Triplet Lore)**
```sql
CREATE TABLE triplets (
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(subject_id) REFERENCES npcs(id)
);
CREATE VIRTUAL TABLE triplets_fts USING fts5(subject_id, predicate, object_literal, content=triplets);
```

## 3. The Validated Command Pattern
Mistral-Nemo updates the world state by emitting structured JSON events. These events are intercepted by the TypeScript backend and validated against **Zod schemas** before SQL execution.

**Example AI Command:**
```json
{
  "action": "UPDATE_ENTITY",
  "target": "NPC:Vido",
  "data": { "hp": 15, "disposition": "hostile" }
}
```

## 4. Grounding Flow: "The World Pulse"
Before every response, the `HybridRoutingController` (HRC) executes the following grounding sequence:
1.  **Entity Extraction:** Identify NPCs/Locations mentioned in the user prompt.
2.  **Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Join:** Fetch current stats from `world.db` + last 5 chat messages from `crush.db`.
3.  **Context Injection:** Prepend the "World Pulse" (Status + History) to the System Prompt.
4.  **Verification:** Force the AI to acknowledge the "World Pulse" before generating prose.

## 5. Verification Plan
- **Integrity Test:** Simulate 50 conflicting world updates; verify Zero-Trust rejection of malformed data.
- **Drift Test:** Verify that AI acknowledges NPC health/disposition changes correctly in prose.
- **Latency Check:** Cross-database joins must execute in **<5ms**.
