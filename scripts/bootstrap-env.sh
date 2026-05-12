#!/usr/bin/env bash
# bootstrap-env.sh — Provision ~/.hermes/.env with required Sovereign secrets.
set -euo pipefail

ENV_FILE="$HOME/.hermes/.env"
mkdir -p "$(dirname "$ENV_FILE")"

# Check existing
if [ -f "$ENV_FILE" ]; then
    echo ":: Found existing $ENV_FILE"
else
    touch "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    echo ":: Created $ENV_FILE"
fi

# SOVEREIGN_MESH_SECRET — required for VSB pulse authentication
if grep -q "^SOVEREIGN_MESH_SECRET=" "$ENV_FILE" 2>/dev/null; then
    echo ":: SOVEREIGN_MESH_SECRET already set"
else
    if [ -n "${SOVEREIGN_MESH_SECRET:-}" ]; then
        echo "SOVEREIGN_MESH_SECRET=$SOVEREIGN_MESH_SECRET" >> "$ENV_FILE"
        echo ":: SOVEREIGN_MESH_SECRET written from environment"
    else
        SECRET=$(openssl rand -hex 32)
        echo "SOVEREIGN_MESH_SECRET=$SECRET" >> "$ENV_FILE"
        echo ":: SOVEREIGN_MESH_SECRET generated (32-byte random hex)"
        echo ":: IMPORTANT: Copy this secret to all mesh nodes' ~/.hermes/.env"
    fi
fi

# HERMES_API_TOKEN — required by provider profile
if grep -q "^HERMES_API_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    echo ":: HERMES_API_TOKEN already set"
else
    if [ -n "${HERMES_API_TOKEN:-}" ]; then
        echo "HERMES_API_TOKEN=$HERMES_API_TOKEN" >> "$ENV_FILE"
        echo ":: HERMES_API_TOKEN written from environment"
    else
        TOKEN=$(openssl rand -hex 16)
        echo "HERMES_API_TOKEN=$TOKEN" >> "$ENV_FILE"
        echo ":: HERMES_API_TOKEN generated (16-byte random hex)"
    fi
fi

echo ""
echo ":: Environment bootstrap complete."
echo ":: Secrets written to $ENV_FILE (permissions: $(stat -c '%a' "$ENV_FILE" 2>/dev/null || stat -f '%Lp' "$ENV_FILE" 2>/dev/null))."
echo ":: Deploy the same SOVEREIGN_MESH_SECRET to all mesh nodes for pulse auth."
