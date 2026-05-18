# 100% Coverage Audit - 2026-05-20

**Auditor:** Lead Architect  
**Scope:** Documentation parity vs physical/completed work

## Summary

Current documentation coverage is **~78%**. Several recent operational changes and completed work items are missing or only partially documented.

## Identified Gaps

### High Priority (Must Fix)

| # | Gap | Current State | Required Action |
|---|-----|---------------|-----------------|
| 1 | Hermes-Relay migration to Node A | Not documented | Add to AGENTS.md + new HTML page |
| 2 | Hermes-LCM Validation Gate results | Only in temp file | Move results into permanent docs |
| 3 | Passwordless sudo on Node A | Not documented | Add to operations/security section |
| 4 | Documentation Migration Plan | Exists but not linked | Add to planning index |
| 5 | Many planning files still .md | Mixed with HTML | Convert to HTML per migration plan |

### Medium Priority

| # | Gap | Current State | Required Action |
|---|-----|---------------|-----------------|
| 6 | Phase 3 (Hermes-LCM) status | Still marked PLANNED in KANBAN | Update after validation gate |
| 7 | Wiki deprecation notice | No redirect or notice | Add to GitHub Wiki home |
| 8 | Skill documentation parity | `.factory/skills/` not surfaced in docs | Generate `docs/reference/skills.html` |

### Low Priority

- Some old benchmark Markdown files still exist alongside HTML versions
- Crate documentation needs refresh after tech debt purge

## Task List: Documentation Coverage Fixes

### Phase 1: Immediate Cleanup (High Impact)

1. **Update AGENTS.md** — Add Hermes-Relay location (Node A) and status
2. **Create HTML page** for Hermes-Relay migration under `docs/operations/`
3. **Publish Hermes-LCM Validation results** as permanent HTML
4. **Add Passwordless sudo section** to operations docs
5. **Link DOCUMENTATION_MIGRATION_PLAN.md** from main docs index

### Phase 2: Structural Migration

6. Convert all remaining `.md` files in `docs/planning/` to HTML
7. Deprecate GitHub Wiki (add redirect notice)
8. Generate consolidated skills reference page
9. Update KANBAN_MAP.md with latest Phase 3 status
10. Run final parity check against current mesh state

## Recommendation

Execute Phase 1 immediately. Phase 2 can run in parallel with ongoing work.

**Current Coverage Estimate:** 78% → Target: 100% by end of week.