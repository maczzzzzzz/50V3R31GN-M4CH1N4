# Shard: Phase 44 — Motor Cortex

## Metadata
- **ID:** 44
- **Name:** Motor-Cortex
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Verifies that the `SOVEREIGN_BRIDGE` WebSocket dispatcher has privileged handlers (`create_actor`, `run_script`, `create_scene`) required for direct world manipulation. This is the "Motor Cortex" of the system, enabling the Machina to physically manifest its intent.

## Audit Logic
1. Evaluates the active Foundry page via CDP.
2. Checks for the presence of the `SOVEREIGN_BRIDGE` global.
3. Probes the handler registry for core privileged methods.
4. Verifies `socketlib` availability for GM-level execution.
5. Fails if handlers are missing; Warns if `socketlib` is absent.

## Manifest Logic
Executes a safe test script through the `run_script` handler to verify end-to-end command dispatch.

## Technical Details
- **Source:** `scripts/gauntlet/phases/motor-cortex.ts`
- **Dependencies:** `socketlib`, `SOVEREIGN_BRIDGE`
- **Handlers:** `create_actor`, `run_script`, `create_scene`
