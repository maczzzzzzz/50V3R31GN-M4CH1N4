# Phase 28 — Total Environment Dominance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish 100% physical sovereignty over Foundry VTT and the Nix shell via CDP and Sidecar manipulation.

**Architecture:** Implement the Ghost Protocol (CDP Input Domain) in TypeScript, the Scenario Engine in Go, and expanded NixOS controls in the Rust sidecars.

**Tech Stack:** TypeScript (CDP), Go (CLI/Concurrency), Rust (OS-Control).

---

### Task 1: Phase 27 Remediation & Auditor Integration

**Files:**
- Modify: `src/main.ts`
- Modify: `src/core/hybrid-routing-controller.ts`

- [ ] **Step 1: Wire `AkashikVisualAuditor` into `main.ts`**
- [ ] **Step 2: Add `audit_library` command to HRC to trigger VLM lore extraction**
- [ ] **Step 3: Verify VLM barks are actually appearing in the library**

---

### Task 2: Ghost Protocol (Synthetic Input)

**Files:**
- Modify: `src/core/visual-monitor-service.ts`
- Create: `src/core/ghost-input-service.ts`

- [ ] **Step 1: Enable `Input` domain in CDP connection**
- [ ] **Step 2: Implement `dispatchClick(x, y)` and `dispatchKey(key)`**
- [ ] **Step 3: Implement `dragToken(tokenId, targetX, targetY)`**
- [ ] **Step 4: Commit**

---

### Task 3: DevDom CLI & Scenario Engine

**Files:**
- Modify: `crush/main.go`
- Create: `crush/devdom.go`

- [ ] **Step 1: Implement `crush devdom` subcommand**
- [ ] **Step 2: Implement `.ghost` JSON sequence parser and replayer**
- [ ] **Step 3: Add `crush chaos network --latency <ms>` command**
- [ ] **Step 4: Commit**

---

### Task 4: Hardware-Level Sovereignty

**Files:**
- Modify: `sidecar-cyberdeck/src/main.rs`

- [ ] **Step 1: Implement `tokio::process` calls for NixOS flake rebuilds**
- [ ] **Step 2: Add a "System Control" panel to the `DECK` tab**
- [ ] **Step 3: Implement remote Node A reboot trigger (via SSH bridge)**
- [ ] **Step 4: Commit**

---

### Task 5: Final Integration & Audit

- [ ] **Step 1: Run full system boot**
- [ ] **Step 2: Perform a "Ghost Move" via CLI and verify in Foundry**
- [ ] **Step 3: Force a system rebuild from the Rust HUD**
- [ ] **Step 4: Generate a Visual Audit Report**
