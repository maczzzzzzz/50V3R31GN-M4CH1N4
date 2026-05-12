#!/usr/bin/env bash
# Sovereign Machina Unified Ignition Script (v3.5.0-BETA)
# Materialized for Hierarchy of Responsiveness Verification.

set -euo pipefail

echo ":: [IGNITE] Sovereign Machina Session Start"

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

# 3. Ignite Sovereign Proxy (LiteLLM)
echo ":: [IGNITE] Launching Sovereign Proxy (LiteLLM) on Port 4000..."
# Using --debug for radical candor in logs during verification
LITELLM_LOG=debug nohup litellm --config nix/hosts/node-b/litellm-mesh.yaml --port 4000 --host 0.0.0.0 > /home/nixos/.hermes/proxy.log 2>&1 &
disown

# 4. Ignite Hermes Gateway
echo ":: [IGNITE] Launching Hermes Gateway..."
PYTHONPATH=sidecars/hermes-agent-nous nohup python3 sidecars/hermes-agent-nous/hermes_cli/main.py gateway run --accept-hooks > /home/nixos/.hermes/gateway.log 2>&1 &
disown

# 5. Ignite Hermes Dashboard Backend
echo ":: [IGNITE] Launching Hermes Dashboard Backend (Port 8642)..."
PYTHONPATH=sidecars/hermes-agent-nous nohup python3 sidecars/hermes-agent-nous/hermes_cli/main.py dashboard --no-open > /home/nixos/.hermes/dashboard.log 2>&1 &
disown

echo ":: [IGNITE] Mesh Backend Materialized."
echo ":: Run 'tail -f /home/nixos/.hermes/proxy.log' for routing telemetry."
