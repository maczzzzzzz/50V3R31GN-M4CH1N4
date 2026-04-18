# SPEC: Phase 60 — Sovereign Economy & Mission Generator
**Date:** 2026-04-18
**Status:** DRAFT // ARCHITECT_REVIEW
**Goal:** Subsume the official Cyberpunk RED vendor logic and build a dynamic Night Market & Gig generator powered by Node B and Akashik.db.

## ◈ 1. ARCHITECTURAL OBJECTIVES
- **Sovereign Night Markets:** Eliminate reliance on community Foundry macros (e.g., Sanno's Super Extras). Node B will natively generate Night Market inventories using official rolling rules (1d10 categories, 1d100 items) against the Canonical Mirror (Phase 59).
- **Dynamic Vendors:** Instantiate Foundry VTT `cpr-container` tokens configured as Vendors, injecting the Node B generated inventory and wiring the `tradePartnerId` logic.
- **Screamsheet Engine (Gigs):** Procedurally generate missions (Assassination, Thievery, Extraction) using the `triplets` semantic web to select lore-accurate locations, factions, and fully-statted canonical NPCs.

## ◈ 2. DATA ARCHITECTURE (AKASHIK.DB)
### New Tables / Views
- `night_markets`: (id, district_id, status [active, cleared], vendor_npc_id, inventory_json)
- `gigs`: (id, title, client_npc_id, target_npc_id, district_id, reward_eb, status)

## ◈ 3. NODE B LOGIC (TypeScript)
Implement `SovereignEconomyService.ts`:
- **`generateNightMarket(district: string)`**: Uses LLM to determine the theme, then queries the `items` table using weighted random selection (mimicking 1d100 rolls) to build the inventory.
- **`spawnVendorToken(market: NightMarket)`**: Uses the CDP bridge to execute Foundry `Actor.create` (type: container) and inject the inventory, configuring `system.vendor.itemTypes` for markup/markdowns.

Implement `SovereignGigService.ts`:
- **`generateScreamsheet()`**: Uses `Akashik.db` triplets to pull a random Faction, an opposing NPC, and a Location. Hands these to the LLM to generate a narrative brief.
- **`manifestGig(gig: Gig)`**: Automatically places the target NPC token on the corresponding Foundry Scene (via `AtlasForge`) and updates the player's Journal.

## ◈ 4. DEPENDENCIES
- Requires the completion of **Phase 59: Canonical Mirror** (so that we have the official weapons, gear, and actors to populate the markets and gigs).
- Requires the CDP Bridge (Foundry integration) to be fully operational for token spawning.

---
**::/5Y573M-N071C3 : SPEC_V4_ECONOMY_STAGED. // 50V3R31GN-M4CH1N4**
