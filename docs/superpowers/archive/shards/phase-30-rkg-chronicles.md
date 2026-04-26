# Shard: Phase 30 — RKG Chronicles

## Metadata
- **ID:** 30
- **Name:** RKG-Chronicles
- **Block:** DATA
- **Status:** Verified

## Overview
Ensures that the Relational Knowledge Graph (RKG) is populated with chronicle seeds and conceptual data extracted from the campaign's source material.

## Audit Logic
1. Queries `chronicle_seeds` and `conceptual_seeds` tables.
2. Verifies that the counts are non-zero.
3. Warns if the library is empty, suggesting a need for ingestion.

## Manifest Logic
Triggers `bash scripts/reconstruct-palace.sh` to rebuild the semantic vault from ingested seeds.

## Technical Details
- **Source:** `scripts/gauntlet/phases/data-block.ts`
- **Related Phase:** Phase 47 (Universal Codex)


---
**LINKS:** [[OS_CORE]]
