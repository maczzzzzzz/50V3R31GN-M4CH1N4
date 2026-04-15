# Implementation Plan: 0B51D14N_V1510N & R3D_V01D Unification

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this task-by-task.

**Goal:** Finalize the Phase 37 Obsidian Vault integration and unify all project UI themes (Obsidian, VS Code, Dashboard, Foundry) into the **R3D_V01D** aesthetic.

---

### Task 1: Master Theme & Font Scaffolding
- [ ] **Step 1: Create Master CSS**
Define `src/shared/sovereign-theme.css` with the shared hex colors (#0a0a0a, #ff1a1a, #440000) and CSS variables.

- [ ] **Step 2: Declare Nix Fonts**
Update `flake.nix` or the dev shell to ensure `VT323`, `Hack`, and `JetBrains Mono` are available to the WSLg X-server and the monorepo.

- [ ] **Step 3: Commit**
```bash
git add src/shared/ flake.nix
git commit -m "feat(theme): Initialize THE_M4573R_7H3M3 [R3D_V01D] and font-scaffolding"
```

---

### Task 2: VS Code Unification [DAILY_DR1V3R]
- [ ] **Step 1: Apply Workspace Settings**
Create/Modify `.vscode/settings.json`. Inject the `workbench.colorCustomizations` and `editor.tokenColorCustomizations` identified in the research.

- [ ] **Step 2: Set Font Preferences**
Configure VS Code to prefer `JetBrains Mono` for standard code and `VT323` for Markdown previews (via `markdown.preview.fontFamily`).

- [ ] **Step 3: Commit**
```bash
git add .vscode/settings.json
git commit -m "feat(vscode): Align workspace UI with R3D_V01D theme"
```

---

### Task 3: Obsidian Vault Hardening [WSLg_5YNC]
- [ ] **Step 1: Configure Obsidian Snippets**
Physicalize `data/vault/RKG/.obsidian/snippets/sovereign-machina-red-black.css`. This snippet must include the `.provenance-machine` (VT323) and `.provenance-human` classes.

- [ ] **Step 2: Sync Sync-Engine with Snippets**
Update the `Akashik-Sync-Engine` (src/core/obsidian-sync-service.ts) to automatically inject these classes into machine-generated Markdown frontmatter/content.

- [ ] **Step 3: Commit**
```bash
git add data/vault/RKG/.obsidian/ src/core/obsidian-sync-service.ts
git commit -m "feat(obsidian): Inject L337_PROV3N4NC3 styling and black/red theme"
```

---

### Task 4: Dashboard & Foundry Synchronization
- [ ] **Step 1: Dashboard Theme Injection**
Update `dashboard/app/globals.css` to import `src/shared/sovereign-theme.css`.

- [ ] **Step 2: Foundry CSS Layers**
Inject the Sovereign Red variables into the Foundry module's `styles/` directory.

- [ ] **Step 3: Commit**
```bash
git add dashboard/ foundry-module/
git commit -m "feat(ui): Unify Dashboard and Foundry with R3D_V01D artery"
```

---

### Task 5: Final Loop Verification
- [ ] **Step 1: Verify Bidirectional Sync**
Edit a note in VS Code (Remote-WSL). Confirm it reflects in the `Akashik.db` and updates correctly in the Obsidian (WSLg) UI.

- [ ] **Step 2: Verify Seal Integrity**
Run `crush vault seal` on the vault. Confirm that all `.md` files are encrypted into PNG shards and no cleartext remains in the git-tracked history.

- [ ] **Step 3: Final Commit & Standby**
```bash
git status
git commit -m "chore(phase-37): Finalize 0B51D14N_V1510N and UI unification"
```
