# Phase 73: Task 3 - Hermes-Kanban Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate task governance between git manifests and the Hermes Kanban board.

**Architecture:** A Go-based sync daemon that parses `IMPLEMENTATION_PLAN.md` and updates the Kanban board via REST API.

**Tech Stack:** Go, Git, REST API.

---

### Task 1: Sync Daemon Scaffolding (Go)

- [ ] **Step 1: Initialize Go Module**
Run: `cd scripts/ops/hermes-sync && go mod init hermes-sync`

- [ ] **Step 2: Implement Plan Parser**
Write a Go function to extract task status from `IMPLEMENTATION_PLAN.md` using regex.

- [ ] **Step 3: Implement Kanban API Client**
Write the HTTP client for `hermes-kanban` endpoints.

---

### Task 2: Git Hook Integration

- [ ] **Step 1: Create post-commit Hook**
File: `.git/hooks/post-commit`
```bash
#!/bin/bash
go run scripts/ops/hermes-sync/main.go --sync
```

- [ ] **Step 2: Verify Sync**
Commit a test change to `IMPLEMENTATION_PLAN.md` and check if the Kanban card moves.

---

### Task 3: Commit

- [ ] **Step 1: Commit Sync Logic**
```bash
git add scripts/ops/hermes-sync
git commit -m "feat(gov): implement auto-sync between manifest and Kanban"
```
