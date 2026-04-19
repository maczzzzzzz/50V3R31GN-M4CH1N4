#!/usr/bin/env bash
# scripts/dev/ignite-director.sh
# Phase 64 Task 1: Node B (Director) — llama-server ignition with KV-cache quantization.
#
# Target hardware: AMD Radeon RX 9060 XT (16GB VRAM, Vulkan/ROCm)
# Resident model:  Mistral-Nemo-12B (Q4_K_M) + Pixtral mmproj (vision)
#
# KV-cache quantization (Phase 64):
#   --cache-type-k q4_0  — 4-bit key cache (halves KV VRAM from FP16)
#   --cache-type-v q4_0  — 4-bit value cache
#   Combined effect: ~4× context capacity at equal VRAM budget
#
# Usage (WSL → Windows pipe or native Linux with ROCm):
#   bash scripts/dev/ignite-director.sh
#
# Override model path:
#   MODEL_PATH=/path/to/model.gguf bash scripts/dev/ignite-director.sh
set -euo pipefail

MODEL_PATH="${MODEL_PATH:-/mnt/d/llama.cpp/models/mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf}"
MMPROJ_PATH="${MMPROJ_PATH:-/mnt/d/llama.cpp/models/pixtral-12b.mmproj-f16.gguf}"
PORT="${DIRECTOR_PORT:-8080}"
CTX="${DIRECTOR_CTX:-32768}"

echo "==> Checking if director (Node B) is already active on port ${PORT}..."
if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
    echo "[director] llama-server already running — skipping ignition."
    exit 0
fi

echo "==> Igniting Node B Director (Mistral-Nemo-12B) on port ${PORT}..."
echo "    KV-cache: k=q4_0, v=q4_0 (Phase 64 quantization)"
echo "    Context:  ${CTX} tokens"

llama-server \
    -m "${MODEL_PATH}" \
    --mmproj "${MMPROJ_PATH}" \
    --host 0.0.0.0 \
    --port "${PORT}" \
    -c "${CTX}" \
    -ngl 999 \
    --cache-type-k q4_0 \
    --cache-type-v q4_0 \
    --flash-attn on \
    --mlock \
    &

DIRECTOR_PID=$!
echo "==> Waiting for director to initialize (pid=${DIRECTOR_PID})..."
for i in $(seq 1 30); do
    if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
        echo "[director] ONLINE — Node B Director active on port ${PORT}."
        echo "    ::/5Y573M-N071C3 : NODE_B_IGNITED. KV_CACHE_Q4_0_ACTIVE. // 50V3R31GN-M4CH1N4"
        exit 0
    fi
    sleep 2
done

echo "ERROR: director failed to start within 60s." >&2
exit 1
