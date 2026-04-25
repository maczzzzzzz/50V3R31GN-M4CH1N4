# Design Specification: Phase 9 — autoDream Consolidation (v3.4.2)
**Subject:** Recursive Context Pruning & Hierarchical Synapse
**Status:** DESIGN FINALIZED

## 1. Executive Summary
autoDream is the system's "Self-Cleaning" mechanism. It solves "Context Rot" by recursively summarizing short-term conversation logs into long-term Relational Knowledge Graph (RKG) triplets. This ensures the AI GM maintains a consistent narrative thread across multi-month campaigns while keeping the context window pristine.

## 2. Technical Architecture

### 2.1 The 3-Tier Synapse Cache
- **L1 (Working):** Last 10 turns in full (High-fidelity).
- **L2 (Dream):** Summaries of the current session (Narrative).
- **L3 (Akashik):** Permanent lore triplets in `Akashik.db` (The Grounded Truth).

### 2.2 The Consolidation Loop
- **Trigger:** Every 50 message turns or on `/pulse`.
- **Cognition:** Mistral-Nemo extracts entities and relationships (e.g. "Vido [subject] -> killed -> Maelstromer [object]").
- **Pruning:** Deletes the processed L1 logs after L3 verification.

## 3. Implementation Requirements
- **Storage:** Uses the `triplets_fts` table for sub-10ms retrieval of "Dreamed" facts.
- **Verification:** Uses the **Flush Gate** to ensure no data loss during consolidation.


---
**LINKS:** [[OS_CORE]]
