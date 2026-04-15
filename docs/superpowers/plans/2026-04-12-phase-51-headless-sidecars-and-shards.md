# PHASE 51: Headless Sidecars & Shard Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decommission legacy EGUIs and evolve the Gauntlet into a headless-aware auditing suite.

**Architecture:** Rust sidecars are converted to windowless daemons; existing Gauntlet shards are refactored to probe VSB memory and ensure zero Machina UI in Foundry.

---

### Task 1: Headless Rust Transition

- [ ] **Step 1: Implement `--headless` flag in `sidecar-atlas` and `sidecar-cyberdeck`**
Refactor `main.rs` to run the state loop without spawning an `eframe` window.

- [ ] **Step 2: Implement `DAEMON_HEARTBEAT` in sidecars**
Ensure daemons update a dedicated Mmap slot at >30Hz to signal liveness.

- [ ] **Step 3: Commit**
```bash
git add sidecar-atlas/src/main.rs sidecar-cyberdeck/src/main.rs
git commit -m "feat: convert Rust sidecars into headless daemons"
```

---

### Task 2: The UI Purge (Foundry Restoration)

- [ ] **Step 1: Remove `Sovereign Bridge` button and Monitor iframe**
Clean up `50v3r31gn-bridge.js` to remove all non-environmental UI elements.

- [ ] **Step 2: Commit**
```bash
git add 50v3r31gn-bridge/
git commit -m "chore: purge intrusive Machina UI from Foundry VTT"
```

---

### Task 3: Shard Evolution (Headless Audits)

- [ ] **Step 1: Create `scripts/gauntlet/phases/purge-audit.ts` (Phase 52)**
Implement an audit that fails if it detects the `Sovereign Bridge` button via CDP.

- [ ] **Step 2: Refactor `orch-block.ts` for Headless Heartbeats**
Update Phase 4 and 24 to check Mmap slots instead of window handles.

- [ ] **Step 3: Commit**
```bash
git add scripts/gauntlet/phases/
git commit -m "feat: evolve Gauntlet shards for headless and purged environments"
```

---

### Task 4: Declarative Identity & Soul Logger

- [ ] **Step 1: Implement Declarative SOUL.md in `flake.nix`**
Move core agentic directives into the Nix flake to ensure identity persistence across rebuilds.

- [ ] **Step 2: Implement Icarus-style Soul Logger**
Create a background service that captures high-signal agent decisions and logs them to `SOUL.jsonl` with `training_value` tags.

- [ ] **Step 3: Commit**
```bash
git add flake.nix src/core/soul-logger.ts
git commit -m "feat: implement declarative identity and soul logging"
```

---

### Task 5: The Skill Factory (Shard Distillation)

- [ ] **Step 1: Implement Pattern Watcher on Node B**
Create a script that monitors session logs for repeated successful cycles.

- [ ] **Step 2: Implement Automated Shard Proposer**
Enable Node B to generate and propose new `SKILL.md` shards based on detected patterns.

- [ ] **Step 3: Commit**
```bash
git add scripts/forge/skill-factory.ts
git commit -m "feat: implement autonomous shard distillation forge"
```

---

### Task 6: Final Validation

- [ ] **Step 1: Run Full Gauntlet Audit**
Verify that all shards pass in the new headless state.

- [ ] **Step 2: Commit**
```bash
git commit -m "chore: finalize Phase 51 Headless Transition"
```
