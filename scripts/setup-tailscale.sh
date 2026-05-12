#!/usr/bin/env bash
#
# Tailscale Setup Script - Robust Quaternary Orchestration
# 50V3R31GN-M4CH1N4 Zero-Trust Artery
#

set -e

echo "================================================"
echo "  TAILSCALE SETUP - ZERO-TRUST ARTERY (v3.1)"
echo "================================================"

# Node Definitions (Alias:IP:User)
# Note: Node B is often 'nixos', others are 'maczz'
NODES=(
    "node-a:10.0.0.10:maczz"
    "node-b:10.0.0.11:nixos"
    "node-c:10.0.0.12:maczz"
    "node-d:10.0.0.13:maczz"
)

LOCAL_HOSTNAME=$(hostname)
echo ":: Local hostname detected: $LOCAL_HOSTNAME"

for item in "${NODES[@]}"; do
    IFS=':' read -r ALIAS IP USER <<< "$item"
    
    echo ""
    echo ":: Processing $ALIAS ($IP) as user $USER..."
    
    # 1. Connectivity Check
    if [ "$ALIAS" != "$LOCAL_HOSTNAME" ] && ! ping -c 1 -W 2 "$IP" > /dev/null 2>&1; then
        echo "   [ERROR] Node $ALIAS ($IP) is UNREACHABLE. Skipping."
        continue
    fi
    
    # 2. Tailscale Up
    if [ "$ALIAS" == "$LOCAL_HOSTNAME" ]; then
        echo "   [LOCAL] Running Tailscale on current host..."
        sudo tailscale up --ssh --operator=$USER
    else
        echo "   [REMOTE] Orchestrating via SSH (TTY allocated)..."
        # We use -t twice to force TTY allocation even if local isn't one
        ssh -tt "${USER}@${IP}" "sudo tailscale up --ssh"
    fi
done

echo ""
echo "================================================"
echo "  VERIFYING MESH STATUS"
echo "================================================"
tailscale status

echo ""
echo ":: SETUP ATTEMPT COMPLETE"
echo ":: If a node failed, ensure it is powered on and SSH is active."
echo ":: Remember to authenticate via the URLs provided by 'tailscale up'."
