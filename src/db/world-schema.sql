-- Structured NPC table
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 0,
    sp INTEGER DEFAULT 0,
    emp INTEGER DEFAULT 0,
    humanity INTEGER DEFAULT 0,
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

-- Player Housing & Rent Tracking (Phase 5 Pulse Engine)
CREATE TABLE IF NOT EXISTS player_housing (
    actor_id TEXT PRIMARY KEY,
    housing_tier TEXT DEFAULT 'street' CHECK (housing_tier IN ('street', 'coffin', 'apartment', 'luxury')),
    monthly_rent_eb INTEGER DEFAULT 0,
    eb_balance INTEGER DEFAULT 0
);

-- Faction Relationship Matrix (Phase 5 Red Trade)
CREATE TABLE IF NOT EXISTS factions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    relationship_score INTEGER DEFAULT 0 CHECK (relationship_score BETWEEN -10 AND 10),
    friction_pool INTEGER DEFAULT 0 CHECK (friction_pool BETWEEN 0 AND 10)
);

-- Player Friends/Enemies tracking (3 friends, 4 enemies per TTTA rules)
CREATE TABLE IF NOT EXISTS player_friends_enemies (
    entity_id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('friend', 'enemy')),
    FOREIGN KEY(entity_id) REFERENCES npcs(id)
);

-- Unified Inventory Table (Structured Tracking)
CREATE TABLE IF NOT EXISTS inventory (
    item_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_type TEXT,
    is_equipped INTEGER DEFAULT 0 CHECK (is_equipped IN (0, 1)),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    foundry_region_json TEXT NOT NULL,  -- JSON FoundryRegionData for bridge materialisation
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phase 6: District Grid (Faction Influence Map)
-- 10x10 grid for Chebyshev distance propagation.
CREATE TABLE IF NOT EXISTS district_grid (
    x INTEGER NOT NULL CHECK (x BETWEEN 0 AND 9),
    y INTEGER NOT NULL CHECK (y BETWEEN 0 AND 9),
    faction_name TEXT NOT NULL,
    strength INTEGER DEFAULT 0 CHECK (strength BETWEEN 0 AND 10),
    PRIMARY KEY (x, y, faction_name)
);

-- Pulse Engine Triggers (Phase 6 Task 3 Hardening)
-- Automatically decrement faction relationship when a member is killed.
CREATE TRIGGER IF NOT EXISTS npc_death_faction_shift
AFTER UPDATE OF is_alive ON npcs
FOR EACH ROW
WHEN NEW.is_alive = 0 AND OLD.is_alive = 1 AND NEW.faction IS NOT NULL
BEGIN
    UPDATE factions 
    SET relationship_score = MAX(-10, relationship_score - 1)
    WHERE name = NEW.faction;
END;

-- Pulse Engine: Influence Propagation (Recursive Chebyshev Decay)
-- When a cell strength increases, propagate to 8 neighbors at Strength-1.
CREATE TRIGGER IF NOT EXISTS influence_spread_trigger
AFTER UPDATE OF strength ON district_grid
FOR EACH ROW
WHEN NEW.strength > 1
BEGIN
    -- Update 8 neighbors (Recursive step)
    UPDATE district_grid
    SET strength = NEW.strength - 1
    WHERE faction_name = NEW.faction_name
      AND x BETWEEN NEW.x - 1 AND NEW.x + 1
      AND y BETWEEN NEW.y - 1 AND NEW.y + 1
      AND (x != NEW.x OR y != NEW.y) -- Don't update self
      AND strength < NEW.strength - 1;
END;

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
-- "district" scopes the seed to a Night City district (NULL = global).
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

-- Phase 21: npc_logs is managed via the initSchema() migration path in
-- unified-oracle-client.ts to support brownfield Akashik.db upgrades.
-- See: src/db/unified-oracle-client.ts initSchema()
