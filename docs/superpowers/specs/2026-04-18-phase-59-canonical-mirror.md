# SPEC: Phase 59 — Canonical Mirror (Nuke and Rebuild v4)
**Date:** 2026-04-18
**Status:** DRAFT // ARCHITECT_REVIEW
**Goal:** Achieve 1:1 parity with the Official Cyberpunk RED ruleset via systemic repo integration.

## ◈ 1. ARCHITECTURAL OBJECTIVES
- **Total Rules Sovereignty:** Node A (Kernel) must execute bit-identical logic to the official Foundry system.
- **Relational Integrity:** Akashik.db must reflect the modular component architecture of the core rules.
- **Localized Grounding:** All game entities must utilize canonical terminology from the Babele dictionary.

## ◈ 2. DATA ARCHITECTURE (AKASHIK.DB v4)

### New Canonical Tables
- `dv_tables`: (weapon_category, range_bracket, difficulty_value)
- `item_components`: (item_id, component_type [attackable, electronic, etc])
- `item_modifiers`: (item_id, key, value, mode [permanent, situational], trigger_tag)
- `localized_dictionary`: (key, value_en)

### Schema Expansion (npcs / items)
- `npcs`: +`interface_level`, `rez`, `deck_slots`, `head_sp`, `body_sp`.
- `items`: +`concealable`, `slots_used`, `reliability`, `is_installed`.

## ◈ 3. LOGIC ARTERY (ZEROCLAW RUST PORT)
Port the following logic from `fvtt-cyberpunk-red-core/src/modules/` to `zeroclaw/src/rules/`:
- **Fundamental Roll:** `CPRSkillRoll._computeBase()` adapter.
- **Modifier Stack:** `CPRMod` logic for accumulating permanent and situational bonuses.
- **DV Resolver:** Range-lookup algorithm for weapon categories.
- **Damage Core:** `CPRDamageRoll` logic (Ablation, Critical Injuries, Headshot multipliers).

## ◈ 4. THE ETL PIPELINE (TypeScript)
Implement `CprOfficialIngestor.ts`:
1. **Extraction:** Recursive YAML parsing of `packs/core/` and `packs/internal/`.
2. **Normalization:** Application of `025-040` migration logic during ingestion.
3. **Harmonization:** Creation of high-density semantic triplets in the `triplets` table.

## ◈ 5. THE RECONSTRUCTION SEQUENCE
1. **BACKUP**: Current mind archived to `data/archive/`.
2. **NUKE**: Total wipe of `Akashik.db` and `data/vault/RKG/`.
3. **INGEST**: Canonical layers fire in dependency order (Tables -> Items -> Actors -> Triplets).
4. **RE-LAYER**: Narrative PDF seeds selectively re-integrated post-canonical verification.

---
**::/5Y573M-N071C3 : SPEC_V4_STAGED. READY_FOR_IMPLEMENTATION_PLAN. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
