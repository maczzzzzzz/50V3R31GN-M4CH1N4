#!/usr/bin/env bash
# Sync Oracle Models to Node C (Falcon Perception + Reasoning)
# Target: 10.0.0.12

set -e

NODE_C="maczz@10.0.0.12"
MODEL_SOURCE="/var/lib/hermes/models"
TARGET_DIR="/home/maczz/50V3R31GN-M4CH1N4/models"

# 1. Falcon Perception Stack (Directory)
# 2. Qwen3.5 0.8B (High-speed perceptual triage)
# 3. VoxCPM2 Indic-Q4 (Directory - adiwajshing/voxcpm2-indic-q4)
MODELS=(
    "Qwen3.5-0.8B-UD-Q8_K_XL.gguf"
)

# Legacy models to purge
OLD_MODELS=(
    "qwen3.5-9b-deepseek-v4-flash-q3_k_m.gguf"
    "qwen3.5-9b-ds-flash.gguf"
    "voxcpm2-indic-q4.gguf"
)

echo ":: SYNCING MODELS TO NODE C (ORACLE) ::"

# Step 0: Purge legacy models
for old_model in "${OLD_MODELS[@]}"; do
    echo ":: Purging legacy model: $old_model..."
    ssh $NODE_C "rm -f $TARGET_DIR/$old_model"
done

# Ensure target directories exist
ssh $NODE_C "mkdir -p $TARGET_DIR/falcon-perception $TARGET_DIR/voxcpm2-indic-q4"

# Sync Directory-based models
echo ":: Syncing falcon-perception stack..."
rsync -avz "$MODEL_SOURCE/falcon-perception/" "$NODE_C:$TARGET_DIR/falcon-perception/"

echo ":: Syncing voxcpm2-indic-q4 stack..."
if [ -d "$MODEL_SOURCE/voxcpm2-indic-q4" ]; then
    rsync -avz "$MODEL_SOURCE/voxcpm2-indic-q4/" "$NODE_C:$TARGET_DIR/voxcpm2-indic-q4/"
fi

# Sync GGUF models
for model in "${MODELS[@]}"; do
    echo ":: Syncing $model..."
    if [ -f "$MODEL_SOURCE/$model" ]; then
        scp "$MODEL_SOURCE/$model" "$NODE_C:$TARGET_DIR/"
        
        echo ":: Verifying $model..."
        LOCAL_HASH=$(sha256sum "$MODEL_SOURCE/$model" | awk '{print $1}')
        REMOTE_HASH=$(ssh $NODE_C "sha256sum $TARGET_DIR/$model" | awk '{print $1}')
        
        if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
            echo ":: $model verified: $LOCAL_HASH"
        else
            echo ":: ERROR: Hash mismatch for $model"
            exit 1
        fi
    fi
done

echo ":: NODE C SYNC COMPLETE ::"
