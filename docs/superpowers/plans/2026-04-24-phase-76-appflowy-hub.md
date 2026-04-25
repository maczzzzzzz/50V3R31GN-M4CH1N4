# Phase 76: Task 4 - AppFlowy Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy AppFlowy Cloud as the structured project documentation hub on Node C.

**Architecture:** Nix-native backend deployment and Gruvbox theme hardening.

**Tech Stack:** Rust, Nix, PostgreSQL.

---

### Task 1: NixOS Backend Deployment

- [ ] **Step 1: Update flake.nix**
Add `appflowy-cloud` package and PostgreSQL dependency to the Node C environment.

- [ ] **Step 2: Initialize Artery of Truth**
Run: `sudo -u postgres psql -c "CREATE DATABASE appflowy;"`

- [ ] **Step 3: Deploy Service**
Scaffold and enable `docs/nixos/appflowy-cloud.service`.

---

### Task 2: Aesthetic Hardening

- [ ] **Step 1: Apply Gruvbox CSS**
Inject the **Gruvbox Dark (Medium)** palette into the AppFlowy web frontend / custom CSS settings.

---

### Task 3: Roadmap Artery

- [ ] **Step 1: Markdown Sync Script**
Scaffold `scripts/ops/appflowy-sync.ts` to push `IMPLEMENTATION_PLAN.md` tasks to the AppFlowy database via REST API.

---

### Task 4: Commit

- [ ] **Step 1: Commit Blueprints**
```bash
git add .
git commit -m "feat(docs): materialize AppFlowy hub integration blueprints"
```
