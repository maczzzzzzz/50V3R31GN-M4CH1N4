#!/usr/bin/env bash
# zeroclaw/scripts/setup-resident-models.sh
# Phase 22.5 Task 3 — Force-load resident models into Node A VRAM
# Usage: bash zeroclaw/scripts/setup-resident-models.sh
set -euo pipefail

OLLAMA_URL="http://localhost:11434"

echo "==> Checking Ollama availability..."
if ! curl -sf "${OLLAMA_URL}/api/tags" > /dev/null; then
    echo "ERROR: Ollama is not running at ${OLLAMA_URL}. Start it first." >&2
    exit 1
fi

echo "==> Pulling llama3.2:1b (VSB Judge + ClawLink)..."
ollama pull llama3.2:1b

echo "==> Warming up llama3.2:1b (force VRAM residency)..."
curl -sf -X POST "${OLLAMA_URL}/api/generate" \
    -H "Content-Type: application/json" \
    -d '{"model":"llama3.2:1b","prompt":".","stream":false}' \
    > /dev/null

echo "==> Model residency established."
echo "    llama3.2:1b  → VRAM resident (Ollama)"
echo "    falcon-0.3b  → ONNX session on demand (CPU/CUDA)"
echo ""
echo "ZeroClaw Node A ready for Phase 22.5 operation."
