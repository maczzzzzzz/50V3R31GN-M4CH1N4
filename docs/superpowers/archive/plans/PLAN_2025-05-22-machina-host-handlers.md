# Machina-Host Sidecar Handlers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement capability handlers (Process List, Focus Window, Write File) and the main entry point for the Machina-Host Sidecar.

**Architecture:** 
- Modular handlers in `handlers/` package.
- Integration with `fsgate` for secure file access.
- Windows-specific logic gated behind build tags or `os/exec` fallbacks.
- Centralized `main.go` using the `server` and `protocol` packages.

**Tech Stack:** Go, Windows APIs (via `golang.org/x/sys/windows` or `os/exec`), UDP.

---

### Task 1: Process List Handler

**Files:**
- Create: `scripts/ops/sovereign-host/handlers/process.go`

- [ ] **Step 1: Implement GetProcessList handler**
Implement a function that runs `tasklist /FO CSV /NH` and parses the output into a string.
- [ ] **Step 2: Return ResultPacket**
Map the process list string to the `Payload` of a `ResultPacket`.

### Task 2: Window Focus Handler

**Files:**
- Create: `scripts/ops/sovereign-host/handlers/window.go`

- [ ] **Step 1: Implement FocusWindow handler**
Use `FindWindow` and `SetForegroundWindow` from `user32.dll` (via `syscall` or `x/sys/windows`).
Provide a Unix-compatible fallback (NOP or log) for testing.

### Task 3: File Write Handler

**Files:**
- Create: `scripts/ops/sovereign-host/handlers/file.go`

- [ ] **Step 1: Implement WriteScratchFile handler**
Integrate with `fsgate.Gate` to validate that the path is within `/scratch/`.
- [ ] **Step 2: Secure Write**
Write the payload to the validated path.

### Task 4: Main Entry Point

**Files:**
- Create: `scripts/ops/sovereign-host/main.go`

- [ ] **Step 1: Initialize Gate and Server**
- [ ] **Step 2: Register Handlers**
- [ ] **Step 3: Start Server**

### Task 5: Verification and Sync

- [ ] **Step 1: Build and Verify**
Run `go build` to ensure all imports and types are correct.
- [ ] **Step 2: Manifest Sync**
Run `npm run scribe` if necessary.
- [ ] **Step 3: Commit Changes**
