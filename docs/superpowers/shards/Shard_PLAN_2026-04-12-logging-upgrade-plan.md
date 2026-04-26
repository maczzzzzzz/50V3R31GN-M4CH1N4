# 50V3R31GN-M4CH1N4 // LOGGING UPGRADE PLAN

**Goal:** Centralize and enhance error logging to capture live Gauntlet test results and provide a unified observability stream for the Sovereign Machina.

## Task 1: Unified Logger Enhancements
- [ ] **Phase 1: Update `src/shared/logger.ts`**
  - Add `audit(result: AuditResult)` method to log structured gauntlet results.
  - Add `manifest(phaseId: number, status: string, data?: any)` for control events.
- [ ] **Phase 2: Update `scripts/gauntlet/engine.ts`**
  - Integrate with the main `logger` instance to stream results during the run.
  - Add a flag to "Upload" results to the running Orchestrator via WebSocket.

## Task 2: Mesh Error Capture
- [ ] **Phase 1: Implement `showErrorOverlay` in `50v3r31gn-bridge.js`**
  - Capture JS errors in Foundry and report them back to Node B via WebSocket.
  - Render critical gauntlet failures as in-game "S1GN4L_L055" overlays.

## Task 3: Unified Observability Script
- [ ] **Phase 1: Create `scripts/watch-sovereign.sh`**
  - A multi-tail script that combines `orchestrator.log`, `crush.log`, and live Gauntlet stream.
  - Highlights `ERROR` and `FAIL` statuses in Red.

## Task 4: Shard Detail Capture
- [ ] **Phase 1: Update all Block Shards**
  - DATA, MECHANICAL, ORCHESTRATION, VISUAL, NARRATIVE.
  - Ensure every `fail()` and `warn()` call includes full context data for the logger.

---
*Plan Issued by Gemini CLI (Strategist).*


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
