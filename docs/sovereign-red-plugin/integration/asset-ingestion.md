# 🏗️ INTEGRATION: ASSET INGESTION & FORGING

**::VERSION_STAMP : 3.8.7**
**::ROLE : HIGH_FIDELITY_WORLD_STATE_GROUNDING**

---

## ⚡ THE SOVEREIGN INGESTION PIPELINE
The RED Plugin utilizes a polymorphic ingestion service to ensure the simulation is grounded in high-fidelity source data. This pipeline transforms raw lore and mechanics into structured, actionable intelligence.

## 1. CANONICAL SOURCE HANDLERS
- **JsonFoundryHandler**: Direct ingestion of `.json` exports (Actors, Items, Journals) into structured SQL tables with 100% mechanical parity.
- **WikiHandler**: Recursive scraping and transformation of community wiki data into district DNA.
- **HifiPdfHandler**: Layout-aware extraction from core rulebooks, preserving structural integrity (columns, tables) via `opendataloader-pdf`.
- **CompendiumDbHandler**: Reconciliation of legacy SQLite community shards into the **Akashik** schema.

---

## 2. OPERATIONAL PROTOCOLS
To synchronize the **Akashik Mind** with updated cleartext primitives:

### ◈ DATA RECONSTRUCTION
```bash
# RE-INITIALIZE SCHEMA (DESTRUCTIVE)
npm run mind:fresh

# INJECT SOURCE DATA
npm run mind:ingest
```

### ◈ SEMANTIC GROUNDING
Ingested shards undergo rigorous processing:
- **XY-CUT++**: Enforcement of correct reading order for multi-column mechanical data.
- **BREADCRUMB_INJECTION**: Prepending of structural context (e.g., `District > Sector`) to prevent reasoning hallucinations.
- **SEMANTIC_DEDUPLICATION**: BLAKE3 hashing ensures zero redundancy within the `chronicle_seeds`.

---

## 3. MATERIALIZATION
Processed data is materialized into the **Obsidian Palace** (Knowledge Base) via the Reconstruction Engine:

```bash
npm run mind:materialize
```
**SHARD_STRUCTURE**: `District > [Lore | Actors | Items | Locations]` with high-fidelity YAML metadata.

---
**::/5Y573M-N071C3 : INGESTION_SHORED. THE_TRUTH_IS_MATERIALIZED. // 50V3R31GN-M4CH1N4**
