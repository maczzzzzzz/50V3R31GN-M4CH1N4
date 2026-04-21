# Phase 34: 7H3-M3M0RY-P4L4C3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a hierarchical, high-fidelity memory architecture (Synapse Palace) that provides the 48L173R473D M1ND with infinite, consistent context across sessions.

**Architecture:** We will deploy local **ChromaDB** on Node B for verbatim session storage, a temporal SQLite graph for entity relationships, and a 3-phase **Dreaming Loop** on Node A for background lore consolidation and identity promotion.

**Tech Stack:** Node.js, TypeScript, ChromaDB, SQLite, `better-sqlite3`, AAAK Dialect.

---

### Task 1: Palace Foundation (Wings, Rooms, Tunnels)

**Files:**
- Create: `src/core/memory-palace-service.ts`
- Create: `src/db/palace-schema.sql`
- Modify: `src/db/unified-oracle-client.ts`

- [ ] **Step 1: Define Palace SQLite Schema**

Create the schema for the structural hierarchy (Wings, Rooms, Tunnels).

```sql
-- src/db/palace-schema.sql
CREATE TABLE IF NOT EXISTS palace_wings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    wing_type TEXT NOT NULL, -- 'DISTRICT', 'FACTION', 'PLAYER'
    description TEXT,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS palace_rooms (
    id TEXT PRIMARY KEY,
    wing_id TEXT NOT NULL,
    name TEXT NOT NULL,
    room_type TEXT NOT NULL, -- 'POI', 'SCENE', 'ENCOUNTER'
    description TEXT,
    FOREIGN KEY(wing_id) REFERENCES palace_wings(id)
);

CREATE TABLE IF NOT EXISTS palace_tunnels (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    strength REAL DEFAULT 1.0
);
```

- [ ] **Step 2: Initialize Palace in Strategic Oracle**

Modify `UnifiedStrategic OracleClient` to execute the palace schema on startup.

- [ ] **Step 3: Implement SynapsePalaceService Scaffold**

Create the base class that manages the hierarchical navigation.

```typescript
export class SynapsePalaceService {
    async enterRoom(roomId: string): Promise<void> {
        // Update Mmap with current RoomID
        // Load room-specific context from ChromaDB
    }
}
```

- [ ] **Step 4: Commit**

### Task 2: Tiered Storage Integration (Verbatim Drawers)

**Files:**
- Modify: `src/core/memory-palace-service.ts`
- Dependency: `chromadb` (Verify presence or install in Nix shell)

- [ ] **Step 1: Integrate Local ChromaDB**

Initialize ChromaDB client in `SynapsePalaceService`. Configure it to use a local persistent directory (`data/chroma`).

- [ ] **Step 2: Implement Verbatim "Mining"**

Add a method to store raw session logs (verbatim) into the "Drawer" collection, tagged by RoomID and WingID.

```typescript
async mineExchange(roomId: string, user: string, assistant: string): Promise<void> {
    // Add to ChromaDB collection with metadata
}
```

- [ ] **Step 3: Implement Semantic Retrieval**

Add a method to query the Drawer for relevant verbatim context based on current events.

- [ ] **Step 4: Commit**

### Task 3: The Dreaming Loop (OpenClaw Consolidation)

**Files:**
- Create: `src/scripts/dream-daemon.ts`
- Create: `docs/DREAMS.md`

- [ ] **Step 1: Implement Light Phase (Signal Tallying)**

Write logic to scan recent session logs and score lore signals based on frequency and recency.

- [ ] **Step 2: Implement REM Phase (Contradiction Audit)**

Dispatch lore signals to Node A (1.5B Reasoner) to identify contradictions or forge new "True Facts."

- [ ] **Step 3: Implement Deep Phase (RKG Commitment)**

Commit consolidated facts to `Akashik.db` and generate a human-readable entry in `docs/DREAMS.md`.

- [ ] **Step 4: Commit**

### Task 4: Identity Residency (AAAK Dialect)

**Files:**
- Modify: `src/core/nitro-logic-client.ts`
- Modify: `src/core/memory-palace-service.ts`

- [ ] **Step 1: Implement AAAK Compression**

Write a utility to compress the current "Identity" and "Critical Facts" into the ~170-token AAAK footprint.

- [ ] **Step 2: Wire Prompt Prefix Caching**

Update `NitroLogicClient` to use the `llama-server` prefix caching feature. Ensure the AAAK block is sent as the prefix for all narrative turns.

- [ ] **Step 3: Validation Test**

Run a turn simulation and verify the 48L173R473D brain responds with perfect consistency regarding facts from the "Palace."

- [ ] **Step 4: Commit**
