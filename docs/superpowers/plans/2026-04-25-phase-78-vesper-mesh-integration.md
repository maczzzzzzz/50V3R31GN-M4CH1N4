# Phase 78: Vesper Mesh Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a persistent background agency layer that integrates Vesper Shadow Mode with the Hermes Mesh.

**Architecture:** Go-based orchestrator daemon, Rust-based perception sidecar, and TypeScript-based HUD bridge.

**Tech Stack:** Go, Rust, TypeScript, systemd.

---

### Task 1: The Vesper Orchestrator (Go)

- [ ] **Step 1: Initialize Vesper-Go**
Run: `mkdir -p scripts/ops/vesper-daemon && cd scripts/ops/vesper-daemon && go mod init vesper-daemon`

- [ ] **Step 2: Implement Heartbeat Watchdog**
Write logic to monitor `data/logs/vsb-traffic.log` and trigger a `SIGTERM` after 30 minutes of user activity to hibernate Vesper.

- [ ] **Step 3: Implement Flush Gate Client**
Write the Go client that polls `SovereignIntelligence.db` for approved background proposals.

---

### Task 2: The Perception Sidecar (Rust)

- [ ] **Step 1: Scaffold sovereign-vesper-eye**
Create a new Rust crate `crates/sovereign-vesper-eye` with dependencies on `tesseract` (OCR) and `notify` (File watching).

- [ ] **Step 2: Implement Pattern Matcher**
Write logic to scan the terminal canvas for "Scribe" drift and log it as a triplet proposal.

---

### Task 3: The Emergence Gateway (TS)

- [ ] **Step 1: Update LangGraphOrchestrator**
Modify `src/core/hermes/LangGraphOrchestrator.ts` to include the `vesper_emergence` tool call.

- [ ] **Step 2: Implement Glitch UI Effect**
Add a CSS-based "glitch" animation to the Hermes TUI components that triggers when Vesper siphons data.

---

### Task 4: Commit & Sync

- [ ] **Step 1: Run Scribe**
```bash
npm run scribe
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat(vesper): materialize Phase 78 Mesh Integration blueprints"
```
