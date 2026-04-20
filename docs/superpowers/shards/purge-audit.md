# Shard: Purge Audit

## Metadata
- **ID:** 52 (Purge)
- **Name:** Purge-Verification
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Ensures that all legacy "Machina" UI elements have been systemically purged from the Foundry VTT module settings and escape menus. The Nucleus Command Deck is the only authorized control surface.

## Audit Logic
1. Performs a static analysis of the bridge module's `settings.ts`.
2. Verifies that `config: true` has been removed from all Sovereign settings.
3. Probes the active Foundry page via CDP to confirm no "Sovereign Mesh" buttons are present in the escape menu or sidebar.
4. Fails if any intrusive UI remnants are detected.

## Manifest Logic
Forces a module refresh to clear any cached UI states.

## Technical Details
- **Source:** `scripts/gauntlet/phases/purge-audit.ts`
- **Context:** Foundry VTT (CDP)
- **Target:** `50v3r31gn-bridge`
