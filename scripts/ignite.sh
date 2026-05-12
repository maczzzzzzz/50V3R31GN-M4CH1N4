#!/usr/bin/env bash
# Sovereign Machina Unified Ignition Script (v3.6.0-ALPHA)
# Materialized for Stable Mesh Alpha Baseline.

set -euo pipefail

echo ":: [IGNITE] Sovereign Machina Alpha Baseline Start"

# 1. Clean up stale processes
echo ":: [IGNITE] Purging existing services..."
pkill -f "litellm" || true
pkill -f "hermes gateway" || true
pkill -f "hermes dashboard" || true

# 2. Verify Zero-Trust Artery
if ! tailscale status >/dev/null 2>&1; then
    echo ":: [ERROR] Tailscale Artery is INACTIVE. Aborting ignition."
    exit 1
fi
echo ":: [IGNITE] Tailscale Artery is ONLINE."

# 3. Ignite Windows GPU Bridge (Node B VRAM)
echo ":: [IGNITE] Launching Windows GPU Bridge (llama-server.exe)..."
# Launch in a new Windows PowerShell window to maintain visibility
/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd D:\llama.cpp; .\llama-server.exe -m D:\llama.cpp\models\Qwen3-14B-Q6_K.gguf --host 0.0.0.0 --port 8080 --n-gpu-layers 35 --ctx-size 32000 --cache-type-k q4_0 --api-key machina-sovereign-mesh-v3-secret-key'" || echo ":: [WARNING] Could not trigger Windows process. Manual launch required."

# 4. Ignite Sovereign Proxy (LiteLLM)
echo ":: [IGNITE] Launching Sovereign Proxy (LiteLLM) on Port 4000..."
LITELLM_LOG=debug nohup litellm --config sidecars/mesh/litellm-mesh.yaml --port 4000 --host 0.0.0.0 > /home/nixos/.hermes/proxy.log 2>&1 &
disown

# 5. Ignite Hermes Gateway
echo ":: [IGNITE] Launching Hermes Gateway..."
PYTHONPATH=sidecars/hermes-agent-nous nohup python3 sidecars/hermes-agent-nous/hermes_cli/main.py gateway run --accept-hooks > /home/nixos/.hermes/gateway.log 2>&1 &
disown

# 6. Ignite Hermes Dashboard Backend
echo ":: [IGNITE] Launching Hermes Dashboard Backend (Port 8642)..."
PYTHONPATH=sidecars/hermes-agent-nous nohup python3 sidecars/hermes-agent-nous/hermes_cli/main.py dashboard --no-open > /home/nixos/.hermes/dashboard.log 2>&1 &
disown

echo ":: [IGNITE] Mesh Alpha Baseline Materialized."
echo ":: Run 'tail -f /home/nixos/.hermes/proxy.log' for routing telemetry."
