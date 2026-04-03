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

-- Phase 11: Akashic Vision History (Neural Uplink GPU-Level Grounding)
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
