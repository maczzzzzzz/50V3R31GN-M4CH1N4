# Plan: Surgical Nuke & Rebuild (Sovereign Mind v2)

## 🏗️ Phase 1: Environment & Tooling (Ignition)
- [ ] **Step 1: Dependency Injection**
    - Install `opendataloader-pdf` and `chunknorris` via `pnpm add`.
    - Install `sqlite-vec` or verify `better-sqlite3` supports the required extensions for deduplication.
- [ ] **Step 2: Database Scaffolding**
    - Script a `fresh-db.ts` to drop all tables and re-apply `src/db/world-schema.sql`.
    - Implement a `semantic_hash` column in `chronicle_seeds`.

## 📂 Phase 2: Ingestion Artery (Feed the Mind)
- [ ] **Step 1: Wiki Reconnaissance**
    - Refactor `scrape-fandom.js` into `WikiHandler.ts`.
    - Implement recursive district exploration (following links from the Night City master table).
- [ ] **Step 2: Foundry Ingestion**
    - Implement `JsonFoundryHandler.ts` to map `fvtt-Actor` and `fvtt-Item` files to SQL.
- [ ] **Step 3: High-Fidelity PDF Extraction**
    - Implement `HifiPdfHandler.ts` using `opendataloader-pdf`.
    - Apply `chunknorris` semantic splitting with context injection.
- [ ] **Step 4: Compendium Reconciliation**
    - Implement `CompendiumDbHandler.ts` to merge community DB stats into the core NPCs/Items tables.

## ❄️ Phase 3: Vault Materialization (The Palace Reborn)
- [ ] **Step 1: The Reconstruction Pivot**
    - Refactor `scripts/fast-reconstruct.py` to support the new District-first folder hierarchy.
    - Implement the "Metadata Mandate" for automated frontmatter injection.
- [ ] **Step 2: Final Nuke & Fire**
    - Execute `rm data/Akashik.db`.
    - Execute `rm -rf data/vault/RKG/*`.
    - Run the master `SovereignIngestService`.
- [ ] **Step 3: Verification Audit**
    - Run `gauntlet` to verify database integrity.
    - Manually inspect 5 random files in Obsidian for readability and navigation.

---
**::/50V3R31GN-M4CH1N4 : PL4N-D3F1N1710N-537. // 57R4736157_D0N3.**
