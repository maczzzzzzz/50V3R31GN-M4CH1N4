# Design: Black-Ice Theme Auditor

**Date:** 2026-04-03
**Status:** Approved
**Target:** Foundry VTT v12 / Cyberpunk RED 0.92.3 / asp-gm-bridge v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS

---

## Summary

A reusable TypeScript script that connects to the live Foundry Electron window via Chrome DevTools Protocol (port 9222), opens real character sheets, item sheets, and journals through the Foundry API, walks the rendered DOM to detect Black-Ice theme violations, and writes corrective CSS rules directly into `foundry-module/styles/black-ice-theme.css`.

---

## Architecture

**Entry point:** `scripts/theme-auditor.ts`
**Runtime:** `tsx scripts/theme-auditor.ts`
**Dependency:** `playwright-core` (already in `package.json`)

Three phases per run:
1. **Connect** — `playwright.chromium.connectOverCDP('http://localhost:9222')`, locate the Foundry page target by title/URL
2. **Scan** — open one sheet of each target type via `page.evaluate()` + Foundry API, walk live DOM, pull computed styles, collect violations
3. **Patch** — generate `@layer black-ice` CSS rules, write into `black-ice-theme.css`

### CLI Flags
- `--dry-run` — report violations to console, no file write
- `--target character|item|journal` — limit scan to one sheet type (default: all three)

---

## Violation Detection

### Black-Ice Palette (Ground Truth)
| Property | Allowed Values |
|---|---|
| `backgroundColor` | `rgb(0, 0, 0)`, `transparent`, `rgba(0,0,0,*)` |
| `color` | `rgb(255, 255, 255)`, `rgb(238, 238, 238)`, `rgb(255, 0, 60)` |
| `borderColor` | `rgb(255, 0, 60)`, `transparent` |

### DOM Walk
- `querySelectorAll('*')` on each open sheet container
- Skip elements where `display === 'none'` or `visibility === 'hidden'`
- Skip elements with no class (no stable selector can be built)
- For each visible element: `getComputedStyle()` → check the three properties above
- Record: `{ selector, property, actual, expected }`

### Selector Strategy
- Build `body.vtt .classA.classB` from `element.classList`
- Deduplicate: same selector + same property violation → one rule
- No positional selectors (`nth-child`, `nth-of-type`) — rules must apply to all instances

### Sheet Navigation (via `page.evaluate()`)
```js
// Character sheet
const actor = game.actors.find(a => a.type === 'character');
if (actor) { actor.sheet.render(true); }

// Item sheet
const item = game.items.contents[0];
if (item) { item.sheet.render(true); }

// Journal
const journal = game.journal.contents[0];
if (journal) { journal.sheet.render(true); }
```
After each `render(true)`, wait for the sheet DOM to stabilize before scanning.

---

## CSS Patcher

### Patch Block Format
```css
/* AUTO-PATCH: 2026-04-03 — theme-auditor */
body.vtt .cpr-some-class {
    background-color: #000000 !important;
    color: #ffffff !important;
    border-color: var(--cpr-red) !important;
}
/* END AUTO-PATCH */
```

### Insertion Point
Locate the closing `}` of the `@layer black-ice { ... }` block. Insert the patch block immediately before it.

### Re-run Behavior
On subsequent runs, find the existing `/* AUTO-PATCH: ... */` ... `/* END AUTO-PATCH */` block and replace it entirely. No duplication.

### Grouping
Violations are grouped by selector. One CSS rule per selector covers all flagged properties simultaneously.

---

## File Locations
| File | Purpose |
|---|---|
| `scripts/theme-auditor.ts` | Main auditor script |
| `foundry-module/styles/black-ice-theme.css` | Target CSS file (patched in-place) |

---

## Out of Scope
- Screenshot/visual diff (not needed — live Foundry window is directly observable)
- Automated module reload after patching (manual Foundry F5 required)
- Modifying existing hand-authored rules in `black-ice-theme.css`

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
