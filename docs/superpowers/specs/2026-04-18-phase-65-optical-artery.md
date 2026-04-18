# SPEC: Phase 65 — Optical Artery (PDF Sovereignty)
**Date:** 2026-04-18
**Status:** DRAFT // ARCHITECT_REVIEW
**Goal:** Ingest 80+ official PDFs using VLM-based layout analysis to enrich the Canonical Mind with lore, visual context, and DLC mechanics.

## ◈ 1. ARCHITECTURAL OBJECTIVES
- **Structural OCR:** Convert rulebooks into high-fidelity Markdown using Docling, preserving multi-column lore and table integrity.
- **Visual RAG Index:** Implement ColPali to allow the Director (Node B) to "look" at rulebook pages for visual verification.
- **Delta Harmonization:** selectively ingest data that complements the existing Canonical Mirror without duplicating stats.

## ◈ 2. COMPONENT ARCHITECTURE
### Docling Worker (Node B)
- **Engine:** Python 3.12 / Docling v1.8.
- **Role:** Periodic background task that processes `docs/raw_data/core_rules/` and emits structured JSON/Markdown shards.

### Visual Vector Store (Node A)
- **Engine:** ColPali v1.2 + ChromaDB.
- **Role:** Stores patch-level visual embeddings for rules-verification and lore retrieval.

## ◈ 3. DATA FLOW
1.  **Ingest:** Docling parses PDF -> Markdown.
2.  **Filter:** Delta script compares Markdown against `Akashik.db` (Phase 59).
3.  **Merge:** New lore/rules are committed as triplets.
4.  **Index:** Full visual patches are embedded via ColPali to Node A.

## ◈ 4. DEPENDENCIES
- **Software:** Requires `poppler-utils` and `llama-server` (VLM build).
- **Prerequisite:** Phase 59 (Canonical Mind) must be verified to provide the baseline for harmonization.

---
**::/5Y573M-N071C3 : OPTICAL_SPEC_STAGED. // 50V3R31GN-M4CH1N4**
