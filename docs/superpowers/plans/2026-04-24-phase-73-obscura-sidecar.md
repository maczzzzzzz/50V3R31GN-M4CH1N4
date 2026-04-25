# Phase 73: Task 2 - Obscura Stealth Sidecar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Rust-based Obscura browser as a lightweight, stealthy sensory ingress on Node C.

**Architecture:** Compilation of the Obscura binary, deployment as a systemd service, and wiring into the Rust bridge.

**Tech Stack:** Rust, Systemd, Nix.

---

### Task 1: Binary Compilation & Nix Scaffolding

- [ ] **Step 1: Update flake.nix**
Add `obscura` build inputs and dependencies to the project's `flake.nix`.

- [ ] **Step 2: Compile Obscura**
Run: `nix build .#obscura` (or manual cargo build if outside flake).

- [ ] **Step 3: Verify Binary**
Run: `./result/bin/obscura --version`

---

### Task 2: Systemd Sidecar Deployment

- [ ] **Step 1: Create Unit File**
File: `docs/nixos/obscura-sidecar.service`
```ini
[Unit]
Description=Obscura Stealth Browser Sidecar
After=network.target

[Service]
ExecStart=/path/to/obscura --stealth --headless --port 9222
Restart=always
User=nixos

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 2: Deploy Service**
Run: `sudo ln -s /path/to/docs/nixos/obscura-sidecar.service /etc/systemd/system/`
Run: `sudo systemctl enable --now obscura-sidecar`

- [ ] **Step 3: Verify CDP Port**
Run: `curl http://localhost:9222/json/version`
Expected: 200 OK with browser metadata.

---

### Task 3: Mesh Integration

- [ ] **Step 1: Update sovereign-observer**
Modify the Rust observer to point its CDP client to `localhost:9222` instead of a local Chromium instance.

- [ ] **Step 2: Commit**
```bash
git commit -m "feat(stealth): deploy Obscura sidecar and wire into observer"
```
