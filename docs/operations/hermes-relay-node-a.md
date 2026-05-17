# Hermes-Relay Migration to Node A

**Date:** 2026-05-20  
**Status:** COMPLETE

## Overview

The `hermes-relay` service has been migrated from Node B (Docker Desktop) to Node A (Synapse) for better architectural alignment.

## Rationale

- Node A is the designated state and persistence node.
- Low inference load on Node A.
- Keeps high-performance nodes focused.

## New Location

- **Host:** Node A (100.96.253.114)
- **Port:** 8767
- **Service:** Managed via systemd on NixOS

## Verification

- Code copied to `~/.hermes/plugins/hermes-relay`
- Virtual environment created
- Systemd service defined in `configuration.nix`

## Related

- See `docs/planning/plans/2026-05-20-hermes-relay-node-a-migration.md` for full plan.