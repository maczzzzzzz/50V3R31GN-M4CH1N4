#!/usr/bin/env bash
# scripts/ops/node-c-ignition.sh
# 50V3R31GN-M4CH1N4: Node C Strategic Oracle Ignition (llama-server STABLE)
# Hardware: RTX 2060 (6GB VRAM) | Target: Gemma-4-E4B-it-OBLITERATED

set -e

# Construction Project Root
PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
cd "$PROJECT_ROOT"

# Model Selection Argument (default to gemma)
MODEL_TYPE=${1:-"gemma"}
QUANT=${2:-"q4"}
QUANT_UPPER=$(echo "$QUANT" | tr '[:lower:]' '[:upper:]')

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_STABLE_ORACLE (llama-server) | MODEL: $MODEL_TYPE | MODE: $QUANT_UPPER"

# Locate llama-server
LLAMA_SERVER="/nix/store/2h4scrgbk4wcady8cw1qyzs1dvx3f13h-llama-cpp-8733/bin/llama-server"
if [ ! -f "$LLAMA_SERVER" ]; then
    LLAMA_SERVER=$(find /nix/store -name llama-server -type f -executable | head -n 1)
fi

# Model Path (Pointing to shared D: drive mount)
if [ "$MODEL_TYPE" == "qwen" ]; then
    MODEL_PATH="/mnt/d/llama.cpp/models/qwen2.5-coder-14b-instruct-q6_k.gguf"
    PORT="7340"
    CTX_SIZE=16384
else
    MODEL_PATH="/mnt/d/llama.cpp/models/gemma-4-E4B-it-${QUANT_UPPER}_K_M.gguf"
    PORT="7339"
    # Adjust Context Size per Quant for stability
    if [ "$QUANT" == "q5" ]; then
        CTX_SIZE=4096
    elif [ "$QUANT" == "q4" ]; then
        CTX_SIZE=8192
    else
        CTX_SIZE=16384
    fi
fi

if [ ! -f "$MODEL_PATH" ]; then
    echo "◈ [ERROR] Model not found: $MODEL_PATH"
    exit 1
fi

# Host & Port
HOST="0.0.0.0"

# GPU Layers (default to 99)
GPU_LAYERS=99

echo "◈ --------------------------------------------------------"
echo "◈ ORACLE_IGNITION_SEQUENCE: STABLE_MODE"
echo "◈ Model:    $MODEL_PATH"
echo "◈ Address:  $HOST:$PORT"
echo "◈ Context:  $CTX_SIZE"
echo "◈ Engine:   llama-server (Nix-compiled)"
echo "◈ --------------------------------------------------------"

# Ignition via Nix wrapper to ensure CUDA is visible
exec nix develop "$PROJECT_ROOT#cuda" --command "$LLAMA_SERVER" \
    --model "$MODEL_PATH" \
    --host "$HOST" \
    --port "$PORT" \
    --ctx-size "$CTX_SIZE" \
    --n-gpu-layers "$GPU_LAYERS" \
    --parallel 2 \
    --cont-batching \
    --log-disable
