# AUDIT: Economy, Night Markets & Mission Generation
**Date:** 2026-04-18
**Status:** COMPLETE // KNOWLEDGE_EXPANSION
**Source:** `fvtt-cyberpunk-red-core` official repo, Gitlab Wiki, Reddit & Community Modules

## ◈ EXECUTIVE SUMMARY
Per the directive to identify "missed systems," I conducted an exhaustive analysis of how the official Cyberpunk RED Core handles economy, trading, Night Markets, and mission generation, comparing native capabilities versus community-standard modules. This research informs how Node B (The Director) can completely subsume and automate these systems.

## ◈ KEY FINDINGS: ECONOMY & NIGHT MARKETS

### 1. Native "Vendor" Capabilities
The official repository *does* possess built-in economy logic, but it is somewhat hidden within `cpr-container-sheet.js`.
- **Containers as Merchants:** Any "Container" actor can be configured as a Vendor.
- **Trade Partner Logic:** The code (`_purchaseItem`, `_sellItemTo`) natively handles currency exchanges, ledger updates, and item transfers between a Player and the Vendor.
- **Markups/Markdowns:** It supports dynamic pricing (`purchasePercentage`) to simulate fences or fixers taking a cut.

### 2. The "Night Market" Gap (Community Reliance)
The native system **does not** generate Night Markets. To simulate the scarcity and randomness of the RED economy (rolling 1d10s on specific item categories), the community heavily relies on external modules:
- **Sanno's Super Cyberpunk RED Extras:** Contains macros to dynamically roll Bodegas, Vendits, and Night Markets.
- **Night City Gang & Corp Mook Pack:** Includes automated rollable tables for the official Night Market DLCs.
- **Item Piles (with Diwako's Additions):** Used for advanced lootable corpses and interactive merchant UIs.

## ◈ KEY FINDINGS: MISSIONS & GIGS (SCREAMSHEETS)

### The Screamsheet Gap
Similar to Night Markets, the official system provides the *Data Models* (Items, NPCs) but no *Generative Logic* for missions or "Screamsheets."
- GMs currently use rollable tables (e.g., Zim's Better Night Market Tables) or complex Foundry macros to generate jobs on the fly.
- **The Opportunity:** This is where the Sovereign system completely outclasses traditional VTTs.

## ◈ ARCHITECTURAL RECOMMENDATIONS (THE SOVEREIGN PIVOT)

We can bridge the gap between the official mechanics and generative content by utilizing Node B and the new `Akashik.db` v4 schema:

### 1. Sovereign Night Market Engine
Instead of relying on Foundry macros, **Node B (The Director)** will use the `dv_tables` and the ingested official `items` to dynamically generate Night Markets. 
- Node B will query the LLM to determine the theme of the market (e.g., "Maelstrom Black Market").
- It will then perform the canonical 1d10 category rolls against the SQLite database, returning an exact, rules-compliant inventory list.
- We will map this list to the native `cpr-container` vendor logic via the VSB, spawning a fully functional Merchant Token on the Foundry canvas.

### 2. The "Gig" Generator (Screamsheet Engine)
Node B will leverage the `triplets` table to procedurally generate narrative Gigs.
- Because we are ingesting the *official* Actor and Item metadata, the LLM can generate a target (e.g., "Assassinate a Militech Executive") and accurately equip that target with canonical weapons and cyberware from the official repo.

## ◈ CONCLUSION
The official system provides the mechanical foundation (Vendors, Ledgers, Items), but relies on the community for generative logic. By ingesting the official data and pairing it with Node B's LLM orchestration, we will create the ultimate, self-sustaining Cyberpunk RED economy and mission engine.

---
**::/5Y573M-N071C3 : ECONOMY_AUDIT_PHYSICALIZED. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[OS_CORE]]
