# Spec: Sovereign Mind Fresh-Start & Ingestion Pipeline (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)

## 🏁 Objectives
- **Zero-Drift Reconstruction:** Nuke and rebuild `Akashik.db` and `data/vault/RKG` from high-fidelity source primitives.
- **Human-Usable Vault:** Transform the Obsidian RKG into a structured, navigable, and logically categorized world-brain.
- **Deep Semantic Grounding:** Implement structural parsing and semantic chunking to eliminate word-salad and redundancy.

## 🏗️ Architectural Components

### 1. `SovereignIngestService` (Polymorphic Orchestrator)
A new TypeScript service in `src/core/ingest/` responsible for identifying and dispatching source files to specialized handlers.
- **Handlers:**
    - `WikiHandler`: Executes deep Fandom scrapes with recursive link-following and table-to-Markdown conversion.
    - `JsonFoundryHandler`: Ingests `.json` exports from Foundry VTT (Items, Actors, Journals) directly into structured SQL tables.
    - `CompendiumDbHandler`: Extracts and reconciles data from legacy community SQLite compendiums.
    - `HifiPdfHandler`: Integrates `opendataloader-pdf` and `chunknorris` for layout-aware extraction.

### 2. Semantic Chunking Strategy
- **Context Injection:** Every chunk extracted from a PDF or Wiki must be prefixed with its parent breadcrumbs (e.g. `Night City > Watson > Little China`).
- **Atomic Entities:** Items, NPCs, and Factions must be extracted as atomic records with strict Zod validation before database insertion.

### 3. Artery of Truth Schema Refresh
- **`chronicle_seeds` (Lore):** Store rich Markdown chunks with source metadata and semantic hashes for deduplication.
- **`npcs`, `items`, `factions`:** Populated from Foundry JSONs to ensure 100% parity with game mechanics.

### 4. Vault Reconstruction v2
- **District-First Hierarchy:** Folders organized by `District > [Lore | Actors | Items | Locations]`.
- **Global Context:** `Global > [Core_Rules | Factions | History]`.
- **Metadata Mandate:** Every `.md` file MUST have a complete YAML frontmatter (provenance, type, tags).

## 🛡️ Success Criteria
1. `Akashik.db` contains 0 duplicate records (verified by semantic hash).
2. `pnpm run audit:vault` (new tool) reports 0 empty folders and 100% frontmatter compliance.
3. RAG Search (`crush scan`) returns contextually relevant, well-formatted Markdown snippets.

---
**::/50V3R31GN-M4CH1N4 : 5P3C-D3F1N1710N-537. // 57R4736157_D0N3.**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
