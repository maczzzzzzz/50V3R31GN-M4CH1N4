#!/usr/bin/env bash
# scripts/ops/node-c-ignition.sh
# 50V3R31GN-M4CH1N4: Node C Strategic Oracle Ignition (llama-server STABLE)
# Hardware: RTX 2060 (6GB VRAM) | Target: Gemma-4-E4B-it-OBLITERATED

set -e

# Construct Project Root
PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
cd "$PROJECT_ROOT"

# Quantization Argument (default to Q4)
QUANT=${1:-"q4"}
QUANT_UPPER=$(echo "$QUANT" | tr '[:lower:]' '[:upper:]')

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_STABLE_ORACLE (llama-server) | MODE: $QUANT_UPPER"

# Locate llama-server
LLAMA_SERVER="/nix/store/2h4scrgbk4wcady8cw1qyzs1dvx3f13h-llama-cpp-8733/bin/llama-server"
if [ ! -f "$LLAMA_SERVER" ]; then
    LLAMA_SERVER=$(find /nix/store -name llama-server -type f -executable | head -n 1)
fi

# Model Path (Dynamic based on Quant)
MODEL_PATH="$PROJECT_ROOT/models/gemma-4-e2b/gemma-4-E4B-it-OBLITERATED-${QUANT_UPPER}_K_M.gguf"

if [ ! -f "$MODEL_PATH" ]; then
    echo "◈ [ERROR] Model not found: $MODEL_PATH"
    exit 1
fi

# Host & Port
HOST="0.0.0.0"
PORT="7339"

# GPU Layers (default to 99)
GPU_LAYERS=99

# Adjust Context Size per Quant for stability
if [ "$QUANT" == "q5" ]; then
    CTX_SIZE=4096
elif [ "$QUANT" == "q4" ]; then
    CTX_SIZE=8192
else
    CTX_SIZE=16384
fi

echo "◈ --------------------------------------------------------"
echo "◈ ORACLE_IGNITION_SEQUENCE: STABLE_MODE"
echo "◈ Model:    $MODEL_PATH"
echo "◈ Address:  $HOST:$PORT"
echo "◈ Context:  $CTX_SIZE"
echo "◈ Engine:   llama-server (Nix-compiled)"
echo "◈ --------------------------------------------------------"

# Ignition via Nix wrapper to ensure CUDA is visible
# We use the absolute path to llama-server but wrap it in the nix environment
exec nix develop "$PROJECT_ROOT#cuda" --command "$LLAMA_SERVER" \
    --model "$MODEL_PATH" \
    --host "$HOST" \
    --port "$PORT" \
    --ctx-size "$CTX_SIZE" \
    --n-gpu-layers "$GPU_LAYERS" \
    --parallel 2 \
    --cont-batching \
    --log-disable
