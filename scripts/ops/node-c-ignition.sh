#!/usr/bin/env bash
# scripts/ops/node-c-ignition.sh
# 50V3R31GN-M4CH1N4: Node C Strategic Oracle Ignition (SGLang v3.0)
# Hardware: RTX 2060 (6GB VRAM) | Target: Gemma-4-E2B + Falcon Perception

# --- Nix Environment Stub ---
# To use via Nix: nix-shell -p uv cudaPackages.cudatoolkit --run "./scripts/ops/node-c-ignition.sh"

set -e

# --- Environmental Invariants ---
# In Nix, nvcc is in the store. We find it dynamically.
NIX_NVCC=$(which nvcc 2>/dev/null || find /nix/store -name nvcc -type f | head -n 1)
if [ -n "$NIX_NVCC" ]; then
    export CUDA_HOME=$(dirname $(dirname "$NIX_NVCC"))
    export PATH="$CUDA_HOME/bin:$PATH"
    echo "◈ NIX_CUDA_DETECTED: $CUDA_HOME"
else
    export CUDA_HOME=${CUDA_HOME:-/usr/local/cuda}
    if [ ! -d "$CUDA_HOME" ]; then export CUDA_HOME=/usr; fi
    export PATH="$CUDA_HOME/bin:$PATH"
fi
export LD_LIBRARY_PATH="$CUDA_HOME/lib64:$LD_LIBRARY_PATH"

# Construct Project Root (Dedicated for Node C isolated deployment)
PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_NODE_C_ORACLE (RTX 2060 / 6GB VRAM)"
# Ensure 'uv' is present for high-speed dependency management
if ! command -v uv &> /dev/null; then
    if [ -f "$HOME/.local/bin/uv" ]; then
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo "◈ [INFO] uv not found. Fetching binary..."
        curl -LsSf https://astral.sh/uv/install.sh | sh
        export PATH="$HOME/.local/bin:$PATH"
    fi
fi

# Initialize virtual environment if missing for isolation
VENV_DIR="$PROJECT_ROOT/.venv-node-c"
if [ ! -d "$VENV_DIR" ]; then
    echo "◈ Creating virtual environment at $VENV_DIR..."
    uv venv "$VENV_DIR" --python 3.12
fi

source "$VENV_DIR/bin/activate"

# Install/Update SGLang (Stable) and supporting kernels
echo "◈ Syncing SGLang stable dependencies..."
# vLLM/SGLang requires numpy and setuptools pre-installed for some wheel builds
uv pip install --quiet "numpy" "setuptools"

# Ensure CUDA paths are visible to the build engine
export CUDA_HOME=/usr/local/cuda
export PATH="/usr/local/cuda/bin:$PATH"
export LD_LIBRARY_PATH="/usr/local/cuda/lib64:$LD_LIBRARY_PATH"

uv pip install --quiet "sglang" "flashinfer-python" "xformers" "vllm"

# --- 2. Configuration ---
# Models identified for Node C (Strategic Oracle)
MODEL_LLM="huihui_ai/gemma-4-abliterated:e2b"
MODEL_VISION="tiiuae/falcon-perception"

# Host & Port
HOST="0.0.0.0"
PORT="7339"

# Low-VRAM Constraints for RTX 2060 (6GB)
# --mem-fraction-static 0.7: Leaves ~1.8GB for OS, Drivers, and VRAM overhead
# --max-running-requests 2: Minimal batching to ensure stable rule-check resolution
# --context-length 4096: Optimized for Cyberpunk RED rule-checking and VSB packets
MEM_FRACTION="0.7"
MAX_REQUESTS="2"
CONTEXT_LEN="4096"

echo "◈ --------------------------------------------------------"
echo "◈ ORACLE_IGNITION_SEQUENCE: INITIATED"
echo "◈ Primary Model (Logic):  $MODEL_LLM"
echo "◈ Vision Model (Draft):   $MODEL_VISION"
echo "◈ Node Address:           $HOST:$PORT"
echo "◈ VRAM Safety Partition:  $MEM_FRACTION"
echo "◈ RadixAttention Status:  ENABLED"
echo "◈ --------------------------------------------------------"

# --- 3. Ignition ---
# SGLang v3.0 utilizes RadixAttention for sub-100ms rule-checking.
# We employ Falcon Perception (600M) as a multimodal segmenter / speculative draft.
# --cuda-graph-max-bs 0 is mandatory for stability on 6GB consumer cards.
python3 -m sglang.launch_server \
    --model-path "$MODEL_LLM" \
    --speculative-draft-model "$MODEL_VISION" \
    --enable-radix-attention \
    --mem-fraction-static "$MEM_FRACTION" \
    --max-running-requests "$MAX_REQUESTS" \
    --context-length "$CONTEXT_LEN" \
    --host "$HOST" \
    --port "$PORT" \
    --cuda-graph-max-bs 0

echo "◈ ARTERY_FLOW_ESTABLISHED. Oracle is online."
