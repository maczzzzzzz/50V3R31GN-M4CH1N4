#!/usr/bin/env bash
# scripts/audit/ignite-all.sh
# v3.8.28-GOLD: Full-Spectrum Sovereign Audit Ignition Sequence
#
# Target hardware: Intel Core Ultra 5 / AMD Ryzen 9 5900XT
# Orchestrates: Gemma-4 26B (Vision), Llama-12B (Brain), Nucleus (TS), Crush (Go)

set -euo pipefail

# ---------------------------------------------------------------------------
# ◈ PRE-FLIGHT
# ---------------------------------------------------------------------------
echo "::/5Y573M-N071C3 : GLOBAL_IGNITION_SEQUENCE_START."
PROJECT_ROOT=$(pwd)
LOG_DIR="$PROJECT_ROOT/data/logs/audit"
mkdir -p "$LOG_DIR"

# Cleanup previous sessions
echo "  [stage 0] Cleaning existing daemons..."
pkill -9 -f llama-server || true
pkill -9 -f colpali-server || true
pkill -9 -f mcp-daemon || true
pkill -9 -f "tsx packages/hermes-core/src/main.ts" || true
pkill -9 -f crush || true
pkill -9 -f zeroclaw || true

# ◈ ZOMBIE_CHECK skipped (lsof missing)

# ---------------------------------------------------------------------------
# ◈ STAGE 1: VISION ARTERY (Node B - Windows Native)
# ---------------------------------------------------------------------------
echo "  [stage 1] Igniting Node B Vision (Gemma-4-26B)..."
/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe -NoProfile -Command \
  "Start-Process -FilePath 'cmd.exe' -ArgumentList '/K \"D:\\llama.cpp\\start_node_b_vision.bat\"' -WorkingDirectory 'D:\\llama.cpp'"

# ---------------------------------------------------------------------------
# ◈ STAGE 2: INFRASTRUCTURE (Director, Nucleus, Bridge)
# ---------------------------------------------------------------------------
echo "  [stage 2] Igniting Director, Nucleus & MCP Bridge..."
nix develop -c npm run scribe
nix develop -c npm run mcp:start > "$LOG_DIR/mcp.log" 2>&1 &
sleep 2
nix develop -c npm run start > "$LOG_DIR/nucleus.log" 2>&1 &

echo "  [stage 2.5] Igniting Sovereign-Proxy (Crush Artery)..."
./crush-cli proxy > "$LOG_DIR/crush.log" 2>&1 &

# ---------------------------------------------------------------------------
# ◈ STAGE 3: SIDECARS (Atlas, Cyberdeck, Netrunning)
# ---------------------------------------------------------------------------
echo "  [stage 3] Materializing Headless Sidecars..."
npm run atlas:headless > "$LOG_DIR/atlas.log" 2>&1 &
npm run hub:headless > "$LOG_DIR/cyberdeck.log" 2>&1 &
npm run netrunning:headless > "$LOG_DIR/netrunning.log" 2>&1 &

# ---------------------------------------------------------------------------
# ◈ STAGE 4: HERMES COGNITION ROUTER
# ---------------------------------------------------------------------------
echo "  [stage 4] Igniting Hermes Cognition Router..."
if [ -f "crates/hermes-router/target/release/hermes-router" ]; then
    ./crates/hermes-router/target/release/hermes-router > "$LOG_DIR/hermes-router.log" 2>&1 &
else
    (cd crates/hermes-router && cargo build --release 2>/dev/null && ./target/release/hermes-router) > "$LOG_DIR/hermes-router.log" 2>&1 &
fi

echo "::/5Y573M-N071C3 : IGNITION_COMPLETE. SYSTEM_READY."
echo "◈ MISSION_MANTRAS: /status /profile /vault /ship"

# Launch interactive terminal
npm run terminal
