# Design Specification: Phase 13 — The Infinite Night (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Subject:** Procedural Campaign Generation & Map Ingestion Engine
**Status:** DESIGN FINALIZED (Audit Hardened)

## 1. Executive Summary
Phase 13 establishes the 50V3R31GN-M4CH1N4 as a self-sovereign procedural engine. It enables the AI to ingest custom map assets, synthesize complex mission beats from raw rules/lore, and physically materialize them in Foundry VTT via the Phase 11 Neural Uplink.

## 2. Component Architecture

### 2.1 The Map Ingestion Engine (Physical Data Plane)
- **Path:** `data/custom_maps/`
- **Logic:** `AssetIndexService` monitors this directory. New maps are automatically queued for the **Geometric CV Pass** (Node A) and **Semantic CV Pass** (Node B).
- **Metadata:** Results are stored in the `map_assets` table in `Akashik.db`, allowing the AI to query maps by biome, size, or tactical complexity.

### 2.2 The Mission Swarm (Orchestration Layer)
- **Multi-Agent Tasking:** Node B dispatches isolated reasoning tasks to Node A for Rules (Intel), Tactics (Map Analysis), and Factions (Logistics).
- **Lore Anchoring:** Fuses procedural beats with `crush.db` session history to ensure continuity.

### 2.3 The Neural Painter (Fulfillment Layer)
- **Batch Injection:** Uses the Neural Uplink (CDP) to push `createDocuments` manifests directly to Foundry.
- **Atmospheric Sync:** Automated placement of lights and tokens based on mission "Mood" keywords.

## 3. Communication Protocol (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
- **Asset Frame:** `{ type: 'asset_ingest', payload: { fileName, biome, status } }`.
- **Mission Frame:** `{ type: 'materialize_scene', payload: { journalId, mapId, npcRoster } }`.

## 4. Performance Targets
- **Map Indexing:** Full CV scan + Wall generation for a new map in **<45s**.
- **Mission Boot:** From "Generate Prompt" to "Physical Foundry Setup" in **<90s**.


---
**LINKS:** [[OS_CORE]]
