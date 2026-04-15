# PHASE 51: Sovereign Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish declarative identity, headless daemonization, and autonomous hardware monitoring with full gauntlet shard support.

**Architecture:** Nix-managed environment variables for identities, windowless Rust daemons with Mmap heartbeats, and a cron-based telemetry scraper.

---

### Task 1: Declarative Identity Forge

- [ ] **Step 1: Implement `nix/identities.nix`**
Move the content of `SOUL.md` and `AGENTS.md` into immutable Nix strings.

- [ ] **Step 2: Update `flake.nix` and `shellHook`**
Export strings as `SOVEREIGN_SOUL` and `SOVEREIGN_AGENTS` and force-write to files on shell entry.

- [ ] **Step 3: Create Shard 51.1: Identity-Verification**
Implement `scripts/gauntlet/phases/orch-51-1.ts`.
**Audit:** Verify `SOUL.md` and `AGENTS.md` are correctly manifest and match the Nix-exported environment variables.

- [ ] **Step 4: Commit**
```bash
git add nix/ flake.nix scripts/gauntlet/phases/orch-51-1.ts
git commit -m "feat: implement declarative identity and verification shard"
```

---

### Task 2: Headless Sidecar Pivot

- [ ] **Step 1: Refactor Rust Sidecars**
Implement `--headless` mode in `sidecar-atlas` and `sidecar-cyberdeck`.

- [ ] **Step 2: Implement Heartbeats**
Daemons MUST update Mmap slots (Indices 4000-4001) at >30Hz.

- [ ] **Step 3: Create Shard 51.2: Headless-Heartbeat**
Implement `scripts/gauntlet/phases/orch-51-2.ts`.
**Audit:** Probe Mmap slots 4000-4001 to ensure delta time is <100ms.
**onDrift:** 2-stage repair (SIGUSR1 -> Full Restart).

- [ ] **Step 4: Commit**
```bash
git add sidecar-atlas/ sidecar-cyberdeck/ scripts/gauntlet/phases/orch-51-2.ts
git commit -m "feat: implement headless sidecars and heartbeat shards"
```

---

### Task 3: Sovereign Pulse (Monitoring)

- [ ] **Step 1: Implement Telemetry Scraper**
Create `scripts/dev/sovereign-pulse.ts` to sample GPU/CPU usage.

- [ ] **Step 2: Create Shard 51.3: Pulse-Integrity**
Implement `scripts/gauntlet/phases/orch-51-3.ts`.
**Audit:** Verify `data/logs/vitals.log` exists and has been updated within the last 60 seconds.

- [ ] **Step 3: Commit**
```bash
git add scripts/dev/sovereign-pulse.ts scripts/gauntlet/phases/orch-51-3.ts
git commit -m "feat: implement autonomous pulse monitoring and integrity shard"
```

---

### Task 4: The Foundry Purge

- [ ] **Step 1: Remove Machina UI from Foundry**
Purge settings and escape menu buttons from `50v3r31gn-bridge.js`.

- [ ] **Step 2: Create Shard 51.4: Purge-Verification**
Implement `scripts/gauntlet/phases/purge-audit.ts`.
**Audit:** Fail if `Sovereign Bridge` settings are detected via CDP.

- [ ] **Step 3: Final Commit & Gauntlet Run**
```bash
git add 50v3r31gn-bridge/ scripts/gauntlet/phases/purge-audit.ts
git commit -m "chore: finalize Phase 51 Foundation"
```
