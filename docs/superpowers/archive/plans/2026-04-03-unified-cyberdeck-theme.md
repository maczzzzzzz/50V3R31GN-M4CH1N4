# Unified Cyberdeck Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Black-Ice palette to sidecar-atlas's egui chrome, add an `npm run crush` script, and fix the broken Crush CLI step in `ignite.ps1` so all system surfaces read as one unified cyberdeck.

**Architecture:** Three independent file edits. sidecar-atlas uses the egui `Visuals` struct to override all chrome colours. package.json gets a one-line script entry. ignite.ps1 gets its broken Crush step replaced. No new dependencies on any surface.

**Tech Stack:** Rust/egui 0.31/eframe 0.31 (sidecar-atlas), Node.js/npm (package.json), PowerShell (ignite.ps1).

---

### Task 1: sidecar-atlas — full Black-Ice egui Visuals

**Files:**
- Modify: `sidecar-atlas/src/main.rs:1-10` (imports)
- Modify: `sidecar-atlas/src/main.rs:106-109` (visuals block in `update()`)

**Context:** The file is 153 lines. The current `update()` sets only `panel_fill` in a 3-line visuals block at lines 106–108. We expand it to cover all chrome. `epaint` is re-exported as `egui::epaint` — no new Cargo dependency.

**Black-Ice palette constants used:**
```rust
// Already defined at top of file:
const RED: Color32 = Color32::from_rgb(0xff, 0x00, 0x3c);
// New values inlined:
// Surface  #050505 → Color32::from_rgb(5, 5, 5)
// TextMain #eeeeee → Color32::from_rgb(238, 238, 238)
// TextDim  #888888 → Color32::from_rgb(136, 136, 136)
// Inactive #222222 → Color32::from_rgb(34, 34, 34)
// Hover    #1a1a1a → Color32::from_rgb(26, 26, 26)
// CyanSel  rgba(255, 0, 60,40) → Color32::from_rgba_unmultiplied(255, 0, 60, 40)
```

- [ ] **Step 1: Add `epaint` to the use statement**

In `sidecar-atlas/src/main.rs`, locate line 2:
```rust
use egui::{CentralPanel, Color32, FontId, Pos2, Stroke};
```
Replace with:
```rust
use egui::{epaint, CentralPanel, Color32, FontId, Pos2, Stroke};
```

- [ ] **Step 2: Replace the visuals block in `update()`**

Locate lines 106–108 (inside `impl eframe::App for AtlasApp`, `fn update()`):
```rust
        let mut visuals = ctx.style().visuals.clone();
        visuals.panel_fill = Color32::from_rgb(0x05, 0x05, 0x05);
        ctx.set_visuals(visuals);
```
Replace with:
```rust
        let mut visuals = ctx.style().visuals.clone();

        // Backgrounds
        visuals.panel_fill           = Color32::from_rgb(5, 5, 5);
        visuals.window_fill          = Color32::BLACK;
        visuals.extreme_bg_color     = Color32::BLACK;
        visuals.faint_bg_color       = Color32::from_rgb(5, 5, 5);
        visuals.code_bg_color        = Color32::from_rgb(5, 5, 5);

        // Window chrome
        visuals.window_stroke        = Stroke::new(1.0, RED);
        visuals.window_shadow        = epaint::Shadow::NONE;
        visuals.popup_shadow         = epaint::Shadow::NONE;

        // Text
        visuals.override_text_color  = Some(Color32::from_rgb(238, 238, 238));

        // Widgets — noninteractive (labels, separators, frames)
        visuals.widgets.noninteractive.bg_fill      = Color32::from_rgb(5, 5, 5);
        visuals.widgets.noninteractive.weak_bg_fill = Color32::BLACK;
        visuals.widgets.noninteractive.bg_stroke    = Stroke::new(1.0, Color32::from_rgb(34, 34, 34));
        visuals.widgets.noninteractive.fg_stroke    = Stroke::new(1.0, RED);

        // Widgets — inactive (unhovered buttons etc.)
        visuals.widgets.inactive.bg_fill            = Color32::from_rgb(5, 5, 5);
        visuals.widgets.inactive.weak_bg_fill       = Color32::BLACK;
        visuals.widgets.inactive.fg_stroke          = Stroke::new(1.0, Color32::from_rgb(136, 136, 136));

        // Widgets — hovered
        visuals.widgets.hovered.bg_fill             = Color32::from_rgb(26, 26, 26);
        visuals.widgets.hovered.fg_stroke           = Stroke::new(1.5, RED);
        visuals.widgets.hovered.bg_stroke           = Stroke::new(1.0, RED);

        // Widgets — active (clicked)
        visuals.widgets.active.bg_fill              = Color32::BLACK;
        visuals.widgets.active.fg_stroke            = Stroke::new(2.0, RED);

        // Selection highlight
        visuals.selection.bg_fill    = Color32::from_rgba_unmultiplied(255, 0, 60, 40);
        visuals.selection.stroke     = Stroke::new(1.0, RED);

        ctx.set_visuals(visuals);
```

