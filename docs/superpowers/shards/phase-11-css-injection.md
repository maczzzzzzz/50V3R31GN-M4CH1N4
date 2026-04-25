# Shard: Phase 11 — CSS Injection

## Metadata
- **ID:** 11
- **Name:** CSS-Injection
- **Block:** VISUAL
- **Status:** Verified

## Overview
Verifies that the Sovereign / Black Ice theme stylesheets are correctly injected into the Foundry VTT environment. This shard prevents "theme leakage" (white backgrounds) and ensures the project's visual identity is maintained.

## Audit Logic
1. Evaluates the active Foundry page via CDP.
2. Scans `document.styleSheets` for "black-ice" or "sovereign" references.
3. Checks the `body` background color.
4. Fails if a white background (`rgb(255, 255, 255)`) is detected; Warns if stylesheets are missing.

## Manifest Logic
Enforces the Sovereign CSS theme by directly injecting core variables and body styles via the bridge.

## Technical Details
- **Source:** `scripts/gauntlet/phases/vis-block.ts`
- **Theme:** Black Ice
- **Requirement:** Dark Mode (Absolute)


---
**LINKS:** [[OS_CORE]]
