#!/usr/bin/env bash
# scripts/ops/node-a-mooncake-setup.sh
# 50V3R31GN-M4CH1N4: Node A Mooncake Provisioning

PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
MOONCAKE_DATA="$PROJECT_ROOT/data/mooncake"

echo "◈ 50V3R31GN-M4CH1N4 : PROVISIONING_NODE_A_MOONCAKE..."

# 1. Establish directory structure
echo "◈ Creating data arteries..."
mkdir -p "$MOONCAKE_DATA/meta"
mkdir -p "$MOONCAKE_DATA/worker"

# 2. Check for Go environment (required for Mooncake build/run)
if ! command -v go &> /dev/null; then
    echo "◈ [WARN] Go not found."
    echo "◈ Node A must execute commands via: nix develop .#cuda --command bash scripts/ops/node-a-mooncake-setup.sh"
    exit 1
else
    echo "◈ Go detected: $(go version)"
fi

# 3. Synchronize project root (RSYNC handles this from Node B)
echo "◈ Node A is primed for Mooncake ignition."
echo "◈ MOONCAKE_ROOT: $MOONCAKE_DATA"
