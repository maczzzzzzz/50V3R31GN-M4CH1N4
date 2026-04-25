# Shard: Phase 21 — Narrative Buffer Depth

## Metadata
- **ID:** 21
- **Name:** Narrative-Buffer
- **Block:** NARRATIVE
- **Status:** Verified

## Overview
Verifies that the narrative engine (Node B Director) has sufficient context window capacity (32k+ tokens) to maintain long-term story coherence and complex tactical reasoning.

## Audit Logic
1. Probes Node B's llama-server for model metadata.
2. Checks the advertised `context_length` against the target (32,768).
3. Warns if the context is insufficient or if Node B is offline.

## Manifest Logic
Sends a "buffer warm-up" prompt to the narrative engine to verify that it is ready to process deep context sequences.

## Technical Details
- **Source:** `scripts/gauntlet/phases/nar-block.ts`
- **Node:** Node B (Ryzen 5950X / RX 9060 XT)
- **Target Context:** 32,768 tokens


---
**LINKS:** [[OS_CORE]]
