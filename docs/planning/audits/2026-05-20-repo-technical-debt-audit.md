# Repository Technical Debt & Drift Audit
**Date:** 2026-05-20
**Branch:** stable/mesh-alpha
**Auditor:** GLM-5 (automated, real filesystem inspection)
**Scope:** Full repository -- dead code, bloat, drift, documentation, coverage

---

## EXECUTIVE SUMMARY

The repository at v0.3.8-alpha is **8.4 GB on disk**, of which only **1.3 GB is git-tracked**.
The remaining **7.1 GB** is untracked bloat: `.npm-global` (467 MB), Rust `target/` artifacts (348 MB), hermes-agent submodule (1.2 GB), kanban `.venv` (119 MB), dashboard files (266 MB), and Python `__pycache__` directories scattered across the tree.

Documentation has **critical version drift**: `SOVEREIGN_VITAL_SIGNS.md` claims v0.3.1-alpha, `README.md` claims v0.3.6-alpha, `SESSION_HANDOFF.md` claims v0.3.9-alpha, and `CHANGELOG.md` has v0.3.8-alpha at the bottom but v0.3.7-alpha at the top with chronologically impossible dates.

---

## 1. TEMPORARY FILES & BLOAT

### SEVERITY: CRITICAL

| Issue | Path | Size | Severity | Action |
|-------|------|------|----------|--------|
| `.npm-global/` directory | `.npm-global/` | 467 MB | CRITICAL | DELETE. Already in `.gitignore`. NPM cache that should not exist in workspace. |
| Rust `target/` build artifacts | `crates/modules/vibevoice-asr/target/` | 348 MB | CRITICAL | DELETE. `**/target/` is in `.gitignore` but files exist on disk. Run `cargo clean`. |
| Python `__pycache__/` directories | Multiple (30+ dirs across sidecars/) | ~8 MB pyc files | HIGH | DELETE all. Already in `.gitignore`. Use `find . -type d -name __pycache__ -exec rm -rf {} +` |
| Windows `nul` file | `./nul` | 0 bytes | MEDIUM | DELETE. Windows null device redirect artifact. |
| `.venv` for kanban-mcp-server | `sidecars/kanban-mcp-server/.venv/` | 119 MB | MEDIUM | Already in `.gitignore`. Keep locally but ensure never tracked. |
| `.venv` for mesh-router | `sidecars/mesh-router/.venv/` | 31 MB | MEDIUM | Same. |
| Dashboard workspace | `dashboard/hermes-workspace/` | 266 MB | LOW | Investigate if needed. Otherwise clean. |
| Empty `wasm/` directory | `wasm/` | 0 files | LOW | DELETE or add placeholder. Dead empty directory. |
| Empty `.worktrees/` directory | `.worktrees/` | 0 entries | LOW | Leftover from worktree operations. Safe to remove. |
| `test-results/` | `test-results/` | 8 KB | LOW | Contains `.last-run.json`. Already `.gitignore`-eligible. |

### Git-tracked bloat:

| Issue | Path | Size | Severity | Action |
|-------|------|------|----------|--------|
| Tracked `.bak` files | `docs/planning/archive/backups/260510-rebase/kanban.db.bak` (100 KB), `state.db.bak` (272 KB) | 372 KB | HIGH | REMOVE from git. Archive files should not include binary DB dumps. |
| Duplicate PHASE3 doc | `docs/planning/plans/PHASE3-MEMORY-ARCHITECTURE-UPDATED.html` | 12.5 KB | LOW | Consolidate with `PHASE3-MEMORY-ARCHITECTURE.html`. |

---

## 2. DEAD CODE & ORPHANED FILES

### SEVERITY: HIGH

