# Design Specification: Red Trade Economy & Faction Matrix (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** March 31, 2026
**Subject:** Smuggling Mechanics, Faction Standing, and Immersion Loops
**Status:** FINALIZED

## 1. Executive Summary
The Red Trade Economy is the mechanical heart of Phase 5. It transitions the 50V3R31GN-M4CH1N4 from a mission-based assistant into a **Living City Simulator**. By leveraging existing TTTA and Mook Pack datasets, the system generates high-stakes smuggling runs where "contraband" is defined by supply chain disruption. Every action has a permanent, grounded impact on the player's relationship with Night City's power players.

## 2. Technical Data Models

### 2.1 Faction Relationship Matrix (world.db)
We expand the RKG to track multi-lateral standing.
- **Scale:** -10 (Shoot on Sight) to +10 (Ride-or-Die).
- **Friction Pool:** A dynamic value (0-10) representing active "Heat" with a specific faction in a specific district.
- **Friends/Enemies:** Explicit tracking of 3 Friends and 4 Enemies (per TTTA rules).

### 2.2 Cargo Manifest (Lore-Grounded)
Cargo is not generic; it is pulled directly from the `raw_data/` JSONs.
- **Categories:** 
    - **Data Runner:** Stolen Badges, Net-Maps (Buyer: Tyger Claws / Rival: Netwatch).
    - **Scarcity Goods:** Real Coffee, Medical Nanites (Buyer: Faction Leaders / Rival: Nomads).
    - **Military Gear:** Borgware, Smart-Guns (Buyer: Maelstrom / Rival: MAX-TAC).
- **Metadata:** Bulk (Physical/Digital), Rarity, and Faction Ownership.

## 3. The Immersion Loop

### 3.1 The Hook (Foundry `simple_phone`)
The AI initiates a "Fixer Call." Mistral-Nemo generates dialogue using the `CANON_FIXERS` registry.
- **Input:** Buyer Faction, Rival Faction, Cargo Type.
- **Output:** In-game phone call with payout terms and threat warnings.

### 3.2 The Transit (Friction Engine)
As the player moves, the backend executes "Friction Ticks."
- **Logic:** `roll 1d10 + current_friction`.
- **Thresholds:** 
    - **Low:** Aesthetic bark (World flavor).
    - **Medium:** Decision Gate (Foundry Dialog choice).
    - **High:** Rival Intervention (Ambush/Tax/Combat).

### 3.3 The Handoff & Standing Update
Delivery is verified via the **Unified Strategic Oracle**.
- **Success:** `UPDATE npcs SET disposition = 'friendly' WHERE name = ?`. Payout in `eb`.
- **Failure:** Standing with Buyer (--) and Fixer (--) drops.

## 4. Capture & The "Cryotank Skip"
If the player is reduced to 0 HP or surrenders during a Red Trade run:
1. **The Arrest:** AI narrates a "Shoot First" or "Overcrowded Prison" capture.
2. **The Skip:** **Pulse Engine** advances time (1d6 months).
3. **Punitive BD:** Character undergoes "Nightmare BD" (Mechanical checks for Humanity/Addiction on Node A).
4. **Economic Fallout:** If rent in `world.db` is unpaid during the skip, the player is **Evicted** from their current Housing Tier.
5. **The Reset:** Released to "The Street" with 0 items.

## 5. Implementation Boundaries
- **No Meta-Menus:** All choices must be native to Foundry chat or standard Dialogs.
- **No Cloud:** All cargo and faction data must remain in local SQLite files.


---
**LINKS:** [[OS_CORE]]
