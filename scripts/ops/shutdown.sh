#!/usr/bin/env bash
# scripts/ops/shutdown.sh
# 50V3R31GN-M4CH1N4: Unified Graceful Shutdown Protocol

echo "::/5Y573M-N071C3 : INITIATING_GRACEFUL_SHUTDOWN..."

# 1. Trigger Save State for active Orchestrator threads
# We send a SIGTERM to the main Node.js process first, allowing it to checkpoint.
echo "  [1/4] Signalling Node B Orchestrator (Checkpointing)..."
pkill -SIGTERM -f "tsx src/main.ts" || true
sleep 2

# 2. Shutdown MCP Bridge
echo "  [2/4] Signalling MCP Bridge..."
pkill -SIGTERM -f "mcp-daemon" || true

# 3. Shutdown Node C Artery Manager & Llama Servers
echo "  [3/4] Neutralizing Logic Artery (Node C)..."
pkill -SIGTERM -f "artery_manager" || true
pkill -SIGTERM -f "llama-server" || true
pkill -SIGTERM -f "colpali-server" || true

# 4. Final Sweep (Force Kill any phantom zombies)
echo "  [4/4] Purging residual phantom services..."
sleep 1
pkill -9 -f "tsx src/main.ts" || true
pkill -9 -f "mcp-daemon" || true
pkill -9 -f "crush" || true
pkill -9 -f "zeroclaw" || true
pkill -9 -f "llama-server" || true
pkill -9 -f "colpali-server" || true

# 5. Cleanup Sockets & PID files
echo "  [stage 5] Cleaning persistent sockets..."
rm -f .gemini/tmp/*.sock .gemini/tmp/*.pid .crush/clawlink.sock 2>/dev/null || true

echo -e "\n::/5Y573M-N071C3 : SHUTDOWN_COMPLETE. THE_TRINITY_IS_DARK."
