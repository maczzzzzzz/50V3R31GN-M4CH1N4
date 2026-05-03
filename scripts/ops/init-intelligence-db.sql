-- ◈ SovereignIntelligence.db Schema
-- Materialized for v3.8.29-GOLD

CREATE TABLE IF NOT EXISTS intelligence_shards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    content TEXT NOT NULL,
    reputation REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS shard_fts USING fts5(
    name,
    sector,
    content,
    content='intelligence_shards',
    content_rowid='rowid'
);

-- Triggers for FTS5 sync
CREATE TRIGGER IF NOT EXISTS intelligence_shards_ai AFTER INSERT ON intelligence_shards BEGIN
  INSERT INTO shard_fts(rowid, name, sector, content) VALUES (new.rowid, new.name, new.sector, new.content);
END;

CREATE TRIGGER IF NOT EXISTS intelligence_shards_ad AFTER DELETE ON intelligence_shards BEGIN
  INSERT INTO shard_fts(shard_fts, rowid, name, sector, content) VALUES('delete', old.rowid, old.name, old.sector, old.content);
END;

CREATE TRIGGER IF NOT EXISTS intelligence_shards_au AFTER UPDATE ON intelligence_shards BEGIN
  INSERT INTO shard_fts(shard_fts, rowid, name, sector, content) VALUES('delete', old.rowid, old.name, old.sector, old.content);
  INSERT INTO shard_fts(rowid, name, sector, content) VALUES (new.rowid, new.name, new.sector, new.content);
END;

CREATE TABLE IF NOT EXISTS os_triplets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    source_id TEXT,
    reputation REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE VIRTUAL TABLE IF NOT EXISTS os_triplets_fts USING fts5(
    subject_id,
    predicate,
    object_literal,
    content='os_triplets',
    content_rowid='id'
);

CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
