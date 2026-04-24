#!/usr/bin/env bash
# scripts/ops/sovereign-purge-wsl.sh
# Final Maintenance Protocol - Phase 70.1
# Goal: Reclaim disk space and prepare for VHDX compaction.

set -e

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_PURGE_PROTOCOL..."

# 1. Nix Garbage Collection
echo "[1/4] Purging Nix Store (Old Generations & Dead Paths)..."
nix-collect-garbage -d
nix-store --optimise

# 2. Build Artifact Purge
echo "[2/4] Neutralizing Build Shards..."
rm -rf /home/nixos/50V3R31GN-M4CH1N4/terminal-app/build
rm -rf /home/nixos/50V3R31GN-M4CH1N4/zeroclaw/target
rm -rf /home/nixos/50V3R31GN-M4CH1N4/sidecar-atlas/target
rm -rf /home/nixos/50V3R31GN-M4CH1N4/sidecar-cyberdeck/target
rm -rf /home/nixos/50V3R31GN-M4CH1N4/sidecar-netrunning/target
rm -rf /home/nixos/50V3R31GN-M4CH1N4/sovereign-sdk/target

# 3. Cache & Temp Purge
echo "[3/4] Purging Developer Caches & Temp Arteries..."
rm -rf /home/nixos/.npm/_logs/*
rm -rf /home/nixos/.cache/*
rm -rf /home/nixos/android-sdk-tmp
rm -rf /home/nixos/50V3R31GN-M4CH1N4/.crush/logs/*

# 4. Final Sync
echo "[4/4] Finalizing Filesystem Handshake..."
sync

echo "◈ PURGE_COMPLETE. Ready for Host-Side Compaction."
df -h /
du -sh /nix/store