| Issue | Path | Severity | Details |
|-------|------|----------|---------|
| `scripts/repro/` -- ALL 7 files are dead | `scripts/repro/` | CRITICAL | `repro_crash.py` references dead `sovereign-vsb` provider and `brain-9b` model. `fix_issues.py` references `.worktrees/phase3-implementation/` which no longer exists. `investigate_localhost.mjs`, `investigate.spec.js` are one-off debugging artifacts. `mock_llm.js/py` are test stubs for dead providers. `kanban-bootstrap.py` references old v3.6.0-ALPHA naming. |
| `audit_script.py` + `audit_results.txt` | Root directory | HIGH | Previous audit artifacts from 2026-05-16. Should be moved to `docs/planning/audits/` or deleted. |
| Nested duplicate mesh-router binary | `sidecars/mesh-router/sidecars/mesh-router/mesh-router` | HIGH | Full path duplication: the wrapper script exists at both `sidecars/mesh-router/mesh-router` AND `sidecars/mesh-router/sidecars/mesh-router/mesh-router`. The nested copy must be deleted. |
| `scripts/semantic-shift.sh` | `scripts/semantic-shift.sh` | HIGH | References `docs/nodestadt/architecture` and `docs/nodestadt/capabilities` -- these directories DO NOT EXIST. Entire script is dead. |
| `scripts/hermes/node-d-dual-ui.sh` | `scripts/hermes/node-d-dual-ui.sh` | MEDIUM | References `herm-tui` via `bun`. This was never deployed. Dead script. |
| `scripts/tests/test_vsb.py` | `scripts/tests/test_vsb.py` | MEDIUM | Imports `plugins.model_providers.sovereign_vsb` -- dead provider path. |
| `nix/modules/omi-backend.nix` | `nix/modules/omi-backend.nix` | MEDIUM | Pure stub: "No-op placeholder" with TODO. OMI backend was never implemented. |
| `nix/modules/stagehand-env.nix` | `nix/modules/stagehand-env.nix` | MEDIUM | Stagehand browser automation was evaluated and abandoned (documented in IMPLEMENTATION_PLAN). Module is dead. |
| `nix/modules/directors-forge.nix` | `nix/modules/directors-forge.nix` | LOW | Director's Forge is CANCELLED per IMPLEMENTATION_PLAN (P3-T2). Module is dead. |
| `nix/packages/llama-cpp-openvino.nix` | `nix/packages/llama-cpp-openvino.nix` | LOW | OpenVINO build for llama.cpp. No node uses OpenVINO. Dead package. |
| `scripts/start-vision-optimized.bat` | `scripts/start-vision-optimized.bat` | LOW | Windows batch file. Kept for Node B Windows-side use, but should be in docs not scripts root. |
| `sidecars/mesh/docker-compose.yml.bak` | `sidecars/mesh/docker-compose.yml.bak` | LOW | LiteLLM Docker stack archived per 0.3.8 changelog. Keep as archive reference. |
| `sidecars/mesh/litellm-mesh.yaml.bak` | `sidecars/mesh/litellm-mesh.yaml.bak` | LOW | Same. |

---

## 3. DOCUMENTATION DRIFT

### SEVERITY: CRITICAL

#### 3.1 Version Number Inconsistencies

| Document | Claims Version | Actual Current | Severity |
|----------|---------------|----------------|----------|
| `SOVEREIGN_VITAL_SIGNS.md` header | **v0.3.1-alpha** | v0.3.8-alpha | CRITICAL |
| `README.md` badge | **v0.3.6-alpha** | v0.3.8-alpha | HIGH |
| `SESSION_HANDOFF.md` header | **v0.3.9-alpha** | v0.3.8-alpha | HIGH |
| `CHANGELOG.md` top entry | **0.3.7-alpha** (2026-05-17) | 0.3.8-alpha | HIGH |
| `IMPLEMENTATION_PLAN.md` header | v0.3.6-alpha | v0.3.8-alpha | MEDIUM |

#### 3.2 CHANGELOG Date Impossibilities

- `0.3.7-alpha` dated 2026-05-17
- `0.3.6-alpha` dated 2026-05-17
- `0.3.5-alpha` dated **2026-05-19** (AFTER 0.3.6 and 0.3.7)
- `0.3.4-alpha` dated 2026-05-18
- `0.3.8-alpha` is at the **BOTTOM** of the changelog instead of the top

The CHANGELOG is not in reverse chronological order and has date regressions.

#### 3.3 Throughput Data Drift in `SOVEREIGN_VITAL_SIGNS.md`

