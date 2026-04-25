# Shard: Phase 51.1 — Identity Verification

## Metadata
- **ID:** 511
- **Name:** Declarative-Identity
- **Block:** ORCHESTRATION
- **Status:** Verified

## Overview
Ensures that the agentic identity (`SOUL.md`, `AGENTS.md`) is correctly manifested from the immutable Nix environment variables (`SOVEREIGN_SOUL`, `SOVEREIGN_AGENTS`). This shard prevents "personality drift" across rebuilds.

## Audit Logic
1. Checks for the existence of `SOUL.md` and `AGENTS.md` in the project root.
2. Compares the file contents against the active environment variables.
3. Warns if the environment variables are missing (suggests running inside `nix develop`).
4. Fails if the files do not match the declarative source of truth.

## Manifest Logic
Force-writes the environment variable content to the local `.md` files to synchronize the local identity with the Nix configuration.

## Technical Details
- **Source:** `scripts/gauntlet/phases/orch-51-1.ts`
- **Pattern:** Declarative Sovereignty
- **Environment:** Nix / WSL


---
**LINKS:** [[OS_CORE]]
