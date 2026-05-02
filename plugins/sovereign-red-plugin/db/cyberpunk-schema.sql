-- ◈ SOVEREIGN RED PLUGIN : DATABASE SCHEMA (v1.0.0)
-- Strictly Cyberpunk RED rules, lore, and campaign data.

-- Structured NPC table
CREATE TABLE IF NOT EXISTS npcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER DEFAULT 0,
    sp INTEGER DEFAULT 0,
    emp INTEGER DEFAULT 0,
    humanity INTEGER DEFAULT 0,
    faction TEXT,
    district_id TEXT,
    disposition TEXT CHECK (disposition IN ('friendly', 'neutral', 'hostile')),
    is_alive BOOLEAN DEFAULT 1,
    -- Phase 59: Netrunner + Armor fields
    interface_level INTEGER DEFAULT 0,
    rez INTEGER DEFAULT 0,
    deck_slots INTEGER DEFAULT 0,
    head_sp INTEGER DEFAULT 0,
    body_sp INTEGER DEFAULT 0
);

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
    district_id TEXT,
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

-- Phase 6: District Grid (Faction Influence Map)
-- 10x10 grid for Chebyshev distance propagation.
CREATE TABLE IF NOT EXISTS district_grid (
    x INTEGER NOT NULL CHECK (x BETWEEN 0 AND 9),
    y INTEGER NOT NULL CHECK (y BETWEEN 0 AND 9),
    faction_name TEXT NOT NULL,
    strength INTEGER DEFAULT 0 CHECK (strength BETWEEN 0 AND 10),
    PRIMARY KEY (x, y, faction_name)
);

-- Phase 59: Canonical Mirror — DV lookup tables (weapon category × range bracket)
CREATE TABLE IF NOT EXISTS dv_tables (
  weapon_category TEXT NOT NULL,
  range_bracket TEXT NOT NULL,
  dv INTEGER NOT NULL,
  PRIMARY KEY (weapon_category, range_bracket)
);

-- Phase 59: Relational item components (cyberware slots, attachments)
CREATE TABLE IF NOT EXISTS item_components (
  item_id TEXT NOT NULL,
  component_type TEXT NOT NULL,
  PRIMARY KEY (item_id, component_type),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Phase 59: Modifier registry (permanent + situational CPRMod stacking)
CREATE TABLE IF NOT EXISTS item_modifiers (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value INTEGER NOT NULL,
  mode TEXT CHECK(mode IN ('permanent', 'situational')) NOT NULL,
  trigger_tag TEXT,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Phase 57+59: Foundry Items table (mechanical parity with fvtt-Item exports)
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'weapon', 'armor', 'cyberware', 'gear', 'program', 'ammo'
    category TEXT,
    cost INTEGER DEFAULT 0,
    weight REAL DEFAULT 0,
    data_json TEXT NOT NULL DEFAULT '{}', -- full Foundry item data blob
    district_id TEXT,
    source TEXT NOT NULL DEFAULT 'FOUNDRY',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Phase 59: Tactical fields
    concealable BOOLEAN DEFAULT 0,
    slots_used INTEGER DEFAULT 0,
    reliability TEXT,
    is_installed BOOLEAN DEFAULT 0
);

-- Phase 60: Night Markets (Sovereign Economy Engine)
CREATE TABLE IF NOT EXISTS night_markets (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL,
  vendor_npc_id TEXT NOT NULL,
  inventory_json TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Phase 60: Gigs / Screamsheets (Procedural Mission Generator)
CREATE TABLE IF NOT EXISTS gigs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client_npc_id TEXT,
  target_npc_id TEXT,
  district_id TEXT,
  reward_eb INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available'
);
