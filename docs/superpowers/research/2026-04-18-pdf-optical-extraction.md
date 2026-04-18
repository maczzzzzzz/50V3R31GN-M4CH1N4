# RESEARCH: PDF Optical Extraction & Visual RAG
**Date:** 2026-04-18
**Status:** COMPLETE // VERIFIED
**Topic:** Docling (Layout Analysis), ColPali (Visual RAG), and Delta Harmonization.

## ◈ 1. LAYOUT ANALYSIS: IBM DOCLING
- **Validation:** Confirmed as the optimal solution for multi-column rulebooks. Docling's `TableFormer` handles inconsistent borders and merged cells prevalent in TTRPG supplements.
- **Accuracy:** Benchmark data shows 97.9% cell accuracy in complex layouts.
- **Implementation:** Will be deployed as a Nix-managed Python worker on Node B (ROCm/Vulkan) to leverage the 9060 XT's compute.

## ◈ 2. VISUAL RAG: COLPALI
- **Mechanism:** Treats each PDF page as an image patch rather than raw text. 
- **ChromaDB Interop:** Requires a two-stage strategy:
    1.  **Fast Search:** Mean-pooled 128D vectors in ChromaDB.
    2.  **MaxSim Rerank:** Late interaction on top-K results to find precise visual elements (Art, Maps, Charts).
- **Storage:** Full multi-vector tensors stored on Node A (1050 Ti) in Feather/Parquet format.

## ◈ 3. CONFLICT RESOLUTION (THE TRUTH HIERARCHY)
To prevent data duplication and logic drift, the system enforces the following hierarchy:
1.  **TIER 1 (OFFICIAL REPO):** Binary truth for stats, DVs, and mechanical logic.
2.  **TIER 2 (PDF VLM):** Supplemental flavor text, lore, and "missing" DLC rules.
3.  **TIER 3 (COMMUNITY JSON):** Homebrew mooks and campaign-specific items.

## ◈ 4. FEASIBILITY (PRE-TRINITY)
- **Node B Compatibility:** Docling can run locally using ROCm/Vulkan drivers already established.
- **Node A Compatibility:** 1050 Ti can host the ColPali vector index (~200MB per rulebook).
- **Strategist's Verdict:** This phase is 100% software-dependent and can be initiated immediately on the existing 2-node infrastructure.

---
**::/5Y573M-N071C3 : OPTICAL_RESEARCH_PHYSICALIZED. // 50V3R31GN-M4CH1N4**
