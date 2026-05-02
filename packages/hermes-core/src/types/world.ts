/**
 * src/types/world.ts
 * Phase 59: Canonical Mirror — TypeScript interfaces for Akashik.db v4.
 */

// ---------------------------------------------------------------------------
// NPC (expanded with Netrunner + Armor fields)
// ---------------------------------------------------------------------------

export interface Npc {
  id: string;
  name: string;
  hp: number;
  sp: number;
  emp: number;
  humanity: number;
  faction: string | null;
  district_id: string | null;
  disposition: 'friendly' | 'neutral' | 'hostile';
  is_alive: boolean;
  // Phase 59 expansions
  interface_level: number;
  rez: number;
  deck_slots: number;
  head_sp: number;
  body_sp: number;
}

// ---------------------------------------------------------------------------
// Item (expanded with tactical fields)
// ---------------------------------------------------------------------------

export interface Item {
  id: string;
  name: string;
  type: string;
  category: string | null;
  cost: number;
  weight: number;
  data_json: string;
  district_id: string | null;
  source: string;
  last_updated: string;
  // Phase 59 expansions
  concealable: boolean;
  slots_used: number;
  reliability: string | null;
  is_installed: boolean;
}

// ---------------------------------------------------------------------------
// Phase 59: Canonical tables
// ---------------------------------------------------------------------------

export interface DvTable {
  weapon_category: string;
  range_bracket: string;
  dv: number;
}

export interface ItemComponent {
  item_id: string;
  component_type: string;
}

export interface ItemModifier {
  id: string;
  item_id: string;
  key: string;
  value: number;
  mode: 'permanent' | 'situational';
  trigger_tag: string | null;
}

export interface LocalizedEntry {
  key: string;
  value_en: string;
}

// ---------------------------------------------------------------------------
// Phase 60: Economy & Gig tables
// ---------------------------------------------------------------------------

export interface NightMarket {
  id: string;
  district_id: string;
  vendor_npc_id: string;
  inventory_json: string; // JSON array of { item_id, quantity, is_contraband }
  status: 'active' | 'cleared';
}

export interface Gig {
  id: string;
  title: string;
  client_npc_id?: string;
  target_npc_id?: string;
  district_id?: string;
  reward_eb: number;
  status: 'available' | 'in_progress' | 'completed';
}
