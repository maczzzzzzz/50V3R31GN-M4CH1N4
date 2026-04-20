# Research: Akashik Mind Fidelity & Vault Inconsistency (2026-04-16)

## 🔍 Investigation Results

### 1. Current State (The "Broken" Reality)
- **Artery of Truth (`Akashik.db`):** 
    - Contains 10,722 entries in `chronicle_seeds`.
    - Data quality is low: high redundancy, overlapping text blocks (parsing artifacts), and shallow heuristic categorization (mostly `#Gear` or `#Economy`).
    - Many core tables (`factions`, `locations`, `npcs`) are either empty or under-populated (only 4 NPCs).
- **Obsidian Vault (`data/vault/RKG`):**
    - High folder count but zero content in `Lore`, `Actors`, `Factions`, and `Core_Rules`.
    - The `Knowledge` folder is over-saturated (168 files) but contains messy "triplet" data that is not human-navigable.
- **Root Cause:**
    - The current `fast-reconstruct.py` relies on basic string-matching heuristics.
    - PDF parsing (`pdf-parse`) is flattening text without respecting multi-column layouts, sidebars, or tables, leading to "word salad" in the database.
    - Fandom scraping was likely incomplete or never fully reconciled with the world-state.

### 2. Available High-Fidelity Source Material
- **PDFs:** 60+ DLCs and Core Rulebooks in `docs/raw_data/core_rules/`.
- **JSONs:** Foundry VTT exports in `docs/raw_data/entities_mooks/` (Structured Actors and Items).
- **SQLite DBs:** Community compendiums in `docs/raw_data/community_compendium/` (Structured gear and cyberware).
- **Scrape:** `scrape-fandom.js` exists but needs better chunking and deep-link following.

### 3. Proposed Technological Shifts
- **Structural Parsing (`opendataloader-pdf`):** 
    - Uses XY-Cut++ for multi-column layout detection.
    - Extracts tables as structured Markdown/JSON instead of raw text.
    - Provides bounding-box metadata for citations.
- **Semantic Chunking (`chunknorris`):**
    - Header-based splitting (H1, H2, H3).
    - Parent context injection (prepending section titles to sub-chunks).
    - Prevents "dangling content" by ensuring each chunk is self-contained.
- **Modular Ingestion:**
    - Shift from a single monolithic "batch" script to a polymorphic `SovereignIngestService`.
    - Dedicated handlers for `FoundryJSON`, `CompendiumDB`, and `HighFidelityPDF`.

---
**::/50V3R31GN-M4CH1N4 : R3534RCH-P1N-537. // 57R4736157_D0N3.**
