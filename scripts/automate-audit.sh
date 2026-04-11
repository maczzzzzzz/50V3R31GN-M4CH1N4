#!/usr/bin/env bash
# scripts/automate-audit.sh
# 50V3R31GN-M4CH1N4: Full Automated Deploy + Ghost Boot + Live Audit

set -e

export FOUNDRY_BRIDGE_TOKEN=c2c7faf54e5a40a38b14f0d930ca1f30760edc41b4debeefda6310f97b9a73dd
export WINDOWS_HOST_IP=192.168.0.51
export CDP_DEBUG_PORT=9223

echo "◈ 50V3R31GN-M4CH1N4 // AUTOMATED LIVE-FIRE AUDIT ◈"

# 0. CLEANUP: Clear any processes on relevant ports
echo "[0/4] Cleaning up stale processes..."
STALE_3010=$(ss -tulpn | grep :3010 | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -n1)
if [ ! -z "$STALE_3010" ]; then
    echo "Killing stale Orchestrator on 3010 (PID $STALE_3010)..."
    kill -9 "$STALE_3010" || true
fi

STALE_9223=$(ss -tulpn | grep :9223 | grep -o 'pid=[0-9]*' | cut -d= -f2 | head -n1)
if [ ! -z "$STALE_9223" ]; then
    echo "Killing stale Bridge on 9223 (PID $STALE_9223)..."
    kill -9 "$STALE_9223" || true
fi

pkill -9 -f "tsx src/main.ts" || true
pkill -9 -f "pnpm start" || true
pkill -9 -f "deck-igniter-cli" || true
pkill -9 -f "wsl-cdp-bridge.cjs" || true

# 1. DEPLOY: Sync bridge module to Windows host
echo "[1/4] Deploying module files to Windows host..."
TARGET_DIR="/mnt/d/FoundryVTT_Data/Data/modules/50v3r31gn-bridge"
mkdir -p "$TARGET_DIR/scripts"
mkdir -p "$TARGET_DIR/styles"
mkdir -p "$TARGET_DIR/templates"
cp -rv 50v3r31gn-bridge/* "$TARGET_DIR/"
# Explicitly sync scripts if they are in the root scripts/ but belong in the module scripts/
cp -rv scripts/win-proxy.cjs "$TARGET_DIR/scripts/"

# 2. GHOST BOOT: Launch the full stack (Foundry, Orchestrator, Sidecars)
echo "[2/4] Initiating GHOST BOOT protocol..."
./scripts/ghost-boot.sh

# 3. SETTLE: Wait for Foundry and Orchestrator to stabilize
echo "[3/4] Waiting 30s for system stabilization..."
sleep 30

# 4. AUDIT: Run the live-fire audit script
echo "[4/4] Executing live-fire audit..."
# Ensure we're in the right environment
nix develop --command npx tsx scripts/sovereign-live-audit.ts
