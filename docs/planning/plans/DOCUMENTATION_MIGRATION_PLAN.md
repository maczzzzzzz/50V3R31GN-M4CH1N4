# Documentation Migration & Restructuring Plan (v0.1.0)

## 1. Goal
Establish a single source of truth using HTML hosted on GitHub Pages. Deprecate Markdown documentation (except for root-level system files and READMEs) and the GitHub Wiki.

## 2. Inventory & Current State
- **Root Docs (Source of Truth for System State):**
    - `AGENTS.md`: Current hardware/model topology. (KEEP as MD for CLI visibility)
    - `IMPLEMENTATION_PLAN.md`: Roadmap and board status. (KEEP as MD for CLI visibility)
    - `SOVEREIGN_VITAL_SIGNS.md`: Health and status summary. (KEEP as MD for CLI visibility)
    - `GEMINI.md`: Subordinate instructions. (KEEP as MD for CLI visibility)
    - `LEAD_ARCHITECT.md`: Orchestration authority. (KEEP as MD for CLI visibility)
- **Docs Folder (`docs/`):**
    - Mixture of `.html` and `.md`.
    - Planning plans/research are mostly MD.
    - Architecture/Operations are mostly HTML.
- **Factory Skills (`.factory/skills/`):**
    - 100% Markdown (`SKILL.md` files).
- **GitHub Wiki:**
    - Out of sync. Target for deprecation.

## 3. Migration Plan

### Phase A: Cleanup & Consolidation
1. **Convert Remaining MDs to HTML:**
    - `docs/planning/plans/*.md` -> `docs/planning/plans/*.html`
    - `docs/planning/research/*.md` -> `docs/planning/research/*.html`
    - `docs/planning/audits/*.md` -> `docs/planning/audits/*.html`
2. **Standardize HTML Structure:**
    - Ensure all HTML files use `style.css`.
    - Update `index.html` to link to the new HTML files.
3. **Deprecate MD files in `docs/`:**
    - After verification, delete the MD versions of converted files.

### Phase B: Skill Documentation Integration
1. **Dynamic Skill Viewing:**
    - Create a script/tool to generate a consolidated `docs/reference/skills.html` from `.factory/skills/**/SKILL.md`.
    - This keeps the "source" in the factory but makes it readable in the web doc set.

### Phase C: Wiki Deprecation
1. **Redirect Wiki:**
    - Update GitHub Wiki Home page to point to the GitHub Pages site.
    - Archive wiki content.

## 4. Proposed Folder Structure (`docs/`)
```
docs/
├── architecture/      # Static HTML
├── benchmarks/        # Static HTML
├── crates/            # Static HTML
├── nodes/             # Static HTML
├── operations/        # Static HTML
├── planning/          # Static HTML
│   ├── plans/
│   ├── research/
│   └── audits/
├── reference/         # Static HTML (including skills.html)
├── assets/            # Images, diagrams, logs
├── index.html         # Portal
└── style.css          # Global styles
```

## 5. Files to Convert/Delete (Partial List)
- `docs/planning/KANBAN_MAP.md` -> `docs/planning/KANBAN_MAP.html`
- `docs/planning/plans/2026-05-19-open-design-mesh-integration.md` -> HTML
- `docs/planning/plans/2026-05-19-workflow-sovereign-tightening.md` -> HTML
- `docs/planning/plans/2026-05-20-hermes-relay-node-a-migration.md` -> HTML
- `docs/planning/plans/2026-05-20-node-b-qwopus-switch.md` -> HTML
- `docs/planning/audits/phase3-lcm-validation.md` -> HTML
- `docs/planning/research/2026-05-19-mesh-optimization-research.md` -> HTML
- `docs/benchmarks/node-d-ngram-speculative.md` -> HTML (already has HTML, delete MD)
- `docs/benchmarks/V0-FULL-MESH-benchmark.md` -> HTML (already has HTML, delete MD)
- `docs/benchmarks/V0-NODE-B-benchmark.md` -> HTML (already has HTML, delete MD)

## 6. Gaps Identified
- **Skill drift:** `.factory/skills/` contains many skills not listed in `GEMINI.md`.
- **Crate documentation:** `docs/crates/` exists but needs to be checked against the actual kept crates (`mirage-vfs`, `pretext-core`, `vibevoice-asr`, `zeroboot-isolation`).
