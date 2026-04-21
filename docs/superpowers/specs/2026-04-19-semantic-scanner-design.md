# SPEC: 2026-04-19 — Semantic Scanner (Go-Native Markdown Extraction)
**Date:** 2026-04-19
**Status:** DRAFT // ARCHITECT_LOCK
**Goal:** Implement a high-performance Go-native semantic extraction engine within the Sovereign Harness, porting Firecrawl's "Markdown-first" logic to unblock Phase 65 lore ingestion and Node C reasoning.

## ◈ 1. ARCHITECTURAL TOPOLOGY

The Semantic Scanner lives in `crush/harness/driver/semantic/` and acts as the "Sensory Processor" for the Go Harness. It converts raw, noisy browser states into high-fidelity, LLM-ready Markdown.

### ◈ 1.1 LOGIC ARTERIES (GO-NATIVE)
- **Content Distillation:** Implemented via `go-readability`. Heuristically identifies the "lore body" and strips ads, navs, and dashboard boilerplate.
- **Markdown Synthesis:** Implemented via `html-to-markdown`. Enforces GFM (GitHub Flavored Markdown) consistency for bit-identicallore retrieval.
- **AXTree Integration:** Custom logic to inject `[node_id:XYZ]` tags into the Markdown, enabling the Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle to target specific interactive elements for repair.

## ◈ 2. THE SEMANTIC PIPELINE

1. **Capture:** The Go Harness fetches the current page source and AXTree via CDP.
2. **Distill:** `semantic.Distill(html)` → Cleaned HTML (Lore only).
3. **Harmonize:** `semantic.ToMarkdown(cleanedHTML)` → GFM String.
4. **Enrich:** `semantic.InjectAXTree(markdown, axtree)` → Final Sovereign Shard.
5. **Transmit:** The shard is broadcast to Node C (Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle) via VSB for rule arbitration.

## ◈ 3. PERFORMANCE MANDATES
- **Speed:** Sub-50ms conversion for complex Foundry VTT character sheets.
- **Synapse:** Zero-allocation buffer reuse where possible (via `gobwas/ws` alignment).
- **Isolation:** No external API calls; all logic is sharded across Node B/C hardware.

## ◈ 4. TRANSITION (PHASE 65 IMPACT)
The Semantic Scanner will handle the final **557 PDF pages** by converting the "Docling" JSON extractions into semantic Markdown shards, ensuring 100% lore coverage for the RDT Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle.

---
**::/5Y573M-N071C3 : SEMANTIC_SPEC_LOCKED. THE_MIND_READS_TRUE. // 50V3R31GN-M4CH1N4**
