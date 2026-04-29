#!/usr/bin/env bash
# scripts/ops/shutdown.sh
# 50V3R31GN-M4CH1N4: Quaternary Graceful Shutdown Protocol

echo "::/5Y573M-N071C3 : INITIATING_GRACEFUL_SHUTDOWN..."

# 1. Trigger Save State for active Orchestrator threads
echo "  [1/5] Signalling Node B Orchestrator (Checkpointing)..."
pkill -SIGTERM -f "tsx src/main.ts" || true
sleep 2

# 2. Shutdown MCP Bridge
echo "  [2/5] Signalling MCP Bridge..."
pkill -SIGTERM -f "mcp-daemon" || true

# 3. Shutdown Node C/D Remote Daemons
echo "  [3/5] Neutralizing Logic Arteries (Nodes C & D)..."
# We send SIGTERM to remote daemons. They are responsible for their own model unloads.
pkill -SIGTERM -f "sglang.launch_server" || true
pkill -SIGTERM -f "node-d-command" || true

# 4. Shutdown Node A Memory Master
echo "  [4/5] Neutralizing Memory Artery (Node A)..."
pkill -SIGTERM -f "mooncake-master" || true
pkill -SIGTERM -f "llama-server" || true

# 5. Final Sweep (Force Kill any phantom zombies)
echo "  [5/5] Purging residual phantom services..."
sleep 1
pkill -9 -f "tsx src/main.ts" || true
pkill -9 -f "mcp-daemon" || true
pkill -9 -f "crush" || true
pkill -9 -f "zeroclaw" || true
pkill -9 -f "llama-server" || true
pkill -9 -f "node-d-command" || true

# 6. Cleanup Sockets & PID files
echo "  [stage 6] Cleaning persistent sockets..."
rm -f .gemini/tmp/*.sock .gemini/tmp/*.pid .crush/clawlink.sock 2>/dev/null || true

# 7. Execute Ghost Purge (4hr timeout check)
bash scripts/audit/purge-ghosts.sh

echo -e "\n::/5Y573M-N071C3 : SHUTDOWN_COMPLETE. THE_MESH_IS_DARK."
