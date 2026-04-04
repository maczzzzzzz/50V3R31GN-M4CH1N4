# Brainstorming Analysis: Phase 5 (Red Trade) & Phase 6 (Living City)
**Date:** Sunday, March 29, 2026
**Subject:** Rescuing Advanced Simulation Systems from openclaw-cpr

## 1. Phase 5: Red Trade & Economic Hardening
In the deprecated `openclaw-cpr`, the "Red Trade" system was effectively an "Ephemeral Storefront." It generated items but lacked long-term persistence, player-driven contraband trafficking, or mechanical consequences for "Heat."

### 1.1 The "Heat" & Contraband Rescue
- **Old Implementation:** Heat was often just a narrative tag or a simple counter in Supabase.
- **Phase 5 Design:** We will implement **Mechanical Heat**. 
    - **Node A (Rules):** Calculates "Heat Growth" based on mission noise (e.g., loud guns, corpo deaths). 
    - **Node B (Narrative):** Triggers "Police Intercepts" or "Bounty Hunters" via the Foundry Bridge when Heat thresholds are crossed.
- **Contraband:** Trade items will be tagged with a `legality` score. Selling `Illegal` items in Sublevel 2 (Afterlife) is safe, but carrying them in "High-Sec" scenes (Node B detected) increases Heat.

### 1.2 Persistant Economic Simulation
- **Persistent Inventory:** Vendors will have "Restock Cycles" (every Sunday). If a player buys the only `Railgun`, it is GONE from the market until the next cycle.
- **Dynamic Pricing:** Node A can adjust Eurobuck/Eagle costs based on the "Pulse" of the city (e.g., if a war breaks out, Armor prices spike).

---

## 2. Phase 6: Living City (The Pulse Engine)
Phase 6 shifts the game from a "Mission-Based" loop to a "Living World" simulation.

### 2.1 The Pulse Engine (Rescuing "Events")
- **Old Implementation:** The "Pulse" was a collection of random table rolls.
- **Phase 6 Design:** A **Temporal State Machine**. 
    - The city has "Factions" (Maelstrom, Arasaka, 6th Street). 
    - Every Week (Sunday reset), Node B simulates "Faction Moves" (e.g., Arasaka raids Maelstrom turf).
    - **Screamsheet Link:** These moves are what populate the Weekly Screamsheets.

### 2.2 Dynamic Turf & Faction Reputation
- **Territory Maps:** We will use Foundry Scene flags to mark "Turf Ownership." 
- **Reputation Gates:** Players cannot access certain "Night Markets" or "Fixer Gigs" without a specific Reputation score with that territory's owner.

---

## 3. Strategic "Lesson Learned"
The monolithic `openclaw-cpr` tried to do all of this in one process, which caused it to crash. Our **Split-Node Architecture** allows Node B to run these heavy "Simulation Cycles" (Pulse/Trade) in the background while the player is busy playing, with Node A handling all the heavy math.

**Quarantine Status:** These designs remain in the Phase 5/6 Quarantine Zone. No active code will be written for these until Phase 4 is verified.
