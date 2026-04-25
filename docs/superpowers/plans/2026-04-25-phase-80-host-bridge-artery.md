# Phase 79: Host-Mesh Artery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a secure VSB bridge between WSL2 and the Windows host for direct control.

**Architecture:** Go-native Windows sidecar (`machina-host.exe`) and a Rust/TS client on the WSL2 node.

**Tech Stack:** Go (Windows), VSB Protocol, UDP.

---

### Task 1: Machina-Host Scaffolding (Go/Windows)

- [ ] **Step 1: Initialize machina-host**
Run: `mkdir -p scripts/ops/machina-host && cd scripts/ops/machina-host && go mod init machina-host`

- [ ] **Step 2: Implement VSB UDP Listener**
Write logic to bind to the internal WSL virtual switch and parse VSB command packets.

- [ ] **Step 3: Implement Native Capabilities**
Implement the initial `GetProcessList` and `FocusWindow` commands using `golang.org/x/sys/windows`.

---

### Task 2: WSL Client Integration

- [ ] **Step 1: Update machina-hub**
Add a routing vector in the Go proxy to forward "Host-Scoped" intents to the Windows IP.

- [ ] **Step 2: Implement Tool call**
Materialize the `exec_host_command` tool in the Hermes HUD.

---

### Task 3: Commit & Sync

- [ ] **Step 1: Run Scribe**
```bash
npm run scribe
```

- [ ] **Step 2: Commit**
```bash
git add .
git commit -m "feat(host): materialize Phase 79 Host-Mesh Artery blueprints"
```


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
