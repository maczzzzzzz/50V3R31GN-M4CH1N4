#!/usr/bin/env bash
# scripts/recovery/nuke-and-rebuild-v4.sh
# Phase 59: Canonical reconstruction — backup, nuke, rebuild, ingest.
set -euo pipefail

echo "::/5Y573M-N071C3 : NUKE_AND_REBUILD_V4 — INITIATING..."

# 1. Backup current mind
npm run mind:backup

# 2. Nuke DB and RKG vault
echo "::/5Y573M-N071C3 : NUKING legacy Akashik.db..."
rm -f data/Akashik.db data/Akashik.db-shm data/Akashik.db-wal
rm -rf data/vault/RKG/*

# 3. Rebuild fresh schema
echo "::/5Y573M-N071C3 : REBUILDING schema..."
npm run mind:fresh

# 4. Ingest canonical + community modules
echo "::/5Y573M-N071C3 : INGESTING canonical data..."
npm run mind:ingest -- --official

echo "::/5Y573M-N071C3 : RECONSTRUCTION_COMPLETE"
