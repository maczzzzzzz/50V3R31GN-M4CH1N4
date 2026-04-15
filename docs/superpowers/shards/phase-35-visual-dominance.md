# Shard: Phase 35 — Visual Dominance

## Metadata
- **ID:** 35
- **Name:** Visual-Dominance
- **Block:** VISUAL
- **Status:** Verified

## Overview
Uses Node B's "Aesthetic Eye" (Pixtral VLM) to perform high-level visual audits of the Foundry UI. It detects theme leaks and ensuring that the dark cyberpunk aesthetic is consistently maintained across all panels.

## Audit Logic
1. Verifies that Node B (Vision Engine) is online.
2. Captures a screenshot of the active Foundry page.
3. Queries Node B to analyze the screenshot for UI theme issues or white backgrounds.
4. Warns if a theme leak is detected or if vision analysis fails.

## Manifest Logic
Triggers a manual aesthetic analysis of the current page to verify the vision pipeline's reasoning.

## Technical Details
- **Source:** `scripts/gauntlet/phases/vis-block.ts`
- **Engine:** Pixtral-12B (VLM)
- **Signal:** `THEME_CLEAN` vs `THEME_LEAK`
