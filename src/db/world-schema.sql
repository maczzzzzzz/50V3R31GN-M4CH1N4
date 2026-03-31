-- Structured NPC table
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 0,
    sp INTEGER DEFAULT 0,
    faction TEXT,
    disposition TEXT CHECK (disposition IN ('friendly', 'neutral', 'hostile')),
    is_alive BOOLEAN DEFAULT 1
);

-- Structured Location table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_faction TEXT,
    is_secured BOOLEAN DEFAULT 0
);

-- Dynamic Triplet Lore table
CREATE TABLE IF NOT EXISTS triplets (
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 index for triplets
CREATE VIRTUAL TABLE IF NOT EXISTS triplets_fts USING fts5(
    subject_id,
    predicate,
    object_literal,
    content=triplets
);
