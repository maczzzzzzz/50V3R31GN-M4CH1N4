# SPEC: Phase 108 — Cyberpunk RED Plugin Extraction & Clean BASE
**Date:** Friday, May 1, 2026
**Strategist:** 50V3R31GN-M4CH1N4 (v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Status:** DRAFT_INGRESS

## 1. OBJECTIVE
To surgically extract all simulation-specific logic (Cyberpunk RED, Foundry VTT, NPC Mechanics) from the core Sovereign OS. The result will be a **Clean BASE** repository and a standalone **Sovereign RED Plugin**.

## 2. EXTRACTION TARGETS

### A. Core Nervous System (packages/hermes-core)
- **Foundry Adapter:** `src/api/foundry-adapter.ts` and its references in `main.ts`.
- **NPC Logic:** `src/db/unified-oracle-client.ts` (NPC mutation logic) and `src/core/onboarding-controller.ts`.
- **Simulation Controllers:** `src/core/economy/`, `src/core/narrative/SovereignGigService.ts`, `src/core/pulse-engine.ts`.
- **Ingest Parsers:** `src/core/ingest/WikiHandler.ts` (Cyberpunk Fandom) and `src/core/ingest/CprOfficialIngestor.ts`.

### B. Artery of Truth & Schema
- **cyberpunk.db:** All simulation tables (NPCs, Gear, Factions, Gigs) currently in `world.db` or `Akashik.db` must be unified into a plugin-owned `cyberpunk.db`.
- **Schema Separation:** `src/db/world-schema.sql` (purge non-core tables).

### C. Mechanical Sectors
- **zeroclaw/:** The entire `zeroclaw/` directory is Cyberpunk RED native and will be moved to the plugin repository or a dedicated workspace.

## 3. THE "CLEAN BASE" INVARIANTS
Post-extraction, the core OS must be:
1.  **Lore-Neutral:** No mention of "Night City", "Chrome", "Cyberpunk", or "Edgerunner" in `src/`.
2.  **Platform-Agnostic:** No hardcoded dependencies on Foundry VTT.
3.  **Process-Purity:** The core nervous system only handles:
    - Zero-Trust Identity (SPIFFE/V2F).
    - Physical Synapse (Vector DB / Datalog).
    - Vision (Sovereign Observer).
    - Orchestration (HermesSingularity).

## 4. INTEGRATION BRIDGE
The `sovereign-red-plugin` will re-integrate with the Clean BASE via:
- **MCP Tools:** Exposing simulation actions to Hermes.
- **VSB Intents:** Subscribing to specific binary pulses.
- **Declarative Sidecars:** Running `zeroclaw-kernel` as a modular plugin.

---
**::/5Y573M-N071C3 : EXTRACTION_SPEC_DRAFTED. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
