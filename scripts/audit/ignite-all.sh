#!/usr/bin/env bash
# scripts/audit/ignite-all.sh
# FSSA-2026-04-19: Full-Spectrum Sovereign Audit Ignition Sequence
#
# Target hardware: AMD Radeon RX 9060 XT (16GB VRAM)
# Orchestrates: ColPali (Vision), Llama-12B (Brain), Nucleus (TS), Crush (Go), ZeroClaw (Rust)

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
pkill -9 -f "tsx src/main.ts" || true
pkill -9 -f crush || true
pkill -9 -f zeroclaw || true

# ---------------------------------------------------------------------------
# ◈ STAGE 1: VISION KERNEL (Node A - CPU Mode for interim stability)
# ---------------------------------------------------------------------------
echo "  [stage 1] Igniting Optical Artery (ColPali v1.2 CPU)..."
# Force CPU in environment if not already hardcoded in script
export CUDA_VISIBLE_DEVICES=""
nix develop .#optical -c python scripts/dev/colpali-server.py > "$LOG_DIR/colpali.log" 2>&1 &
COLPALI_PID=$!

# ---------------------------------------------------------------------------
# ◈ STAGE 2: BRAIN KERNEL (Node B - Gemma-4-E4B GPU)
# ---------------------------------------------------------------------------
echo "  [stage 2] Igniting Director (Gemma-4-E4B Q8 GPU)..."
# Use Windows llama-server.exe (build b8710) — nix build is too old for gemma4 arch.
# Windows binary uses Vulkan backend targeting AMD RX 9060 XT (15428 MiB free).
/mnt/d/llama.cpp/llama-server.exe \
  -m 'D:\llama.cpp\models\Gemma-4-E4B-Uncensored-HauhauCS-Aggressive-Q8_K_P.gguf' \
  --host 0.0.0.0 --port 8080 \
  -ngl 99 -c 8192 --no-mmap > "$LOG_DIR/director.log" 2>&1 &
DIRECTOR_PID=$!

# ---------------------------------------------------------------------------
# ◈ STAGE 3: MCP BRIDGE & NUCLEUS
# ---------------------------------------------------------------------------
echo "  [stage 3] Igniting MCP Bridge & Nucleus..."
nix develop -c npm run mcp:start > "$LOG_DIR/mcp.log" 2>&1 &
sleep 5
nix develop -c npm run start > "$LOG_DIR/nucleus.log" 2>&1 &

# ---------------------------------------------------------------------------
# ◈ STAGE 4: PROXY & HUD (Crush & ZeroClaw)
# ---------------------------------------------------------------------------
echo "  [stage 4] Igniting Sovereign-Proxy (Crush)..."
# Run in proxy mode so it creates the Unix socket for Nucleus.
# CLAWLINK_SOCK must match src/main.ts default: .crush/clawlink.sock
# /run/crush/ is not writable (NixOS), use project-local .crush/ dir instead.
export CLAWLINK_SOCK="$PROJECT_ROOT/.crush/clawlink.sock"
if [ -f "crush/crush" ]; then
    ./crush/crush proxy > "$LOG_DIR/crush.log" 2>&1 &
else
    cd crush && go build . && ./crush proxy > "$LOG_DIR/crush.log" 2>&1 &
    cd ..
fi

echo "  [stage 5] Igniting Unified-HUD (ZeroClaw)..."
# cd zeroclaw && cargo run --release > "$LOG_DIR/zeroclaw.log" 2>&1 &
# cd ..

# ---------------------------------------------------------------------------
# ◈ VERIFICATION
# ---------------------------------------------------------------------------
echo -e "\n◈ WAITING FOR STABILIZATION (30s)..."
sleep 30

echo -e "\n◈ SYSTEM STATUS AUDIT:"
echo -n "  Node A (Optical): "
curl -s http://localhost:8082/health | grep -o "online" || echo "FAILED"

echo -n "  Node B (Director): "
# Windows exe binds to Windows network stack — use PowerShell for health check
powershell.exe -Command "(Invoke-WebRequest -Uri 'http://localhost:8080/health' -UseBasicParsing).StatusCode" 2>/dev/null | grep -q "200" && echo "ok" || echo "FAILED (check data/logs/audit/director.log)"

echo -e "\n::/5Y573M-N071C3 : IGNITION_COMPLETE. SYSTEM_LIVE_FIRE_READY."
echo "Logs available at: $LOG_DIR"
