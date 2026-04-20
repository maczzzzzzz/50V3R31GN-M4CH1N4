#!/usr/bin/env bash
# scripts/ops/node-a-mooncake-ignite.sh
# 50V3R31GN-M4CH1N4: Node A Mooncake Ignition (KV-Cache Synapse)

set -e

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_MOONCAKE_IGNITION (Node A)..."

# 1. Fetch Source if missing
if [ ! -d "$HOME/Mooncake" ]; then
    echo "◈ Cloning Mooncake repository..."
    git clone https://github.com/kvcache-ai/Mooncake.git "$HOME/Mooncake"
fi

cd "$HOME/Mooncake"

# 2. Build Core Shared Libraries (C++)
echo "◈ Building Mooncake Core (C++)..."
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
echo "ch00m" | sudo -S make install
cd ..

# 3. Build Go Services
echo "◈ Building Mooncake Go bindings..."
if [ -d "mooncake-store/go-bindings" ]; then
    cd mooncake-store/go-bindings
    go build ./...
else
    echo "◈ [WARN] go-bindings directory not found. Checking root for go.mod..."
    go build ./...
fi

echo "◈ MOONCAKE_IGNITED. Node A (Synapse) is now active."
