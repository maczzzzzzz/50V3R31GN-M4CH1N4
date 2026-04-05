# Design: Black-Ice Theme Header Contrast

**Date:** 2026-04-03
**Status:** Approved
**Target:** `foundry-module/styles/black-ice-theme.css`

---

## Summary

Add a single CSS variable `--cpr-bg-header: #1a1a1a` to lift header backgrounds off the pitch-black body, creating visible depth across all Foundry sheet headers and panel titlebars without altering any other surface.

---

## Motivation

Every surface in the current theme renders at `#000000`. Headers are visually indistinguishable from their containers. A subtle charcoal lift (`#1a1a1a`) provides contrast and hierarchy while preserving the void-black aesthetic.

---

## Changes

### 1. `:root` — new variable

```css
--cpr-bg-header: #1a1a1a;
```

Added alongside the existing palette (`--cpr-bg-black`, `--cpr-bg-dark-grey`, `--cpr-cyan`, etc.).

### 2. Section 2 — class-based headers

Selectors: `h1–h6`, `.window-title`, `.header`, `.header-label`, `.attribute-label`, `.resource-label`, `.charname`, `.folder-header`, `.section-header`, `.tab-label`, `.cpr-header`, `.title`, `th`

Change: `background: #000000` → `background: var(--cpr-bg-header)`

### 3. Section 2b — `<header>` HTML elements

Selectors: `header.directory-header`, `header.combat-tracker-header`, `header.playlist-header`, `header#ui-top`, `header.window-header`

Change: `background-color: #000000` → `background-color: var(--cpr-bg-header)`

---

## Out of Scope

- Body, window, sheet, sidebar, and component box backgrounds (sections 1, 3, 4) — remain `#000000`
- AUTO-PATCH block (blackIce sheet) — remains `#000000`
- Text colours, borders, glows — unchanged

---

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
