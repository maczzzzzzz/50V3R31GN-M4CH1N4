/**
 * src/types/world.ts
 * ◈ Clean BASE Core Types
 */

export interface Location {
  id: string;
  name: string;
  owner_faction: string | null;
  district_id: string | null;
  is_secured: boolean;
}

export interface Triplet {
  subject_id: string;
  predicate: string;
  object_literal: string;
  district_id: string | null;
  last_updated: string;
}
