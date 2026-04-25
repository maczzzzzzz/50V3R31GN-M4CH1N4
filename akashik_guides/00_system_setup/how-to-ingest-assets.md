# User Guide: Sovereign Asset Forge — Ingestion

**Version:** 3.2.11
**Role:** High-Fidelity World State Grounding

---

## 🏗️ The Sovereign Ingestion Pipeline
As of Phase 57, the ingestion pipeline has been refactored into a polymorphic service capable of handling diverse high-fidelity sources with structural integrity.

### 🏗️ Canonical Source Handlers:
1.  **WikiHandler**: Executes deep Fandom scrapes with recursive link-following and table-to-Markdown conversion for district DNA.
2.  **JsonFoundryHandler**: Direct ingestion of `.json` exports (Actors, Items, Journals) into structured SQL tables with 100% mechanical parity.
3.  **HifiPdfHandler**: Integrates `opendataloader-pdf` for layout-aware extraction (preserving columns and tables) and `chunknorris` for semantic Markdown chunking.
4.  **CompendiumDbHandler**: Reconciles legacy community SQLite compendiums into the core Akashik schema.

---

## 🛠️ How to Ingest
To trigger a global ingestion pass and rebuild the **Akashik Mind** from cleartext primitives:

```bash
# 1. Nuke and Scaffold (CAUTION: Destructive)
npm run mind:fresh

# 2. Feed the Mind
npm run mind:ingest
```

### 🧠 Semantic Grounding
Once ingested, chunks are processed with:
- **XY-Cut++**: Correct reading order for multi-column PDFs.
- **Context Injection**: Parent breadcrumbs (e.g. `District > Sector`) are prepended to every semantic chunk to prevent retrieval hallucinations.
- **Deduplication**: BLAKE3 semantic hashing ensures zero redundant fragments in `chronicle_seeds`.

---

## 🎨 Materialization
The processed data is materialised into the **Obsidian Palace** using the v2 Reconstruction Engine:

```bash
npm run mind:materialize
```
*Structure:* Organised by `District > [Lore | Actors | Items | Locations]` with full YAML frontmatter.

---
*Asset Ingestion: High-Fidelity Semantic Grounding Online v3.6.0.*


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
