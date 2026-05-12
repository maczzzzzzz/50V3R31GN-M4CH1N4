#!/usr/bin/env bash
#
# Phase 2 Deployment Script - Zero-Trust Artery (v3.2)
#
# Deploys:
# 1. Rust crates (Pre-built binaries via Nix)
# 2. Hermes plugins (Synced from submodule)
# 3. Mesh Configuration (Tailscale IPs)
#

set -euo pipefail

# Node definitions (Tailscale Artery)
NODE_A="100.90.196.70"
NODE_B="100.66.173.31"  # Local
NODE_C="100.102.109.81"
NODE_D="100.120.225.12"

# SSH user
SSH_USER="maczz"

echo "================================================"
echo "  PHASE 2 DEPLOY - ZERO-TRUST ARTERY (v3.2)"
echo "================================================"

# Step 1: Build all Rust crates via Nix locally
echo ":: Building Rust crates locally on Node B..."
CRATES=(
    "zeroboot-isolation"
    "matlab-mcp-bridge"
    "goose-execution"
    "graphify-ast"
    "vibevoice-asr"
    "voxcpm-tts"
    "directors-forge"
    "consensus-alignment"
)

# Ensure local bin exists
mkdir -p ~/.local/bin

for crate in "${CRATES[@]}"; do
    echo "   - Building $crate..."
    nix build .#$crate
    # Copy to local bin and remote nodes
    cp -fL result/bin/* ~/.local/bin/
    
    # Assign crates to specific nodes per topology
    case $crate in
        "consensus-alignment")
            TARGETS=($NODE_A)
            ;;
        "vibevoice-asr" | "voxcpm-tts" | "graphify-ast")
            TARGETS=($NODE_C)
            ;;
        "zeroboot-isolation" | "matlab-mcp-bridge")
            TARGETS=($NODE_D)
            ;;
        *)
            TARGETS=()
            ;;
    esac

    for target in "${TARGETS[@]}"; do
        echo "     -> Pushing to $target..."
        ssh -o StrictHostKeyChecking=accept-new "$SSH_USER@$target" "mkdir -p ~/.local/bin"
        rsync -avz --chmod=u+w result/bin/ "$SSH_USER@$target:~/.local/bin/"
    done

    rm result
done

echo ":: Rust crates deployed."

# Step 2: Deploy Hermes plugins to all nodes
echo ":: Deploying Hermes plugins to mesh logic cores..."
PLUGIN_TARGETS=($NODE_A $NODE_C $NODE_D)

for target in "${PLUGIN_TARGETS[@]}"; do
    echo "   -> Syncing plugins to $target..."
    ssh "$SSH_USER@$target" "mkdir -p ~/.hermes/plugins"
    rsync -avz sidecars/hermes-agent-nous/plugins/ "$SSH_USER@$target:~/.hermes/plugins/"
done

# Step 3: Update Hermes config on all nodes
echo ":: Materializing Quaternary Config (Tailscale IPs)..."

HERMES_CONFIG="
memory_providers:
  hermes-lcm:
    type: memory
    config:
      db_path: ~/.hermes/lcm.db
      max_context_tokens: 128000
      summary_interval: 32000

model_providers:
  sovereign-vsb:
    type: model
    config:
      mesh_nodes:
        - id: node-a
          ip: $NODE_A
          port: 8000
          models: [falcon, embedding]
        - id: node-b
          ip: $NODE_B
          port: 9119
          models: [carnice-9b, qwen3-vl]
        - id: node-c
          ip: $NODE_C
          port: 8080
          models: [voxcpm2-indic-q4, qwen3.5-0.8b]
        - id: node-d
          ip: $NODE_D
          port: 8000
          models: [qwen2.5-coder-14b]
      tokenspeed_url: http://$NODE_D:8000
      pulse_enabled: true

hooks:
  psy-core:
    type: general
    config:
      strict_mode: true
      audit_log_path: ~/.hermes/psy-audit.log
"

# Deploy config to all nodes
for target in "${PLUGIN_TARGETS[@]}"; do
    ssh "${SSH_USER}@${target}" "mkdir -p ~/.hermes"
    echo "${HERMES_CONFIG}" | ssh "${SSH_USER}@${target}" "cat > ~/.hermes/config.yaml"
done

# Update Node B config (local)
mkdir -p ~/.hermes
echo "${HERMES_CONFIG}" > ~/.hermes/config.yaml

echo ":: Hermes config updated mesh-wide."

# Step 4: Final verification and restart
echo ":: Restarting Hermes services..."
for target in "${PLUGIN_TARGETS[@]}"; do
    ssh "${SSH_USER}@${target}" "hermes restart || echo 'Manual restart required on $target'"
done

echo "================================================"
echo "  ✅ PHASE 2 DEPLOY COMPLETE (Artery Bound)"
echo "================================================"