- [ ] **Step 3: Build to verify no compile errors**

```bash
cd sidecar-atlas && cargo build --release 2>&1
```
Expected: `Compiling sidecar-atlas` → `Finished release` with no errors. Warnings about unused variables are acceptable.

- [ ] **Step 4: Commit**

```bash
cd D:/50v3r31gn-m4ch1n4
git add sidecar-atlas/src/main.rs
git commit -m "feat(sidecar-atlas): apply full Black-Ice egui Visuals palette

Expands panel_fill-only visuals to cover all chrome: backgrounds,
window stroke, shadows, text, widget states, and selection highlight.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 2: package.json — add `npm run crush` script

**Files:**
- Modify: `package.json` (scripts section)

**Context:** Crush binary is at `C:\Users\macgr\go\bin\crush.exe` (in PATH). `.crush.json` in the project root is auto-discovered by Crush when run from cwd. No flags needed.

- [ ] **Step 1: Add the script entry**

Open `package.json`. Locate the `"scripts"` object. Add `"crush": "crush"` as an entry. Example — if scripts currently ends with:
```json
    "audit:theme": "tsx scripts/theme-auditor.ts"
  }
```
Change to:
```json
    "audit:theme": "tsx scripts/theme-auditor.ts",
    "crush": "crush"
  }
```

- [ ] **Step 2: Verify the script resolves**

```bash
npm run crush -- --version
```
Expected output: `crush version v3.4.2` (then exits — `--version` is non-interactive).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat(crush): add npm run crush script for project-root launch

Auto-discovers .crush.json from cwd — no flags required.

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 3: ignite.ps1 — fix Crush CLI launch step

**Files:**
- Modify: `ignite.ps1:29-30`

**Context:** The current step 5 does `cd crush; ./crush.exe run`. Two bugs: (1) `crush/` directory does not exist — binary is in PATH; (2) `run` subcommand is non-interactive single-shot mode, not the TUI. Fix: use `Set-Location` to project root and call `crush` with no subcommand.

- [ ] **Step 1: Replace the broken Crush step**

Locate lines 29–30 in `ignite.ps1`:
```powershell
Write-Host "⌨️ Igniting Crush CLI..."
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "cd crush; ./crush.exe run" -WindowStyle Normal
```
Replace with:
```powershell
Write-Host "⌨️ Igniting Crush CLI (Cyberdeck Control Plane)..." -ForegroundColor Cyan
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\50v3r31gn-m4ch1n4'; crush" -WindowStyle Normal
```

- [ ] **Step 2: Verify the file reads correctly**

Read `ignite.ps1` lines 28–32 and confirm:
- No reference to `cd crush` or `./crush.exe run`
- `Set-Location 'D:\50v3r31gn-m4ch1n4'` present
- `crush` called with no subcommand

- [ ] **Step 3: Commit**

```bash
git add ignite.ps1
git commit -m "fix(ignite): correct Crush CLI launch — use PATH binary and interactive TUI

Was: cd crush; ./crush.exe run  (wrong dir, non-interactive mode)
Now: Set-Location project root; crush  (PATH binary, TUI mode)

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---


---
**LINKS:** [[OS_CORE]]
