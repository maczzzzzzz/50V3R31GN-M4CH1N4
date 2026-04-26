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

# ◈ ZOMBIE_CHECK
echo "  [stage 0.5] Verifying port sovereignty..."
CHECK_PORTS=(8080 3030 7878 3012)
for port in "${CHECK_PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "❌ [GHOST_DETECTED] Process still holding port $port. Manual intervention required."
        exit 1
    fi
done
echo "● [PORTS_CLEAR]"

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
# ◈ STAGE 3: MCP BRIDGE & NUCLEUS (Infrastructure)
# ---------------------------------------------------------------------------
echo "  [stage 3] Igniting MCP Bridge, Nucleus & Flowy..."
systemctl --user start sovereign-flowy
nix develop -c npm run mcp:start > "$LOG_DIR/mcp.log" 2>&1 &
sleep 5
nix develop -c npm run start > "$LOG_DIR/nucleus.log" 2>&1 &

# ---------------------------------------------------------------------------
# ◈ STAGE 4: HEADLESS SIDECARS (Atlas, Cyberdeck, Netrunning)
# ---------------------------------------------------------------------------
echo "  [stage 4] Materializing Headless Sidecars..."
npm run atlas:headless > "$LOG_DIR/atlas.log" 2>&1 &
npm run hub:headless > "$LOG_DIR/cyberdeck.log" 2>&1 &
npm run netrunning:headless > "$LOG_DIR/netrunning.log" 2>&1 &

echo "  [stage 4.5] Igniting Sovereign-Proxy (Crush Artery)..."
export CLAWLINK_SOCK="$PROJECT_ROOT/.crush/clawlink.sock"
if [ -f "crush/crush" ]; then
    ./crush/crush proxy > "$LOG_DIR/crush.log" 2>&1 &
else
    cd crush && go build . && ./crush proxy > "$LOG_DIR/crush.log" 2>&1 &
    cd ..
fi

# ---------------------------------------------------------------------------
# ◈ STAGE 5: HERMES COGNITION ROUTER (Phase 76, Task 2)
# ---------------------------------------------------------------------------
echo "  [stage 5] Igniting Hermes Cognition Router (port 3012)..."
if [ -f "crates/hermes-router/target/release/hermes-router" ]; then
    ./crates/hermes-router/target/release/hermes-router > "$LOG_DIR/hermes-router.log" 2>&1 &
else
    (cd crates/hermes-router && cargo build --release 2>/dev/null && ./target/release/hermes-router) > "$LOG_DIR/hermes-router.log" 2>&1 &
fi
HERMES_ROUTER_PID=$!
sleep 1

# ---------------------------------------------------------------------------
# ◈ STAGE 6: HERMES TUI (Primary OS Shell)
# ---------------------------------------------------------------------------
echo "  [stage 6] Enforcing SOVEREIGN_OS default boot profile..."
if [ -f "crush/crush" ]; then
    ACTIVE=$(grep "ACTIVE_PROFILE" SOVEREIGN-IDENTITY.md 2>/dev/null | head -1 || echo "")
    if echo "$ACTIVE" | grep -qv "SOVEREIGN_OS"; then
        echo "  [stage 6] WARNING: non-default profile detected — resetting to SOVEREIGN_OS..."
        sed -i 's/^ACTIVE_PROFILE: \[.*\]/ACTIVE_PROFILE: [SOVEREIGN_OS] # [BOOT_INVARIANT] — do not change without explicit Strategist approval/' SOVEREIGN-IDENTITY.md
    fi
fi
echo "::/5Y573M-N071C3 : SYSTEM_DEFAULT_BOOT -> [SOVEREIGN_OS]"
echo "◈ COMMAND_MANTRAS: /status /profile /vault /ship"

# ◈ Reroute to the new native Hermes shell (Ink-based TUI)
npm run terminal
