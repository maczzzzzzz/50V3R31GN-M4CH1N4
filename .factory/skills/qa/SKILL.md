---
name: qa
description: >
  Run QA tests for Sovereign Machina. Analyzes git diff to determine affected areas,
  runs configured test flows via agent-browser (workspace), curl (agent API), and
  shell commands (Rust crates). Use when testing PRs, releases, or smoke testing
  the mesh.
---

# QA Orchestrator

**SCOPE: This skill performs manual/functional QA only -- verifying that the application actually works by interacting with it as a real user would (browser, API calls, shell). Do NOT run or report on CI checks, linting, unit tests, or any static analysis. Those are handled by separate workflows.**

## Step 1: Load Configuration

Read `.factory/skills/qa/config.yaml` for environment URLs, credentials, personas, and app definitions.

## Step 2: Determine Target Environment

Use `tailscale_mesh` (Node B: 100.66.173.31) as default unless the user specifies a different environment.
Respect all environment restrictions.

If targeting Tailscale mesh, verify connectivity first:
```bash
curl -s -o /dev/null -w "%{http_code}" http://100.66.173.31:3002/ --max-time 5
```
If unreachable, fall back to local dev (`localhost:3002`) and note the fallback in the report.

## Step 3: Analyze Git Diff

Run `git diff` to determine what changed. Map changed files to apps using the `path_patterns` in config.yaml.

Files that don't match ANY app's path_patterns (e.g., `.factory/skills/**`, `docs/**`, `.github/**`, `AGENTS.md`, `CHANGELOG.md`, `SOUL.md`, `SOVEREIGN_VITAL_SIGNS.md`) are NOT associated with any app. Do NOT run app test flows for them.

For each affected app:
- Run ONLY that app's flows from its sub-skill
- Generate ADDITIONAL targeted tests based on the specific changes in the diff

For apps NOT affected by the diff:
- Do NOT load or run their sub-skills

If NO app is affected by the diff (docs-only, CI-only, config-only changes), report as INCONCLUSIVE: "No app code changed -- QA not applicable for this diff."

## Step 4: Pre-flight Checks (app-specific only)

Run pre-flight checks ONLY for the apps affected by the diff:

- **Workspace**: Verify target URL is reachable and returns HTTP 200
- **Agent**: Verify agent API is responding at the configured agent_api URL
- **Crates**: Verify `nix` is available in PATH

If a pre-flight check fails, report it as BLOCKED but proceed with other affected apps.

## Step 5: Execute Diff-Relevant Flows Only

For each app that IS affected by the diff, read its sub-skill from `.factory/skills/qa-<app-name>/SKILL.md`.

The sub-skill contains a MENU of available test flows. You must:
1. Read the diff and identify which flows are relevant to the change
2. Run those flows PLUS adjacent flows that verify integration
3. Do NOT run completely unrelated flows
4. If no existing flow covers the change, write a NEW ad-hoc test

## Step 6: Evidence Capture

For workspace tests (agent-browser):
- Use `take_snapshot` to capture accessibility tree as text evidence
- Save screenshots to `./qa-results/$RUN_ID/`

For API/shell tests:
- Capture command output directly
- Log HTTP response codes and response bodies

Evidence quality rules:
- Focus on RELEVANT content
- Label each capture clearly
- NEVER embed broken image links

## Step 7: Test Quality Gate

1. CHANGE-SPECIFIC FIRST -- at least half your tests should verify the actual change
2. INTEGRATION TESTS ARE VALID -- verify the change didn't break integration points
3. NO UNRELATED FLOWS -- don't test features unrelated to the diff
4. NO AUTOMATED TEST SUITES -- no vitest, pytest, cargo test
5. NEGATIVE TESTS -- include at least 1 error handling test
6. INCONCLUSIVE IF UNSURE -- mark as INCONCLUSIVE rather than guessing

## Step 8: Handle Failures

Never silently skip a flow. If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it. Continue to the next flow.

## Step 9: Generate Report

Generate the report at `./qa-results/report.md` using `.factory/skills/qa/REPORT-TEMPLATE.md`.

## Step 10: Suggest Skill Updates (Failure Learning)

After generating the report, check if any BLOCKED or FAIL results revealed a testing environment insight that would help future QA runs. Format as a table with severity, collapsible fix prompts, and a count in the heading.

Read `failure_learning` from config.yaml: currently `suggest_in_report` -- include the table in the report only.
