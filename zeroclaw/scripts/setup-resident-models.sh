#!/usr/bin/env bash
# zeroclaw/scripts/setup-resident-models.sh
# Phase 25 Task 1 — Migrate from Ollama to native llama-server via Nix
# Usage: bash zeroclaw/scripts/setup-resident-models.sh
set -euo pipefail

# Node A: NVIDIA 1050 Ti (4GB VRAM)
# Using Open-Reasoner-Zero-1.5B (Q8_0) for rules validation.
MODEL_PATH="zeroclaw/models/Open-Reasoner-Zero-1.5B.Q8_0.gguf"
PORT=8080

echo "==> Verifying model availability at $MODEL_PATH..."
if [ ! -f "$MODEL_PATH" ]; then
    echo "ERROR: Model not found at $MODEL_PATH." >&2
    exit 1
fi

echo "==> Checking if llama-server is already running on port $PORT..."
if curl -sf "http://localhost:${PORT}/health" > /dev/null; then
    echo "llama-server is already active. Skipping ignition."
else
    echo "==> Starting llama-server (Node A Rules Vault) via Nix..."
    # We use nix develop .#cuda to ensure we have CUDA acceleration on Node A.
    # -c 2048: Context size
    # -fa: Flash attention
    # --mlock: Force VRAM/RAM residency
    # -ngl 999: Offload all layers to GPU
    nix develop .#cuda --command llama-server \
        -m "$MODEL_PATH" \
        --host 0.0.0.0 \
        --port "$PORT" \
        -c 2048 \
        -fa \
        -ngl 999 \
        --mlock \
        --nobuffer > /dev/null 2>&1 &
    
    echo "==> Waiting for llama-server to initialize..."
    sleep 10
fi

if curl -sf "http://localhost:${PORT}/health" > /dev/null; then
    echo "==> Model residency established (Node A Nix/CUDA)."
    echo "    Open-Reasoner-Zero-1.5B  → VRAM resident (llama-server)"
    echo "    Port: $PORT"
else
    echo "ERROR: llama-server failed to start." >&2
    exit 1
fi

echo ""
echo "ZeroClaw Node A ready for Phase 25 operation."
