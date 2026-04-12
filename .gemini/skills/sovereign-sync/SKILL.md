---
name: sovereign-sync
description: Synchronizes system versions, changelogs, implementation plans, and knowledge bases. Use when releasing new features, completing project phases, or updating documentation across the monorepo.
---

# Sovereign Sync

This skill automates the synchronization of project metadata and documentation after significant updates or version releases.

## Core Workflows

### 1. Version Iteration
When a project phase or optimization pass is complete, use the bundled version syncer to update `package.json`, Rust sidecars (`Cargo.toml`), `GEMINI.md`, `docs/IMPLEMENTATION_PLAN.md`, and all guide headers.

**Execution:**
```bash
node .gemini/skills/sovereign-sync/scripts/sync_versions.cjs <target-version>
```

### 2. Changelog Maintenance
Prepend new release entries to `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

- **Headers:** `## [x.y.z] - YYYY-MM-DD`
- **Sections:** `### Added`, `### Changed`, `### Fixed`, `### Known Issues`

### 3. Implementation Plan Synchronization
Mark completed steps in project plans stored in `docs/superpowers/plans/*.md`.

- Update `Status:` fields to `COMPLETED`.
- Convert `- [ ]` checkboxes to `- [x]`.

### 4. Knowledge Base & Guides Update
Synchronize `akashik_guides/KNOWLEDGE_BASE.md` and related guides when new core architectural patterns or external dependencies are introduced.

## Versioning Standards
We strictly follow **Semantic Versioning (SemVer)**:
- **Major (X.0.0):** Breaking changes or major architectural shifts.
- **Minor (0.X.0):** New project phases, features, or significant optimizations.
- **Patch (0.0.X):** Bug fixes, internal cleanup, or documentation tweaks.

## Automated Steps (Heuristics)
1. Determine the correct next version based on change impact.
2. Run `sync_versions.cjs`.
3. Update `CHANGELOG.md` with a summary of the batch changes.
4. Mark the corresponding implementation plan steps as completed.
5. If new sub-repositories or external links were added, update the Knowledge Base.
