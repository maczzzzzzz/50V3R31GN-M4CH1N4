#!/usr/bin/env bash
# Sync models to Node C (Oracle) via Tailscale artery
# Target: 100.102.109.81 (Carnice-9B-FC)
set -e

NODE_C="maczz@100.102.109.81"
TARGET_DIR="/mnt/sovereign-soul/models"

# Current deployed model on Node C
MODELS=(
    "Carnice-9B-Function-Calling-xLAM-Unsloth.i1-Q4_K_M.gguf"
)

echo ":: SYNCING MODELS TO NODE C (ORACLE) ::"

# Ensure target directory exists
ssh "$NODE_C" "mkdir -p $TARGET_DIR"

# Sync GGUF models
for model in "${MODELS[@]}"; do
    echo ":: Syncing $model..."
    if [ -f "$1/$model" ]; then
        scp "$1/$model" "$NODE_C:$TARGET_DIR/"
        echo ":: $model synced."
    else
        echo ":: SKIP: $1/$model not found locally"
    fi
done

echo ":: NODE C SYNC COMPLETE ::"
