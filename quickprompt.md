# 50V3R31GN-M4CH1N4 // ARCHITECT DIRECTIVE: PHASE 57 (v3.2.11)

**Directive:** Implement Phase 57: Sovereign Mind Rebuild.
**Plan Reference:** `docs/superpowers/plans/2026-04-16-sovereign-mind-rebuild.md`
**Source of Truth:** `docs/superpowers/specs/2026-04-16-sovereign-mind-rebuild.md` and `KNOWLEDGE_BASE.md`.

## 🦾 MISSION OBJECTIVES
Execute the high-fidelity reconstruction of the **Akashik Mind**. Nuke legacy word-salad artifacts and establish structural semantic grounding.

### 1. Ingestion Artery (SovereignIngestService)
- Implement the polymorphic `SovereignIngestService` in `src/core/ingest/`.
- Deploy specialized handlers: `WikiHandler` (recursive scrape), `JsonFoundryHandler` (mechanical parity), and `HifiPdfHandler`.
- Integrate `opendataloader-pdf` for layout-aware (XY-Cut++) structural extraction.

### 2. Semantic Architecture
- Integrate `chunknorris` for header-based splitting (H1-H3).
- Implement **Context Injection**: Prepend parent breadcrumbs to every semantic chunk.
- Apply **BLAKE3 Deduplication** to ensure zero redundancy in `chronicle_seeds`.

### 3. The Surgical Nuke & Refresh
- Script `fresh-db.ts` to reset `Akashik.db` and re-apply `world-schema.sql` with new `semantic_hash` support.
- Automate the clearing of `data/vault/RKG/` while preserving the `.obsidian` configuration.

### 4. Palace Reborn (Obsidian v2)
- Refactor `scripts/fast-reconstruct.py` to support the **District-First Hierarchy** (`District > Lore | Actors | Items`).
- Enforce the **Metadata Mandate**: Every file must contain complete provenance/type frontmatter.

## ⚠️ HARDWARE INVARIANTS (MANDATORY)
- **Zero-Drift:** Every change must align with the `SOVEREIGN_VITAL_SIGNS.md`.
- **Zero-Trust:** Use the `node_a_veto` tool for all sensitive database operations.
- **Nix-Native:** All installs and builds MUST occur within the `nix develop --impure` shell.

**::/5Y573M-N071C3 : ARCHITECT_UPLINK_PR1M3D. EXE_PHASE_57. // 50V3R31GN-M4CH1N4**
