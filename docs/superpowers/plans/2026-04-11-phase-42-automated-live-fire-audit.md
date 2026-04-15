# Phase 42: Automated Live-Fire Audit & Debug Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate the end-to-end verification and surgical debugging of the 50V3R31GN-M4CH1N4 system within a live Foundry VTT session using Chrome DevTools MCP and structured log analysis.

**Status: COMPLETE**

**Architecture:**
- **Inspection:** Utilize Chrome DevTools CDP to verify Bridge module presence, CSS injection state, and console error parity.
- **Telemetry:** Automated grepping of `data/logs/orchestrator.log` and `data/logs/crush.log` during test execution.
- **Validation:** Injection of synthetic combat and movement events to verify the rules-authority loop (Node A -> VSB -> Node B -> Foundry).

**Tech Stack:** Chrome DevTools MCP, Node.js, TypeScript, shell (tail/grep).

---

### Task 1: Environment Readiness Audit (Foundry/CDP)

**Files:**
- Create: `scripts/audit-live-session.ts`
- Test: `tests/scripts/audit-live-session.test.ts`

- [x] **Step 1: Verify CDP Connectivity**
Use `mcp_chrome-devtools_list_pages` to find the Foundry target and verify the debug port is open.

- [x] **Step 2: Inspect Bridge Module State**
Execute `mcp_chrome-devtools_evaluate_script` to check `game.modules.get('foundry-api-bridge')?.active` and verify the WebSocket status in the Foundry console.

- [x] **Step 3: Log Initial State**
Capture a baseline screenshot of the Foundry UI using `mcp_chrome-devtools_take_screenshot`.

---

### Task 2: Automated Log Surveillance

**Files:**
- Modify: `package.json`
- Create: `scripts/watch-logs.sh`

- [x] **Step 1: Create Log Watcher**
Implement a script that tails `data/logs/orchestrator.log` and `data/logs/crush.log`, filtering for `ERROR` and `WARN` severities.

- [x] **Step 2: Integration with Test Suite**
Add a `test:live` script to `package.json` that spawns the log watcher in the background while running synthetic tests.

---

### Task 3: Synthetic Intent Injection (The Gauntlet)

**Files:**
- Create: `scripts/synthetic-gauntlet.ts`

- [x] **Step 1: Resolve Attack Injection**
Use CDP to click a weapon on an actor sheet and verify that `handleResolveAttack` is triggered in the Orchestrator logs.

- [x] **Step 2: VSB Friction Roll Verification**
Trigger a `crush wsa friction` command via CLI and use CDP to verify the resulting chat message and physical token manifestation in the Foundry renderer.

- [x] **Step 3: Neural Shroud Validation**
Invoke a "Heavy" intent and use CDP to verify that the `#neural-shroud-lock` div is successfully injected and removed from the Foundry DOM.

---

### Task 4: Surgical Debugging & Fix Loop

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts` (as needed)
- Modify: `foundry-module/foundry-api-bridge.js` (as needed)

- [x] **Step 1: Pattern Match Errors**
Analyze log output from Task 2 to identify recurring failures (e.g., VSB timeouts, malformed JSON from Node A).

- [x] **Step 2: Apply Inline Fixes**
Surgically update the identified code paths to handle the discovered edge cases.

- [x] **Step 3: Re-Validate**
Re-run the Synthetic Gauntlet (Task 3) to ensure the fixes are effective and no regressions were introduced.

---

### ◈ Completion Criteria
1. Full pass of the "Synthetic Gauntlet" without a single `ERROR` entry in `orchestrator.log`.
2. Verified physical injection of Pretext overlays and CSS filters via CDP.
3. 100% automated report generated showing system health across all communication layers (VSB, CDP, RPC).
