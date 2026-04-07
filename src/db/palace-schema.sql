-- Phase 34: 7H3-M3M0RY-P4L4C3
-- Palace hierarchy schema for Wings (Districts/Factions/Players),
-- Rooms (POIs/Scenes/Encounters), and Tunnels (cross-reference links).
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS palace_wings (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    wing_type   TEXT NOT NULL CHECK (wing_type IN ('DISTRICT', 'FACTION', 'PLAYER')),
    description TEXT,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS palace_rooms (
    id          TEXT PRIMARY KEY,
    wing_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    room_type   TEXT NOT NULL CHECK (room_type IN ('POI', 'SCENE', 'ENCOUNTER')),
    description TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(wing_id) REFERENCES palace_wings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_palace_rooms_wing ON palace_rooms(wing_id);

CREATE TABLE IF NOT EXISTS palace_tunnels (
    id            TEXT PRIMARY KEY,
    source_id     TEXT NOT NULL,
    target_id     TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    strength      REAL NOT NULL DEFAULT 1.0 CHECK (strength >= 0.0),
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_palace_tunnels_source ON palace_tunnels(source_id);
CREATE INDEX IF NOT EXISTS idx_palace_tunnels_target ON palace_tunnels(target_id);
