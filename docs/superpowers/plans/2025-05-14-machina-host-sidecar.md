# Machina-Host Sidecar (Go/Windows) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish direct control of the Windows host environment via a secure VSB sidecar in Go.

**Architecture:** A native Go executable running on the Windows host, listening for VSB binary packets over UDP. It implements strict filesystem gating and visual redaction logic.

**Tech Stack:** Go (Standard Library, `golang.org/x/sys/windows` for native APIs), VSB Protocol.

---

### Task 1: Module Initialization & VSB Types

**Files:**
- Create: `scripts/ops/sovereign-host/go.mod`
- Create: `scripts/ops/sovereign-host/protocol/vsb.go`
- Test: `scripts/ops/sovereign-host/protocol/vsb_test.go`

- [ ] **Step 1: Initialize Go module**
Run: `mkdir -p scripts/ops/sovereign-host && cd scripts/ops/sovereign-host && go mod init sovereign-host`

- [ ] **Step 2: Define VSB types in Go**
Mirror `src/shared/vsb_protocol.ts` structure.

- [ ] **Step 3: Write VSB codec tests**
Verify magic, version, and checksum logic.

- [ ] **Step 4: Commit**

### Task 2: VSB UDP Listener

**Files:**
- Create: `scripts/ops/sovereign-host/server/udp.go`
- Modify: `scripts/ops/sovereign-host/main.go`

- [ ] **Step 1: Implement UDP listener loop**
Listen on port 7878.

- [ ] **Step 2: Implement packet dispatcher**
Route `IntentPacket` to handlers based on `IntentType`.

- [ ] **Step 3: Commit**

### Task 3: FS Gate (Option C)

**Files:**
- Create: `scripts/ops/sovereign-host/fsgate/gate.go`
- Test: `scripts/ops/sovereign-host/fsgate/gate_test.go`

- [ ] **Step 1: Implement path validation logic**
Enforce `D:\Sovereign_Workspace\` root and `/scratch/` restrictions.

- [ ] **Step 2: Implement Hidden/System attribute setter**
Use `golang.org/x/sys/windows` (mocked for non-Windows).

- [ ] **Step 3: Write FS Gate tests**
Verify traversal blocking.

- [ ] **Step 4: Commit**

### Task 4: Visual Redaction Logic

**Files:**
- Create: `scripts/ops/sovereign-host/redactor/redactor.go`
- Test: `scripts/ops/sovereign-host/redactor/redactor_test.go`

- [ ] **Step 1: Implement window title detection**
Check for protected titles like `Code.exe`.

- [ ] **Step 2: Implement redaction mask logic**
Abstracted logic to mark regions for masking.

- [ ] **Step 3: Commit**

### Task 5: Capability Handlers

**Files:**
- Create: `scripts/ops/sovereign-host/handlers/process.go`
- Create: `scripts/ops/sovereign-host/handlers/window.go`
- Create: `scripts/ops/sovereign-host/handlers/file.go`

- [ ] **Step 1: Implement `GetProcessList`**
- [ ] **Step 2: Implement `FocusWindow`**
- [ ] **Step 3: Implement `WriteScratchFile`**
- [ ] **Step 4: Wire handlers to dispatcher**
- [ ] **Step 5: Commit**

### Task 6: Final Integration & Verification

- [ ] **Step 1: Wire all components in `main.go`**
- [ ] **Step 2: Run all tests**
- [ ] **Step 3: Final commit**
