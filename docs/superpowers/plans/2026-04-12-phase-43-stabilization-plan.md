# Phase 43: Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate remaining bugs in the Ghost Boot sequence, Visual Dominance theme, and CLI interfaces to finalize system stability.

**Status: COMPLETED**

**Architecture:**
- **Foundry Mesh:** Monkey-patch PIXI for combat stability, fix ESC menu hook, and enforce theme on Journals/Items.
- **Crush CLI:** Redesign the VSB Auth Pane UI using `lipgloss` for a high-fidelity "Black-Ice" aesthetic.
- **Deck-Igniter:** Implement blocking sidecar compilation gates and automated Obsidian GUI ignition.

---

### Task 1: Visual Dominance & Mesh Fixes

- [x] **Step 1: Fix CombatBooster PIXI Crash**
Add PIXI v7 compatibility patch to `50v3r31gn-bridge.js`.
- [x] **Step 2: Robust Escape Menu Hook**
Update `renderMainMenu` to ensure the "Sovereign Mesh" button injects reliably in v12.
- [x] **Step 3: Enforce Dark Theme on Journals/Items**
Update `black-ice-theme.css` to override white backgrounds in Journal/Item sheets.
- [x] **Step 4: Verify in Live Session**
Run: `nix develop --command npx tsx scripts/sovereign-live-audit.ts`
Expected: 9/9 green, no white backgrounds.

---

### Task 2: Crush CLI Redesign (Black-Ice)

- [x] **Step 1: Redesign VSB Auth Pane**
Update `crush/auth_pane.go` with a new high-fidelity layout. Use `lipgloss` for structural brackets and a segmented info grid.
- [x] **Step 2: Standardize Input Loop**
Update Bubbletea loop to handle `Y/N` and `Enter/Esc` inputs with proper selection indicators.
- [x] **Step 3: Integrate with Proxy**
Ensure `RunAuthPane` is correctly triggered by `proxy.go`.

---

### Task 3: Deck-Igniter Supervisor Refinement

- [x] **Step 1: Blocking Sidecar Gating**
Update `launchSidecar` in `deck-igniter/launcher.go` to run `cargo build` if binaries are missing.
- [x] **Step 2: Automated Obsidian Ignition**
Add `launchObsidian` to the boot sequence using the `explorer.exe shell:AppsFolder\md.obsidian` pattern.
- [x] **Step 3: Recompile & Test Boot**
Run: `cd deck-igniter && go build -o ../deck-igniter-cli && cd ..`
Run: `./scripts/ghost-boot.sh`
Expected: Obsidian window appears, sidecars launch without health probe failure.

---

### Task 4: Final Stabilization Commit

- [x] **Step 1: Commit All Changes**
Run: `git add . && git commit -m "chore: phase 43 stabilization - theme fixes, cli redesign, boot gating"`
Run: `git push origin master`

---

### ◈ Post-Stabilization Additions (Strategist Directives)
- [x] **Interactive Terminal:** Implemented `crush-cli terminal` for direct 12B Brain comms.
- [x] **Semantic RKG Sync:** Reconstructed the Obsidian vault with hierarchical folders and semantic tags.
- [x] **Droid Factory:** Integrated `factory.ai` CLI via `steam-run` for NixOS compatibility.


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
