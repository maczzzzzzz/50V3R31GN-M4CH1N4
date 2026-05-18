# Phase 2 and Phase 3 Audit Report
**Date:** 2026-05-18
**Branch:** stable/mesh-alpha

## 1. Test Results Summary
The `vitest` test suite was run for the `hermes-agent-nous/ui-tui` workspace.
- **Summary:** 791 tests passed, 2 tests failed.
- **Failures:**
  1. `src/__tests__/theme.test.ts`: `AssertionError: expected 'Sovereign Hermes' to be 'Hermes Agent'`. The brand name expected by tests differs from the actual implementation.
  2. `src/__tests__/cursorDriftRegression.test.ts`: Timed out after 5000ms.

## 2. Linter Violations
- **TypeScript (`tsc`):** Encountered global workspace execution issues (`npm error could not determine executable to run`), indicating potential technical debt in the root workspace configuration for monolithic linting checks across sidecars. 
- **Python (`ruff` / `flake8`):** Missing linters in the base NixOS environment for the `hermes-lcm` sidecar. This reveals a gap in the `nix/modules` setup for Python dependency management.

## 3. Architecture Compliance
A detailed subagent code review was conducted against `IMPLEMENTATION_PLAN.md` and `SOVEREIGN_VITAL_SIGNS.md` for Phase 3 (Hermes-LCM State Sync).

### Blockers and Deviations
- **Critical Architectural Drift:** The core `sidecars/hermes-lcm/hermes_lcm_provider.py` and the plugin at `sidecars/hermes-agent-nous/plugins/memory/hermes-lcm/provider.py` are completely disconnected. The core uses an `ideablocks` schema (`/var/lib/hermes-lcm/memory.db`) while the plugin reimplements SQLite management using a `sessions` DAG schema (`$HERMES_HOME/lcm.db`).
- **Missing Core Requirement (Rsync):** The Phase 3 Status plan explicitly requires "rsync for cross-node state sync." Neither the core service loop (`__main__.py`) nor the plugin contains the logic or systemd configurations to manage this replication to Nodes B and D.
- **Daemon Inactivity:** The `__main__.py` core daemon loops endlessly (`while True: sleep(1)`) without actually performing any synchronization duties.
- **Token Truncation Bug:** In `provider.py:get_context()`, the token limit constraint checks the *list length of messages* rather than calculating actual token counts, effectively breaking the context window limit.

## 4. Documentation Drift
- **False Completion Claims:** `docs/planning/PHASE3_STATUS.md` falsely lists Phase 3 Hermes-LCM as `CLOSED` and claims the provider is "Ready for runtime activation." The implementation is disconnected, lacking sync mechanisms, and structurally broken. 
- **Conflicting Statuses:** `KANBAN_MAP.md` accurately lists P3-T1 as `IN PROGRESS`, contradicting the `PHASE3_STATUS.md` document.

## 5. Technical Debt & Recommendations
1. **Consolidate Hermes-LCM Implementation:** Delete the duplicate `sessions` database logic inside the plugin. Refactor `provider.py` inside the agent plugin to act strictly as an interface that imports the core `HermesLCMProvider` class.
2. **Implement Rsync Strategy:** Build the actual rsync cross-node replication script or update the Python daemon loop in `__main__.py` to sync states to Nodes B, C, and D.
3. **Fix Context Window Logic:** Update `get_context()` to iterate backward through `full_context`, accumulating actual estimated token counts to respect hardware constraints.
4. **Fix Test Regressions:** Update `theme.test.ts` to expect 'Sovereign Hermes', and fix the timeout in the `cursorDriftRegression.test.ts`.
5. **Standardize Linting Scripts:** Update the root `package.json` with workspace commands (e.g., `npm run lint --workspaces`) to allow easy auditing without having to trace binary executable resolution bugs.
6. **Correct Documentation:** Revert `docs/planning/PHASE3_STATUS.md` to `IN PROGRESS` to reflect reality.