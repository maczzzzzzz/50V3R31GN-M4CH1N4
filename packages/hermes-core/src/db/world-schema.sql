-- ◈ SOVEREIGN OS : CORE DATABASE SCHEMA (Clean BASE)
-- Standardized state persistence for the nervous system and zero-trust arteries.

-- Structured Location table
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_faction TEXT,
    district_id TEXT,
    is_secured BOOLEAN DEFAULT 0
);

-- Dynamic Triplet Lore table
CREATE TABLE IF NOT EXISTS triplets (
    subject_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_literal TEXT NOT NULL,
    district_id TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 index for triplets
CREATE VIRTUAL TABLE IF NOT EXISTS triplets_fts USING fts5(
    subject_id,
    predicate,
    object_literal,
    content=triplets
);

-- Triggers to keep FTS5 index in sync
CREATE TRIGGER IF NOT EXISTS triplets_ai AFTER INSERT ON triplets BEGIN
  INSERT INTO triplets_fts(rowid, subject_id, predicate, object_literal)
  VALUES (new.rowid, new.subject_id, new.predicate, new.object_literal);
END;

CREATE TRIGGER IF NOT EXISTS triplets_ad AFTER DELETE ON triplets BEGIN
  INSERT INTO triplets_fts(triplets_fts, rowid, subject_id, predicate, object_literal)
  VALUES ('delete', old.rowid, old.subject_id, old.predicate, old.object_literal);
END;

CREATE TRIGGER IF NOT EXISTS triplets_au AFTER UPDATE ON triplets BEGIN
  INSERT INTO triplets_fts(triplets_fts, rowid, subject_id, predicate, object_literal)
  VALUES ('delete', old.rowid, old.subject_id, old.predicate, old.object_literal);
  INSERT INTO triplets_fts(rowid, subject_id, predicate, object_literal)
  VALUES (new.rowid, new.subject_id, new.predicate, new.object_literal);
END;

-- Phase 11: Akashik Vision History (Neural Uplink GPU-Level Grounding)
-- Stores metadata for each raw screenshot captured via CDP Page.captureScreenshot.
CREATE TABLE IF NOT EXISTS vision_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id        TEXT,
    screenshot_hash TEXT NOT NULL,
    pixel_width     INTEGER,
    pixel_height    INTEGER,
    captured_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 6: Tactical Scene Regions (Project Eyes-On / TacticalVisionService)
-- Stores LLava-identified cover/hazard/security zones for Spatial Grounding.
CREATE TABLE IF NOT EXISTS scene_regions (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cover_high', 'cover_partial', 'hazard', 'security')),
    label TEXT NOT NULL,
    bounds_json TEXT NOT NULL,          -- JSON [ymin, xmin, ymax, xmax] normalized 0-1000
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 13: Map Asset Index (Infinite Night — Custom Map Ingestion Engine)
-- Stores metadata for ingested map assets, populated by AssetIndexService.
CREATE TABLE IF NOT EXISTS map_assets (
    id          TEXT PRIMARY KEY,
    file_name   TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    biome       TEXT,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    wall_data   TEXT,         -- JSON array of wall segments from Node A CV pass
    indexed_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 14: Latent Atmosphere Persistence (Neural World Engine)
-- Stores the "soul" of each scene — lighting/audio settings that auto-restore on activation.
CREATE TABLE IF NOT EXISTS scene_atmosphere (
    scene_id        TEXT PRIMARY KEY,
    lighting_color  TEXT NOT NULL DEFAULT '#ffffff',
    animation_type  TEXT,
    intensity       REAL DEFAULT 1.0,
    darkness_level  REAL DEFAULT 0.0 CHECK (darkness_level BETWEEN 0.0 AND 1.0),
    captured_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 15: Mission Memory (Unified Cohesion)
-- Stores generated mission blueprints for future narrative grounding and RAG lookup.
CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    district TEXT NOT NULL,
    objective TEXT,
    rules_intel_json TEXT,
    tactical_analysis TEXT,
    lore_anchors_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 15: System State Persistence (Iron Reboot Protocol)
-- Stores the last known state of the world engine for automatic restoration on boot.
CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize with default active scene if not exists
INSERT OR IGNORE INTO system_state (key, value) VALUES ('last_active_scene', 'null');

-- Phase 46: Sovereignty depth tracks Machina vs Human authority balance (0.0–1.0).
-- 0.0 = full human dominance, 1.0 = full Machina dominance.
INSERT OR IGNORE INTO system_state (key, value) VALUES ('sovereignty_depth', '0.5');

-- Phase 46: Governance Duel History
-- Records each conflict_interrupt outcome for Pulse Engine weighting.
CREATE TABLE IF NOT EXISTS duel_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type TEXT NOT NULL,
    document_id   TEXT NOT NULL,
    document_name TEXT,
    faction       TEXT,              -- NULL = unaffiliated
    result        TEXT NOT NULL CHECK (result IN ('VETO', 'DEFER', 'PASS', 'FAIL_LOCKED')),
    initiator     TEXT NOT NULL DEFAULT 'HUMAN' CHECK (initiator IN ('HUMAN', 'MACHINA')),
    occurred_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 16: Scene Perception Buffer (Falcon OCR / Semantic Perception)
-- Stores OCR-detected map entity labels from the Falcon Sidecar, keyed by scene_id.
-- Cleared on each scene_activate event and repopulated by regroundScene().
CREATE TABLE IF NOT EXISTS scene_perception (
    scene_id TEXT PRIMARY KEY,
    detected_entities_json TEXT NOT NULL,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 19: Conceptual Seeds (Latent Seeding / R00TS Pattern)
-- Stores weighted mood/atmosphere vectors that bias NPC narrative generation.
-- "word" is the seed concept (e.g. "Despair", "Paranoia", "Greed").
-- "weight" is 0.0–1.0, where 1.0 = dominant atmospheric influence.
-- "category" groups seeds by type ("mood", "faction", "event").
-- "district" scopes the seed to a district (NULL = global).
-- "vector_json" stores a float[] as JSON for future pgvector migration.
CREATE TABLE IF NOT EXISTS conceptual_seeds (
    id          TEXT PRIMARY KEY,
    word        TEXT NOT NULL,
    weight      REAL NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0.0 AND 1.0),
    category    TEXT NOT NULL DEFAULT 'mood' CHECK (category IN ('mood', 'faction', 'event')),
    district    TEXT,
    vector_json TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 29: Akashik Library (Air-Gapped Narrative Archive)
CREATE TABLE IF NOT EXISTS library_entries (
    id          TEXT PRIMARY KEY,
    category    TEXT NOT NULL CHECK (category IN ('combat', 'netrun', 'economy', 'lore', 'tutorial')),
    district    TEXT,               -- NULL = global
    seed_text   TEXT NOT NULL,      -- The narrative spark or rule math
    metadata    TEXT,               -- JSON additional context (e.g. vetted_by, persona)
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- District DNA (The Roots Layer)
CREATE TABLE IF NOT EXISTS district_dna (
    id TEXT PRIMARY KEY,
    district_name TEXT NOT NULL UNIQUE,
    hostility_baseline REAL DEFAULT 0.5 CHECK (hostility_baseline BETWEEN 0.0 AND 1.0),
    lore_fragments_json TEXT NOT NULL DEFAULT '[]',
    persona_override TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 33: Unified Lore Mind (Chronicle Seeds)
CREATE TABLE IF NOT EXISTS chronicle_seeds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    category TEXT NOT NULL, 
    era_grounding TEXT DEFAULT 'BASE',
    district_id TEXT,
    semantic_hash TEXT UNIQUE, -- Phase 57: SHA-256 deduplication guard
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 47: Chronicle FTS5 index for zero-latency cross-source lore retrieval
CREATE VIRTUAL TABLE IF NOT EXISTS chronicle_fts USING fts5(
    title,
    content,
    category,
    district_id,
    content=chronicle_seeds
);

-- Triggers to keep chronicle_fts in sync
CREATE TRIGGER IF NOT EXISTS chronicle_ai AFTER INSERT ON chronicle_seeds BEGIN
  INSERT INTO chronicle_fts(rowid, title, content, category, district_id)
  VALUES (new.rowid, new.title, new.content, new.category, new.district_id);
END;

CREATE TRIGGER IF NOT EXISTS chronicle_ad AFTER DELETE ON chronicle_seeds BEGIN
  INSERT INTO chronicle_fts(chronicle_fts, rowid, title, content, category, district_id)
  VALUES ('delete', old.rowid, old.title, old.content, old.category, old.district_id);
END;

CREATE TRIGGER IF NOT EXISTS chronicle_au AFTER UPDATE ON chronicle_seeds BEGIN
  INSERT INTO chronicle_fts(chronicle_fts, rowid, title, content, category, district_id)
  VALUES ('delete', old.rowid, old.title, old.content, old.category, old.district_id);
  INSERT INTO chronicle_fts(rowid, title, content, category, district_id)
  VALUES (new.rowid, new.title, new.content, new.category, new.district_id);
END;

-- Phase 59: Localization dictionary (en baseline)
CREATE TABLE IF NOT EXISTS localized_dictionary (
  key TEXT PRIMARY KEY,
  value_en TEXT NOT NULL
);
