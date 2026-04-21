# Design Spec: Unified Lore Mind & Chronicle Harvester

**Date:** 2026-04-07
**Status:** Approved
**Topic:** Scaling Sovereign Machina intelligence via unified community data ingestion and Provenance Tagging.

## 1. Executive Summary
The "Unified Lore Mind" strategy shifts the 50V3R31GN-M4CH1N4 from a district-centric map to a holistic world-knowledge graph. By ingesting high-fidelity community lore from Miraheze, Z-Team, and World Anvil into a single `Akashik.db` structure, the 48L173R473D brain gains the ability to correlate physical locations with deep historical and technical context.

## 2. Architecture: The Unified Graph
We will maintain the high-speed `district_dna` table for atmosphere while introducing a new `chronicle_seeds` table for long-term world memory.

### 2.1 Artery of Truth Schema (`Akashik.db`)
```sql
CREATE TABLE IF NOT EXISTS chronicle_seeds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL, -- 'MIRAHEZE', 'Z-TEAM', 'WORLD-ANVIL'
    category TEXT NOT NULL, -- '#Historical', '#Corporate', '#Gossip', '#Technical'
    era_grounding TEXT DEFAULT '2045',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Component: Chronicle Harvester (`scripts/chronicle-harvester.ts`)
A modular Node.js utility designed to scrape, clean, and categorize multi-source lore.

### 3.1 Extraction Profiles
- **Miraheze:** MediaWiki API parser for technical lore and corporate history.
- **Z-Team:** Custom DOM selector parser for "Cheat Sheets" and summaries.
- **World Anvil:** JSON/HTML crawler for chronological reconstruction data.

### 3.2 Logic Flow
1. **Scrape:** Parallel fetching from source endpoints.
2. **Clean:** Strip citations `[1]`, HTML artifacts, and non-2045 era metadata.
3. **Deduplicate:** Hash-based content validation to prevent source overlap.
4. **Tag:** Automated categorization based on keyword triggers (e.g., "Netrunning" -> `#Technical`).
5. **Graft:** Atomic transaction insertion into `Akashik.db`.

## 4. Integration & Providance
The **48L173R473D Brain** will access this via the `UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic OracleClient`.
- **Primary Hook:** During turn initialization, the brain queries both `district_dna` (where we are) and `chronicle_seeds` (what we know about this situation).
- **Weighting:** The brain is instructed to treat `#Technical` seeds as high-authority rules and `#Gossip` as narrative flavor.

## 5. Security & Sovereignty
- **Vaulting:** Harvested data will live in cleartext within `Akashik.db` for zero-latency query, but the scraper source code and raw JSON payloads will be ignored by Git via the `.gitignore` protocols established in Phase 31.
- **Era-Lock:** Any content containing "2077" or "Cyberpunk 2020" keywords without a "History" qualifier is purged to prevent context drift.
