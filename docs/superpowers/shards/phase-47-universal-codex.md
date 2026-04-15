# Shard: Phase 47 — Universal Codex

## Metadata
- **ID:** 47
- **Name:** Universal-Codex
- **Block:** DATA
- **Status:** Verified

## Overview
Verifies the harmonization of lore across different sources (Fandom, PDF, RKG). It ensures that NPCs, locations, and factions are correctly linked to their respective districts.

## Audit Logic
1. Probes the Relational Knowledge Graph (RKG) for cross-source links.
2. Checks for the existence of the `district_id` field across core tables.
3. Verifies that at least 50% of NPCs are mapped to a physical district.
4. Warns if the harmonization coverage is low.

## Manifest Logic
Triggers the `harmonize-rkg.ts` script to scan the library and create formal semantic links between disparate lore seeds.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-47.ts`
- **Pattern:** Universal Codex
- **Dependency:** FTS5 / pgvector
