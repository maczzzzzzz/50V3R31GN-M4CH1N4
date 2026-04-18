# Phase 65: Optical Artery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a high-fidelity PDF ingestion pipeline using Docling and ColPali to enrich the Sovereign Mind with canonical lore and visual context.

**Architecture:** A Python-based layout analysis worker on Node B that feeds structured data to Node A's visual vector store.

**Tech Stack:** Docling, ColPali, Python 3.12, Nix, ROCm, ChromaDB.

---

### Task 1: Optical Ingestion Environment

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Add Docling and Python dependencies**
Update `flake.nix` to include a new `optical` devShell containing `python312`, `docling`, `poppler-utils`, and `torch` (with ROCm support).

- [ ] **Step 2: Commit**

```bash
git add flake.nix
git commit -m "infra: establish optical devShell for vlm pdf parsing"
```

---

### Task 2: High-Fidelity OCR (Docling)

**Files:**
- Create: `scripts/dev/docling-worker.py`

- [ ] **Step 1: Implement multi-column extraction script**
Implement a Python script using Docling to iterate over the PDF directory and export high-fidelity Markdown shards to `data/ingest/pdf_shards/`.

- [ ] **Step 2: Commit**

```bash
git add scripts/dev/docling-worker.py
git commit -m "feat(optical): implement docling high-fidelity pdf worker"
```

---

### Task 3: Visual RAG Indexing (ColPali)

**Files:**
- Create: `src/core/ingest/VisualRAGService.ts`
- Create: `zeroclaw/src/cv/colpali_bridge.rs`

- [ ] **Step 1: Implement ColPali Embedding Hook**
Create a service that sends PDF visual patches to Node A for ColPali embedding.

- [ ] **Step 2: Implement MaxSim Reranker in Rust**
Implement the late-interaction reranking logic in the ZeroClaw kernel for high-speed visual search.

- [ ] **Step 3: Commit**

```bash
git add src/core/ingest/VisualRAGService.ts zeroclaw/src/cv/
git commit -m "feat(optical): implement colpali visual rag and rust reranker"
```

---

### Task 4: Delta Harmonization

**Files:**
- Create: `src/core/ingest/LoreHarmonizer.ts`

- [ ] **Step 1: Implement Tiered Ingestion Logic**
Build a script that cross-references extracted PDF text against the official repo data, ensuring only "Flavor" and "Lore" triplets are promoted to Akashik.db.

- [ ] **Step 2: Commit**

```bash
git add src/core/ingest/LoreHarmonizer.ts
git commit -m "feat(optical): implement lore-delta harmonization protocol"
```
