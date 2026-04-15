# Shard: Phase 49 — Semantic Precision

## Metadata
- **ID:** 49
- **Name:** Semantic-Precision
- **Block:** DATA
- **Status:** Verified

## Overview
Ensures high-fidelity disambiguation within the RKG. It verifies that bigram phrase extraction and TF-IDF weighting are being correctly applied to district-specific lore retrieval.

## Audit Logic
1. Probes the primary RKG for high-precision semantic tags.
2. Verifies that the Threat Library (`export-threat-library.ts`) can correctly categorize NPC types based on bigram extraction.
3. Fails if the RKG contains more than 10% ambiguous (district-less) triplets.

## Manifest Logic
Triggers a semantic refinement pass to re-weight triplets based on the latest chronicle dataset.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-49.ts`
- **Pattern:** TF-IDF Disambiguation
- **Output:** Threat Library Profile
