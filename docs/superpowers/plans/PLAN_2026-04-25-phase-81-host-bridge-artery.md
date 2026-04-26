# Phase 81: Host-Mesh Artery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a secure, capable, and shrouded VSB bridge to the Windows host.

---

### Task 1: Machina-Host Sidecar (Go/Windows)
- [ ] **1.1. Initialize `scripts/ops/sovereign-host/`:** `go mod init sovereign-host`.
- [ ] **1.2. Implement VSB UDP Listener (Port 7878):** Handle incoming binary command packets.
- [ ] **1.3. Implement Visual Redaction:** Logic to detect protected window titles (`Code.exe`, etc.) and mask them in screen-cap stream.
- [ ] **1.4. Implement FS Gate (Option C):** 
    - Enforce `D:\Sovereign_Workspace\` root.
    - Block traversal/deletion outside `/scratch/`.
    - Mark source directory as Hidden/System.
- [ ] **1.5. Implement Capability Handlers:** `GetProcessList`, `FocusWindow`, `WriteScratchFile`.

### Task 2: Web Artery & Content Distillation (TS)
- [ ] **2.1. Materialize `WebScraperSidecar.ts`:** Node B service for Tier 3 content distillation (Stripped Scrape).
- [ ] **2.2. Implement Tiered Ingress Logic:** 
    - Tier 1: Comms (Read-Only).
    - Tier 2: Media (Sandboxed Search).
    - Tier 3: Research (Distilled Markdown).

### Task 3: Artery & Gauntlet Integration
- [ ] **3.1. Update `LangGraphOrchestrator.ts`:** Complete the `/host` command routing to VSB packets.
- [ ] **3.2. Materialize `gauntlet/phases/v81-host.ts`:** 
    - Test path-traversal blocking.
    - Test visual redaction masking.
    - Test HMAC command signing.

---

## 🏗️ Technical Step-by-Step

- [ ] **Step 1: Run Scribe**
```bash
npm run scribe
```

- [ ] **Step 2: Commit Blueprints**
```bash
git add .
git commit -m "feat(host): materialize refined Phase 81 Host-Mesh blueprints"
```

---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
