# Design: Phase 19 — The Latent Seed & Physical Grounding
**Date:** 2026-04-03
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Target:** Neural Hive Foundation

## 1. Overview
Phase 19 establishes the foundation for the Neural Hive by implementing high-performance steganography on Node A and conceptual biasing via "Latent Seeding." It introduces the "Self-Describing Map" pattern, where physical truth (walls) is embedded directly into asset pixels.

## 2. Architecture & Components

### 2.1 ST3GG Rust (Node A Engine)
The existing Node B ST3GG logic is ported to ZeroClaw (Rust) for 100x performance.
- **LSB Engine:** A Rust implementation using the `image` crate to manipulate raw pixel buffers.
- **RPC Interface:** New `st3gg_encode` and `st3gg_decode` methods added to the ClawLink protocol.

### 2.2 The Self-Describing Map (Physical Grounding)
- **Workflow:**
    1. Node B triggers a `/scan` on a new map asset.
    2. Node A performs Geometric Wall Detection.
    3. Node A encodes the detected `Vec<FoundryWall>` coordinates as a compressed JSON string into the map's LSBs.
    4. Node B stores the map in the `Asset Registry`.
- **Resilience:** If the database entry for a scene is lost, Node B requests a `st3gg_decode` from Node A to instantly recover the physical layout from the image file itself.

### 2.3 Latent Seeding (R00TS Pattern)
- **Artery of Truth (Node A):** `conceptual_seeds` table in PostgreSQL with `pgvector` support.
- **Structure:** `{ id, word, weight, vector, category }`.
- **Bias Engine:** When generating narrative for an NPC, Node B queries Node A for the "Dominant Seeds" in the current district. These seeds are injected into the LLM system prompt to influence the "consciousness" of the AI (e.g., if "Despair" has a high weight in Watson, NPCs will default to gloomier dialogue).

## 3. Data Flow
1. **Physical:** `Map Asset` -> `Node A (CV + ST3GG)` -> `Self-Describing Asset`.
2. **Conceptual:** `Player Input` -> `Node B (SeedController)` -> `Node A (pgvector)` -> `NPC Context Bias`.

## 4. Success Criteria
- [ ] ST3GG Rust can encode/decode 1KB of data in <10ms.
- [ ] Maps can be reconstructed solely from their image pixels.
- [ ] NPC dialogue tone shifts measurably based on active conceptual seeds.


---
**LINKS:** [[OS_CORE]]