| Route | VITAL_SIGNS says | IMPLEMENTATION_PLAN says | README says | Reality (latest baseline) |
|-------|-----------------|------------------------|-------------|--------------------------|
| mesh-fast | prompt 322, gen 34.1 t/s | 428-441 / 53.8-55.1 t/s | 428-441 / 53.8-55.1 t/s | 428-441 / 53.8-55.1 t/s |

`SOVEREIGN_VITAL_SIGNS.md` has **stale benchmark numbers** for mesh-fast (322/34.1 vs actual 428-441/53.8-55.1).

#### 3.4 Route Count Inconsistency

| Document | Claims Routes | Severity |
|----------|--------------|----------|
| `IMPLEMENTATION_PLAN.md` | **5 routes** (including mesh-micro on A) | CORRECT |
| `README.md` | **4 routes** (omits mesh-micro) | HIGH |
| `SOVEREIGN_VITAL_SIGNS.md` | **4 routes** (text says 4, but table lists mesh-micro) | HIGH |
| `SOVEREIGN_VITAL_SIGNS.md` Node B section | **4 routes** | HIGH |

#### 3.5 Phase Status Drift

| Document | Phase Status | Correct? |
|----------|-------------|----------|
| `SOVEREIGN_VITAL_SIGNS.md` | "PHASE 0 CLOSED. Phase 2 IN PROGRESS." | PARTIAL -- Phase 2 is CLOSED NEGATIVE. Phase 3 is current. |
| `IMPLEMENTATION_PLAN.md` | Phase 3 IN PROGRESS | CORRECT |
| `README.md` | "Phase 2 in progress" | STALE |

#### 3.6 SESSION_HANDOFF Broken References

`SESSION_HANDOFF.md` references three files that **do not exist**:
- `docs/planning/benchmark-iteration-plan.md` -- MISSING
- `docs/benchmarks/run-3-baseline-passes.sh` -- MISSING (archived to `docs/benchmarks/archive/`)
- `docs/planning/research/2026-05-20-deep-mesh-optimization-research.md` -- MISSING (only `.html` exists, not `.md`)

#### 3.7 Duplicate PHASE 3 Section

`IMPLEMENTATION_PLAN.md` has **two** `## PHASE 3: SOVEREIGN PLUGINS` sections at lines 48 and 96. The second one at line 96 partially duplicates and partially extends the first.

---

## 4. COVERAGE GAPS

### 4.1 Files NOT Covered by Any Documentation

| Item | Gap |
|------|-----|
| `sidecars/mesh-router/` | Not mentioned in README project structure. New native mesh router (0.3.8 feature) missing from project tree listing. |
| `sidecars/hermes-relay/` | Not in README project structure. |
| `sidecars/hermes-lcm/` | Not in README project structure. |
| `crates/modules/` | Not in README. Only 4 crates, 3 are tracked (directors-forge cancelled, mirage-vfs and zeroboot are Phase 3+). |
| `.factory/` | Agent factory with skills/directives. Not documented. |
| `.gemini/` | Gemini CLI configuration. Not documented. |
| `GEMINI.md` | Referenced in `.gitignore` allow-list but existence not explained in README. |
| `SOUL.md` | Listed in README key documents table but not explained. |
| `LEAD_ARCHITECT.md` | Not in README project structure or key documents. |
| `CONTRIBUTORS.md` | Referenced in README text but not in key documents table. |
| `scripts/tests/` | Test scripts not documented. |
| `scripts/model-artery/` | Has README but not linked from main docs. |

### 4.2 README Project Structure is Stale

The README lists the project structure as having these top-level items under `sidecars/`:
- `mesh/` (LiteLLM config)
- `kanban-mcp-server/`
- `hermes-agent-nous/`

**Missing from README:**
- `sidecars/mesh-router/` -- the NEW native mesh router
- `sidecars/hermes-relay/` -- the relay service
- `sidecars/hermes-lcm/` -- the LCM memory plugin

---

## 5. STRUCTURAL ISSUES

