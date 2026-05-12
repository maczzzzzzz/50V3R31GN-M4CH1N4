#!/usr/bin/env bash
# Sync Quaternary Models to Node D (Core Logic + Coding)
# Target: 10.0.0.13

set -e

NODE_D="maczz@10.0.0.13"
MODEL_SOURCE="/var/lib/hermes/models"
TARGET_DIR="/home/maczz/50V3R31GN-M4CH1N4/models"

# 1. Carnice V2 27B (Primary Reasoning)
# 2. Qwen2.5 Coder 14B (Specialized engineering)
MODELS=(
    "qwen2.5-coder-14b-q6_k.gguf"
    "qwen2.5-coder-14b-instruct-q6_k.gguf"
)

echo ":: SYNCING MODELS TO NODE D (CORE) ::"

# Ensure target directory exists
ssh $NODE_D "mkdir -p $TARGET_DIR"

# Sync models
for model in "${MODELS[@]}"; do
    echo ":: Syncing $model..."
    if [ -f "$MODEL_SOURCE/$model" ]; then
        scp "$MODEL_SOURCE/$model" "$NODE_D:$TARGET_DIR/"
        
        echo ":: Verifying $model..."
        LOCAL_HASH=$(sha256sum "$MODEL_SOURCE/$model" | awk '{print $1}')
        REMOTE_HASH=$(ssh $NODE_D "sha256sum $TARGET_DIR/$model" | awk '{print $1}')
        
        if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
            echo ":: $model verified: $LOCAL_HASH"
        else
            echo ":: ERROR: Hash mismatch for $model"
            exit 1
        fi
    fi
done

echo ":: NODE D SYNC COMPLETE ::"
