# Header Contrast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--cpr-bg-header: #1a1a1a` to the black-ice theme and apply it to all header backgrounds (sections 2 and 2b) so headers lift off the pitch-black body.

**Architecture:** Two-file edit. One new CSS variable + two property value swaps in `black-ice-theme.css`. One new entry in `violation-detector.ts`'s `ALLOWED_BG_SET` so the theme auditor doesn't flag the intentional charcoal as a violation.

**Tech Stack:** CSS (`foundry-module/styles/black-ice-theme.css`), TypeScript (`scripts/lib/violation-detector.ts`), theme auditor (`tsx scripts/theme-auditor.ts --dry-run`) for regression check.

---

### Task 1: Add `--cpr-bg-header` variable to `:root`

**Files:**
- Modify: `foundry-module/styles/black-ice-theme.css:10-21`

- [ ] **Step 1: Add the variable**

In `foundry-module/styles/black-ice-theme.css`, locate the `:root` block (lines 10–21). Add `--cpr-bg-header` on the line after `--cpr-bg-dark-grey`:

```css
    :root {
        --cpr-bg-black: #000000;
        --cpr-bg-dark-grey: #050505;
        --cpr-bg-header: #1a1a1a;
        --cpr-red: #ff003c;
        --cpr-white: #ffffff;
        --cpr-text-main: #eeeeee;
        --black-ice-glow: 0 0 10px rgba(255, 0, 60, 0.8);
        
        /* Neutralize system variables */
        --cpr-red: #000000 !important;
        --cpr-red-dark: #000000 !important;
    }
```

- [ ] **Step 2: Commit**

```bash
git add foundry-module/styles/black-ice-theme.css
git commit -m "feat(theme): add --cpr-bg-header #1a1a1a variable to black-ice :root

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 2: Apply `--cpr-bg-header` to section 2 (class-based headers)

**Files:**
- Modify: `foundry-module/styles/black-ice-theme.css:47-66`

- [ ] **Step 1: Update section 2 background**

Locate the `/* 2. HEADER SUPREMACY */` rule block (lines 47–66). Change `background: #000000` to `background: var(--cpr-bg-header)`:

```css
    /* 2. HEADER SUPREMACY (Glowing Cyan Top-Line) */
    body.vtt h1, body.vtt h2, body.vtt h3, body.vtt h4, body.vtt h5, body.vtt h6,
    body.vtt .window-title,
    body.vtt .header,
    body.vtt .header-label,
    body.vtt .attribute-label,
    body.vtt .resource-label,
    body.vtt .charname,
    body.vtt .folder-header,
    body.vtt .section-header,
    body.vtt .tab-label,
    body.vtt .cpr-header,
    body.vtt .title,
    body.vtt th {
        color: var(--cpr-red) !important;
        text-shadow: var(--black-ice-glow) !important;
        background: var(--cpr-bg-header) !important;
        border-bottom: 1px solid var(--cpr-red) !important;
        text-transform: uppercase !important;
        padding: 4px 8px !important;
    }
```

- [ ] **Step 2: Commit**

```bash
git add foundry-module/styles/black-ice-theme.css
git commit -m "feat(theme): apply --cpr-bg-header to section 2 class-based headers

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 3: Apply `--cpr-bg-header` to section 2b (`<header>` HTML elements)

**Files:**
- Modify: `foundry-module/styles/black-ice-theme.css:68-81`

- [ ] **Step 1: Update section 2b background**

Locate the `/* 2b. HEADER ELEMENT SOVEREIGNTY */` rule block (lines 68–81). Change `background-color: #000000` to `background-color: var(--cpr-bg-header)`:

```css
    /* 2b. HEADER ELEMENT SOVEREIGNTY (Live Audit v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
       <header> HTML elements — directory panels, combat tracker, playlists,
       window titlebars — are not covered by class selectors above. */
    body.vtt header.directory-header,
    body.vtt header.combat-tracker-header,
    body.vtt header.playlist-header,
    body.vtt header#ui-top,
    body.vtt header.window-header {
        color: var(--cpr-red) !important;
        background-color: var(--cpr-bg-header) !important;
        background-image: none !important;
        border-bottom: 1px solid var(--cpr-red) !important;
        text-shadow: var(--black-ice-glow) !important;
    }
```

- [ ] **Step 2: Commit**

```bash
git add foundry-module/styles/black-ice-theme.css
git commit -m "feat(theme): apply --cpr-bg-header to section 2b <header> elements

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 4: Whitelist `#1a1a1a` in the theme auditor violation detector

**Files:**
- Modify: `scripts/lib/violation-detector.ts:24-32`

`#1a1a1a` = `rgb(26, 26, 26)`. Without this entry, the theme auditor will flag every header as a background violation after the CSS change — because `ALLOWED_BG_SET` currently only allows `#000000`, `#050505`, and a few specific near-blacks. The charcoal is intentional, so it must be whitelisted.

- [ ] **Step 1: Add `rgb(26, 26, 26)` to `ALLOWED_BG_SET`**

In `scripts/lib/violation-detector.ts`, locate `ALLOWED_BG_SET` (lines 24–32). Add one entry:

```typescript
const ALLOWED_BG_SET = new Set([
  'rgb(0, 0, 0)',       // #000000 — primary bg
  'rgba(0, 0, 0, 0)',   // transparent
  'transparent',
  '',
  'rgb(5, 5, 5)',       // #050505 — --cpr-bg-dark-grey (inactive tab/button bg)
  'rgb(13, 11, 12)',    // near-black — CPR system header bg (acceptable dark)
  'rgb(68, 68, 68)',    // #444 — window resize handle
  'rgb(26, 26, 26)',    // #1a1a1a — --cpr-bg-header (intentional header contrast)
]);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/violation-detector.ts
git commit -m "feat(auditor): whitelist #1a1a1a header contrast bg in violation detector

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

### Task 5: Regression check via theme auditor

**Files:**
- Read: `foundry-module/styles/black-ice-theme.css` (verify final state)

- [ ] **Step 1: Run theme auditor dry-run**

```bash
npx tsx scripts/theme-auditor.ts --dry-run
```

Expected output: `0` unique selector violations found (or same baseline count as before this feature — no new violations introduced). If violations appear, they are unrelated to the header contrast work and should be investigated separately.

- [ ] **Step 2: Reload Foundry and visually confirm**

Press F5 in Foundry. Open a character sheet, item sheet, sidebar, and the combat tracker. Confirm:
- Window titlebars render `#1a1a1a` charcoal (visibly lighter than the black body/content area)
- Section headers, h1–h6, `th` table headers render `#1a1a1a`
- Body, window content, sheet panels remain `#000000`
- Cyan text, glow, and border colours unchanged

---


---
**LINKS:** [[OS_CORE]]
