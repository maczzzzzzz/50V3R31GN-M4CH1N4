# Design: Unified Cyberdeck Theme

**Date:** 2026-04-03
**Status:** Approved
**Surfaces:** sidecar-atlas (egui), package.json, ignite.ps1

---

## Summary

Apply a coat-of-paint pass to make all system surfaces — Foundry VTT, sidecar-atlas GUI, and Crush CLI launcher — read as one unified "cyberdeck" running the Black-Ice palette. Foundry CSS is already complete. This spec covers the two remaining surfaces: sidecar-atlas egui visuals and Crush CLI launch wiring.

---

## Shared Palette (Source of Truth)

Derived from `foundry-module/styles/black-ice-theme.css` `:root` variables.

| Token | Hex | egui Color32 |
|---|---|---|
| Background | `#000000` | `Color32::from_rgb(0, 0, 0)` |
| Surface | `#050505` | `Color32::from_rgb(5, 5, 5)` |
| Cyan accent | `#00f3ff` | `Color32::from_rgb(0, 243, 255)` |
| Text main | `#eeeeee` | `Color32::from_rgb(238, 238, 238)` |
| Text dim | `#888888` | `Color32::from_rgb(136, 136, 136)` |
| Border inactive | `#222222` | `Color32::from_rgb(34, 34, 34)` |
| Hover surface | `#1a1a1a` | `Color32::from_rgb(26, 26, 26)` |
| Cyan selection | `rgba(0,243,255,40)` | `Color32::from_rgba_unmultiplied(0, 243, 255, 40)` |

---

## Change 1: sidecar-atlas egui Visuals

**File:** `sidecar-atlas/src/main.rs`
**Approach:** Expand the existing `ctx.set_visuals()` block in `AtlasApp::update()`.

Replace the current single-field visuals block with the full palette override:

```rust
let mut visuals = ctx.style().visuals.clone();

// Backgrounds
visuals.panel_fill           = Color32::from_rgb(5, 5, 5);
visuals.window_fill          = Color32::BLACK;
visuals.extreme_bg_color     = Color32::BLACK;
visuals.faint_bg_color       = Color32::from_rgb(5, 5, 5);
visuals.code_bg_color        = Color32::from_rgb(5, 5, 5);

// Window chrome
visuals.window_stroke        = Stroke::new(1.0, CYAN);
visuals.window_shadow        = epaint::Shadow::NONE;
visuals.popup_shadow         = epaint::Shadow::NONE;

// Text
visuals.override_text_color  = Some(Color32::from_rgb(238, 238, 238));

// Widgets — noninteractive
visuals.widgets.noninteractive.bg_fill      = Color32::from_rgb(5, 5, 5);
visuals.widgets.noninteractive.weak_bg_fill = Color32::BLACK;
visuals.widgets.noninteractive.bg_stroke    = Stroke::new(1.0, Color32::from_rgb(34, 34, 34));
visuals.widgets.noninteractive.fg_stroke    = Stroke::new(1.0, CYAN);

// Widgets — inactive
visuals.widgets.inactive.bg_fill            = Color32::from_rgb(5, 5, 5);
visuals.widgets.inactive.weak_bg_fill       = Color32::BLACK;
visuals.widgets.inactive.fg_stroke          = Stroke::new(1.0, Color32::from_rgb(136, 136, 136));

// Widgets — hovered
visuals.widgets.hovered.bg_fill             = Color32::from_rgb(26, 26, 26);
visuals.widgets.hovered.fg_stroke           = Stroke::new(1.5, CYAN);
visuals.widgets.hovered.bg_stroke           = Stroke::new(1.0, CYAN);

// Widgets — active (clicked)
visuals.widgets.active.bg_fill              = Color32::BLACK;
visuals.widgets.active.fg_stroke            = Stroke::new(2.0, CYAN);

// Selection
visuals.selection.bg_fill    = Color32::from_rgba_unmultiplied(0, 243, 255, 40);
visuals.selection.stroke     = Stroke::new(1.0, CYAN);

ctx.set_visuals(visuals);
```

`epaint` is available as `eframe::egui::epaint` — no new dependencies.

---

## Change 2: Crush CLI npm script

**File:** `package.json`

Add to `scripts`:
```json
"crush": "crush"
```

Crush auto-discovers `.crush.json` when run from the project root. The existing `.crush.json` has MCP servers, Ollama provider, and Mistral-Nemo baked in.

---

## Change 3: ignite.ps1 Crush step fix

**File:** `ignite.ps1`

**Current (broken):**
```powershell
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "cd crush; ./crush.exe run" -WindowStyle Normal
```

**Replace with:**
```powershell
Write-Host "⌨️ Igniting Crush CLI (Cyberdeck Control Plane)..." -ForegroundColor Cyan
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location 'D:\asp-gm-agent'; crush" -WindowStyle Normal
```

Fixes two bugs: wrong directory (`crush/` doesn't exist), wrong mode (`run` is non-interactive — omitting the subcommand launches the interactive TUI).

---

## Out of Scope

- Crush CLI TUI palette (no theme config in crush.json schema — Charm hardcodes it)
- sidecar-atlas layout, font sizes, or UI structure (future iteration)
- Windows Terminal color profile (separate concern)

---

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