| Issue | Severity | Details |
|-------|----------|---------|
| Duplicate PHASE 3 in IMPLEMENTATION_PLAN.md | HIGH | Two `## PHASE 3` headers at lines 48 and 96. Consolidate into one. |
| CHANGELOG ordering broken | CRITICAL | 0.3.8-alpha is at bottom. 0.3.5-alpha dated after 0.3.7-alpha. |
| Nested directory copy `sidecars/mesh-router/sidecars/mesh-router/` | HIGH | Accidental deep copy of the mesh-router directory inside itself. |
| `scripts/repro/` references `.worktrees/phase3-implementation/` | HIGH | Worktree was deleted; scripts are dead. |
| `docs/planning/archive/` is 89% of docs/ by size | MEDIUM | 9.8 MB of archive vs 11 MB total docs. Consider compressing or externalizing. |

---

## 6. RECOMMENDED ACTIONS (PRIORITIZED)

### P0 -- Fix Immediately

1. **DELETE untracked bloat** (saves ~810 MB):
   ```bash
   rm -rf .npm-global/
   cd crates/modules/vibevoice-asr && cargo clean
   find . -type d -name __pycache__ -exec rm -rf {} +
   rm -f nul
   ```

2. **Fix SOVEREIGN_VITAL_SIGNS.md version header**: `v0.3.1-alpha` -> `v0.3.8-alpha`

3. **Fix SOVEREIGN_VITAL_SIGNS.md mesh-fast throughput**: `322/34.1` -> `428-441/53.8-55.1`

4. **Fix route count**: Update VITAL_SIGNS and README from "4 routes" to "5 routes" (including mesh-micro)

5. **Fix CHANGELOG ordering**: Move 0.3.8-alpha to top, fix date on 0.3.5-alpha

### P1 -- Fix This Session

6. **Delete `scripts/repro/` entirely** -- all 7 files reference dead paths/providers
7. **Delete nested duplicate**: `rm -rf sidecars/mesh-router/sidecars/`
8. **Delete `scripts/semantic-shift.sh`** -- references non-existent `docs/nodestadt/` directories
9. **Fix SESSION_HANDOFF.md broken references**: Update paths to actual file locations
10. **Consolidate duplicate PHASE 3 section** in IMPLEMENTATION_PLAN.md
11. **Update README.md project structure** to include mesh-router, hermes-relay, hermes-lcm
12. **Update README.md version badge** to 0.3.8-alpha
13. **Update phase status** in README and VITAL_SIGNS to "Phase 3 in progress"

### P2 -- Cleanup Soon

14. **Move `audit_script.py` and `audit_results.txt`** to `docs/planning/audits/`
15. **Remove git-tracked `.bak` files**: `git rm docs/planning/archive/backups/260510-rebase/*.bak`
16. **Delete dead Nix modules**: `omi-backend.nix`, `stagehand-env.nix`
17. **Delete `nix/packages/llama-cpp-openvino.nix`** -- no node uses OpenVINO
18. **Delete `scripts/hermes/node-d-dual-ui.sh`** -- never deployed
19. **Consolidate PHASE3-MEMORY-ARCHITECTURE docs** into one file
20. **Delete `scripts/tests/test_vsb.py`** -- imports dead sovereign_vsb provider

### P3 -- Backlog

21. Add `.env` to git-tracked exclusion verification (currently tracked, should verify it's empty/safe)
22. Consider emptying or removing `wasm/` directory
23. Consider removing empty `.worktrees/` directory
24. Document `.factory/` and `.gemini/` in README or AGENTS.md
25. Move `scripts/start-vision-optimized.bat` to `docs/operations/` or `sidecars/` as reference

---

## 7. METRICS

| Metric | Value |
|--------|-------|
| Total repo size on disk | 8.4 GB |
| Git-tracked size | 1.3 GB |
| Untracked bloat | 7.1 GB |
| `__pycache__` directories | 30+ |
| Dead/orphaned scripts | 10+ |
| Documentation drift items | 12 |
| Broken file references in docs | 3 |
| Stale Nix modules | 3 |
| Version number conflicts | 5 documents disagree |
| CHANGELOG date errors | 3 entries |

---

**Audit complete.** All findings based on real filesystem inspection, git status, and file content analysis. No simulated data.
